import { SerialPort } from 'serialport';

export interface Repeater {
    callsign: string,
    ssid: number
}

export interface EncodedAxezFrame extends Iterable<number> { }

export interface DecodedAxezFrame {
    source: string,
    destination: string,
    sourceSSID: number,
    destinationSSID: number,
    message: string,
    repeaters: Repeater[],
    aprs: boolean
}

/**
 * 
 * @param decodedFrame - A JSON object containing the data that you wish so send.
 * @returns your frame encoded in the AX.25 standard, suitable for sending to your TNC or software modem.
 */
export function createFrame(decodedFrame: DecodedAxezFrame): EncodedAxezFrame {

    // create frame with FEND code at the beginning
    let frame: number[] = [192, 0];
    let destination: number[] = (decodedFrame.destination.toString().toLocaleUpperCase() + "      ").split('').map(val => {
        return val.charCodeAt(0) * 2;
    });

    // get callsign, maximum length of 6
    if (destination.length > 6) {
        destination = destination.slice(0, 6);
    }
    for (let i: number = 0; i < destination.length; i++) {
        frame.push(destination[i]);
    }

    // check destination SSID length, and encode if it meets requirements. default to 0
    let destinationSSID: number = (decodedFrame.destinationSSID < 16 && decodedFrame.destinationSSID > -1 ? decodedFrame.destinationSSID : 0)
    frame.push(96 + (destinationSSID * 2));

    // encode source callsign and encode, truncate if too long
    let source: number[] = (decodedFrame.source.toString().toUpperCase() + "      ").split('').map(val => {
        return val.charCodeAt(0) * 2;
    });
    if (source.length > 6) {
        source = source.slice(0, 6);
    }
    for (let i: number = 0; i < source.length; i++) {
        frame.push(source[i]);
    }

    // check source SSID length, and encode if it meets requirements. default to 0
    let sourceSSID: number = (decodedFrame.sourceSSID < 16 && decodedFrame.sourceSSID > -1 ? decodedFrame.sourceSSID : 0);
    if (!decodedFrame.repeaters || !decodedFrame.repeaters.length) {
        frame.push(224 + (sourceSSID * 2) + 1); // TODO: figure out why add 224, multiply by 2, and add one? code works though
    } else {
        frame.push(224 + (sourceSSID * 2)); // TODO: figure out why add 224 and multiply by 2? code works though
    }

    // encode repeaters, if any
    let repeaters: Repeater[] = decodedFrame.repeaters || [];
    if (repeaters.length > 0) {
        for (let i: number = 0; i < repeaters.length; i++) {
            let repeater: number[] = (repeaters[i].callsign.toUpperCase() + "      ").split('').map(val => {
                return val.charCodeAt(0) * 2;
            }).slice(0, 6); // truncate if necessary
            for (let j: number = 0; j < repeater.length; j++) {
                frame.push(repeater[j]);
            }
            if (i === repeaters.length - 1) { // encode repeater SSIDs, default to 0
                frame.push(((repeaters[i].ssid || 0) * 2) + 1);
            } else {
                frame.push(((repeaters[i].ssid || 0) * 2));
            }
        }
    }

    // Control
    if (!decodedFrame.aprs) {
        frame.push(0);
    } else {
        frame.push(3);
    }

    // PID
    frame.push(240);

    // encode actual mesage portion of frame
    let content = decodedFrame.message.split('').map(val => {
        return val.charCodeAt(0);
    });
    for (let i = 0; i < content.length; i++) {
        frame.push(content[i]);
    }

    // add final FEND frame
    frame.push(192);

    // return fully encoded frame
    return frame;
};

/**
 * Decode a raw AX.25 frame from your TNC or software modem into a JSON object.
 * @param encodedAxezFrame - The raw frame from your TNC or software modem, still encoded in AX.25 and not usable.
 * @returns A decoded frame in JSON format that you can read and write to.
 */
export function readFrame(encodedAxezFrame: EncodedAxezFrame): DecodedAxezFrame {

    // JSON object to hold our decoded frame information and return later
    let frame: DecodedAxezFrame = {} as DecodedAxezFrame;

    // convert the encoded frame into a format that we can iterate through
    let result: number[] = Array.from(new Uint8Array(encodedAxezFrame));

    // get the encoded destination callsign
    frame.destination = result.slice(2, 8).map(val => {
        return String.fromCharCode(val / 2); // TODO: why divide by 2
    }).join('').trim();
    frame.destinationSSID = result.slice(8)[0] - 97; // why???
    // fixed bug here. SourceSSID was being coerced to int through parseInt (which is only supposed to take a string arg). Math.floor is safer.
    // sourceSSID needs to be rounded down, as a decimal can be accidentally added as a result of dividing by 2
    frame.destinationSSID = (frame.destinationSSID > 0) ? Math.floor(frame.destinationSSID / 2) + 1 : 0;

    // get the encoded source callsign
    frame.source = result.slice(9, 15).map(val => {
        return String.fromCharCode(val / 2); // TODO: why divide by 2
    }).join('').trim();
    frame.sourceSSID = result.slice(15)[0] - 224; // TODO: why???
    // fixed bug here. SourceSSID was being coerced to int through parseInt (which is only supposed to take a string arg). Math.floor is safer.
    // sourceSSID needs to be rounded down, as a decimal can be accidentally added as a result of dividing by 2
    frame.sourceSSID = (frame.sourceSSID > 0) ? Math.floor(frame.sourceSSID / 2) : 0; 

    // check if encoded frame contains repeater info
    let repeaters: any[];  // TODO: code works but definitively type this
    let hasRepeaters: boolean = false;
    if (result.slice(15)[0] / 2 === (result.slice(15)[0] / 2)) { // TODO: why???
        hasRepeaters = true;
    }

    // if so set end? position of repeaters, and decode repeaters
    let position: number = 18;
    if (hasRepeaters) {
        let tail: number[] = result.slice(16, result.length - 1);
        let parts = [];
        for (let i = 0; i < tail.length; i += 7) {
            parts.push(tail.slice(i, i + 7));
        }
        let allFound = false;
        for (let j = 0; j < parts.length; j++) {
            if (parts[j].length < 7 || (parts[j][0] % 2 !== 0 && parts[j][0] !== 0)) {
                repeaters = parts.slice(0, j);
                break;
            }
            let odds = 0;
            for (let k = 0; k < parts[j].length; k++) {
                if (parts[j][k] % 2 !== 0) {
                    odds++;
                    if (odds === 2) {
                        allFound = true;
                        repeaters = parts.slice(0, j);
                        break;
                    }
                }
            }
            if (allFound) {
                break;
            }
        }
        for (let i = 0; i < repeaters.length; i++) {
            let callsign: string = repeaters[i].slice(0, 6).map((val: number) => { return String.fromCharCode(val / 2); }).join('').trim();
            let ssid: number = repeaters[i].slice(6)[0] / 2;
            repeaters[i] = { callsign, ssid };
        }
        position += (7 * repeaters.length);
    }
    frame.repeaters = repeaters;

    // decode actual message contents of frame
    frame.message = result.slice(position, -1).map(val => {
        return String.fromCharCode(val);
    }).join('');

    // return decoded frame
    return frame;
}

/**
 * Opens a serial port configured to work with TNCs and software modems.
 * @param kissPath - The serial port to send to. Platform specific, ex: /tmp/kisstnc on Linux, COM5 on Windows, etc.
 * @param baudRate - Optionally customizable baud rate, the default is the 1200 baud packet radio standard.
 * @returns A configured serial port connection that you can listen and write to.
 */
export function openPort(kissPath: string, baudRate = 1200): SerialPort {
    return new SerialPort({
        "path": kissPath,
        "baudRate": baudRate,
        "lock": false
    });
};
