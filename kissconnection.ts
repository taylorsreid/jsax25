import { Socket, createConnection } from 'net';
import { SerialPort } from 'serialport';
import { EventEmitter } from 'stream';
import JSONB from 'json-buffer'
import { brotliCompressSync, brotliDecompressSync } from 'zlib';

/** A repeater used in a sent or received packet's repeater path. */
export interface Repeater {
    callsign: string,
    ssid: number,
    hasBeenRepeated: boolean
}

// not exported because the goal is for the user to never have to deal with encoded packets
interface EncodedKissFrame extends Iterable<number> { }

/** Any type of data that can be serialized and sent over AX.25 / AFSK */
export type Serializable = string | number | JSON | Object | string[] | number[] | JSON[] | Object[] | Serializable[] // not sure about this last one

/**
 * @attribute source?: string - The sender's amateur radio callsign. Optional when sending via the class instance send() method because it can be set in the constructor.
 * @attribute sourceSsid?: number - The sender's SSID. Default 0 if not defined.
 * @attribute destination: string - The destination amateur radio callsign.
 * @attribute destinationSsid?: number - The destination's SSID. Default 0 if not defined.
 * @attribute payload: Serializable - The payload/body of your packet frame. Can be of multiple different types, see exported Serializable interface for exact allowed types.
 * @attribute repeaters?: Repeater[] - The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined.
 * @attribute aprs?: boolean - Whether the packet is an APRS packet.
 */
export interface DecodedKissFrame {
    /** The destination amateur radio callsign. */
    destinationCallsign: string,
    /** The destination's SSID. Default 0 if not defined. */
    destinationSsid?: number,
    /**  */
    destinationAcceptsCompression?: boolean,
    /**  */
    destinationSendsCompression?: boolean,
    /** Whether the frame is a command frame from the destination or not. Must be opposite of sourceCommand. */
    destinationCommand?: boolean, // command = true = 1, response = false = 0, inverted from sourceCommand
    /** The sender's callsign. Optional when sending via the class instance send() method because it can be set in the constructor. */
    sourceCallsign: string,
    /** The sender's SSID. Default 0 if not defined. */
    sourceSsid?: number,
    /**  */
    sourceAcceptsCompression?: boolean,
    /**  */
    sourceSendsCompression?: boolean,
    /** Whether the frame is a command frame from the source or not. Must be opposite of destinationCommand. */
    sourceCommand?: boolean // command = true = 0, response = false = 1
    /** The payload/body of your packet frame. Can be of multiple different types, see exported Serializable interface for exact allowed types. */
    payload: Serializable,
    /** The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined. */
    repeaters?: Repeater[],
    frameType: 'information'|'supervisory'|'unnumbered',
    modulo?:8|128 // TODO: implement modulo 128, only doing the default of modulo 8 for now
    pid?: number|null
}

// /**
//  * @attribute sourceCallsign: string - 
//  */
// export interface KissFrameWithSource extends Omit<KissFrameOptionalSource, 'sourceCallsign'> {
//     /** The sender's callsign. Required when the sender callsign is not set in the KissConnection instance's constructor. */
//     sourceCallsign: string
// }

// the payload field must be made into a string before encoding into AX.25
// // not exported because the user should never need to touch these
// interface KissStringPayloadFrame extends Omit<KissFrameWithSource, 'payload'> {
//     payload: string
// }

/**
 * @attribute callsign?: string - Your amateur radio callsign. Optional, but if you do not provide it to the constructor object, it must be included in every frame object passed to the send() method.
 * @attribute ssid?: number - Your station SSID. Default 0 if not defined.
 * @attribute serialPort?: string - The path to your TNC or software modem's serial port. If defined, it will override any TCP options that you include. Leave blank to use TCP. No default.
 * @attribute serialBaud?: number - A custom baud rate for your TNC or software modem's serial port. Default 1200 (most common) if not defined.
 * @attribute tcpHost?: string - The IP address or URL to your TNC or software mode. Default '127.0.0.1' (most common) if not defined.
 * @attribute tcpPort?: number - The TCP port to your TNC or software modem. Default 8100 (most common) if not defined.
 * @attribute compression?: boolean - Enable optional compression of the payload/body portion of the packet using the brotli algorithm. Callsigns and SSIDs are not compressed in the spirit of amateur radio. Note that regardless of setting, if for some reason the compressed version is larger than the uncompressed version, the uncompressed version is sent. Default false if not defined.
 * @attribute suppressConnectionErrors:? boolean - Mostly used for development and debugging. SerialPort and Socket will by default print errors to the console, set this to true to disable them. Default false if not defined.
 */
export interface KissConnectionConstructor {
    /** Your amateur radio callsign. Optional, but if you do not provide it to the constructor object, it must be included in every frame object passed to the send() method. */
    callsign?: string,
    /** Your station SSID. Default 0 if not set. */
    ssid?: number,
    /** The path to your TNC or software modem's serial port. If defined, it will override any TCP options that you include. Leave blank to use TCP.  No default. */
    serialPort?: string,
    /** A custom baud rate for your TNC or software modem's serial port. Default 1200 (most common) if not defined. */
    serialBaud?: number
    /** The IP address or URL to your TNC or software mode. Default '127.0.0.1' (most common) if not defined. */
    tcpHost?: string,
    /** The TCP port to your TNC or software modem. Default 8100 (most common) if not defined. */
    tcpPort?: number,
    /** Enable optional compression of the payload/body portion of the packet using the brotli algorithm. Callsigns and SSIDs are not compressed in the spirit of amateur radio. Note that regardless of setting, if for some reason the compressed version is larger than the uncompressed version, the uncompressed version is sent. Default false if not defined. */
    compression?: boolean
    /** Mostly used for testing. SerialPort and Socket will by default print errors to the console, set this to true to disable them. Default false if not defined. */
    suppressConnectionErrors?: boolean
}

/**
 * A SerialPort/Socket connection to a TNC or software modem that builds, compresses (optional), sends, receives, decodes, decompresses, and emits AX.25 packets for amateur radio use.
 * 
 * See interface KissConnectionConstructor for constructor options.
 * 
 * send(frameOrFrames:KissFrameOptionalSource|KissFrameOptionalSource[]) takes unencoded kiss frame(s) (see interface KissFrameOptionalSource for format), runs them through the above mentioned processes, and sends them immediately.
 * 
 * On receive, emits events like the SerialPort, Socket, and EventEmitter classes,
 * you can listen for incoming data with the instance's on(CHANNEL_NAME, (decodedPacket) => {}) method, where channel name is one of three options:
 *   on('data', (frame:KissFrameWithSource) => {//do stuff}) emits all received packets, regardless of source callsign, source SSID, destination callsign, or destination SSID.
 *   on('callsign', (frame:KissFrameWithSource) => {//do stuff}) emits packets that are addressed to your callsign regardless of whether it matches your set SSID
 *   on('callsignSsid', (frame:KissFrameWithSource) => {//do stuff}) only emits packets that are addressed to both your set callsign and your set SSID (which is 0 if you don't set one)
 *   You can listen to any single channel or combination of channels that you wish.
 */
export class KissConnection extends EventEmitter {

    private conn: SerialPort | Socket
    private callsign: string
    private ssid: number
    private serialPort: string
    private serialBaud: number
    private tcpHost: string
    private tcpPort: number
    private compression: boolean
    private suppressConnectionErrors: boolean
    private modulo: number  // TODO: implement module 128, only doing the default of module 8 for now
    private sentFrames: EncodedKissFrame[]

    /**
     * @attribute callsign?: string - Your amateur radio callsign. Optional, but if you do not provide it to the constructor object, it must be included in every frame object passed to the send() method.
     * @attribute ssid?: number - Your station SSID. Default 0 if not defined.
     * @attribute serialPort?: string - The path to your TNC or software modem's serial port. If defined, it will override any TCP options that you include. Leave blank to use TCP. No default.
     * @attribute serialBaud?: number - A custom baud rate for your TNC or software modem's serial port. Default 1200 (most common) if not defined.
     * @attribute tcpHost?: string - The IP address or URL to your TNC or software mode. Default '127.0.0.1' (most common) if not defined.
     * @attribute tcpPort?: number - The TCP port to your TNC or software modem. Default 8100 (most common) if not defined.
     * @attribute compression?: boolean - Enable optional compression of the payload/body portion of the packet using the brotli algorithm. Callsigns and SSIDs are not compressed in the spirit of amateur radio. Note that regardless of setting, if for some reason the compressed version is larger than the uncompressed version, the uncompressed version is sent. Default false if not defined.
     * @attribute suppressConnectionErrors:? boolean - Mostly used for testing. SerialPort and Socket will by default print errors to the console, set this to true to disable them. Default false if not defined.
     */
    constructor(options?: {
        callsign?: string,
        ssid?: number,
        serialPort?: string,
        serialBaud?: number
        tcpHost?: string,
        tcpPort?: number,
        compression?: boolean
        suppressConnectionErrors?: boolean
        modulo?: number  // TODO: implement module 128, only doing the default of module 8 for now
    }) {

        super()

        // set all class properties, include defaults
        this.callsign = options.callsign
        this.ssid = options.ssid ?? 0
        this.serialPort = options.serialPort
        this.serialBaud = options.serialBaud ?? 1200
        this.tcpHost = options.tcpHost ?? '127.0.0.1'
        this.tcpPort = options.tcpPort ?? 8100
        this.compression = options.compression ?? false
        this.suppressConnectionErrors = options.suppressConnectionErrors ?? false
        this.modulo = options.modulo ?? 8  // TODO: implement module 128, only doing the default of module 8 for now

        // if serial connection selected, create. else create tcp
        if (this.serialPort) {
            this.conn = new SerialPort({
                path: this.serialPort,
                baudRate: this.serialBaud,
                lock: false
            })
        }
        else {
            this.conn = createConnection({
                host: this.tcpHost,
                port: this.tcpPort
            })
        }

        // suppress annoying console.log() if enabled
        if (!this.suppressConnectionErrors) {
            this.conn.on('error', () => { })
        }

        // attach event listener upon object instantiation
        this.conn.on('data', (data) => {

            // decode frame to emit
            const decodedFrame = KissConnection.decode(data)

            // emit the data to the unfiltered channel in case the dev wants to listen for both data addressed to them and not addressed to them
            this.emit('data', decodedFrame)

            if (decodedFrame.destinationCallsign === this.callsign) {
                this.emit('callsign', decodedFrame)
            }

            // emit data to the filtered channel if it matches the callsign and ssid
            if (decodedFrame.destinationCallsign === this.callsign && decodedFrame.destinationSsid === this.ssid) {
                this.emit('callsignSsid', decodedFrame)
            }

            // if (decodedFrame.frameType === 'supervisory') {
            //     //TODO: implement resending if supervisory frame is requesting it
            // }

        })
    }

    /**
     * Check to see if the connection is open.
     */
    public isConnected(): boolean {
        return !this.conn.closed
    }

    public close(): void {
        this.conn.end()
    }

    /**
     * Check if errors are currently being suppressed. The SerialPort and Socket classes that this class wraps may print annoying errors to the console if errors are not suppressed.
     */
    public isSuppressedErrors(): boolean {
        return this.suppressConnectionErrors
    }

    /**
     * Change the error suppression state. The SerialPort and Socket classes that this class wraps may print annoying errors to the console if errors are not suppressed.
     */
    public setSuppressedErrors(suppressErrors: boolean): void {
        this.suppressConnectionErrors = suppressErrors
    }

    /**
     * Check if the current connection is a serial connection.
     */
    public isSerial(): boolean {
        return this.conn instanceof SerialPort
    }

    /**
     * Get the current serial port in use. If you wish to change this, you will have to create a new connection with a new instantiation of this class or by calling setConnection()
     * @returns a string containing the address of your serial port, ex COM5 on Windows, or /dev/myTnc on Linux based systems
     */
    public getSerialPort(): string {
        return this.serialPort
    }

    /**
     * Get the current serial port baud rate. If you wish to change this, you will have to create a new connection with a new instantiation of this class or by calling setConnection()
     * @returns a number corresponding to current the baud rate in use, the most commonly used in amateur radio is 1200, followed by 9600 for people with more advanced equipment.
     */
    public getSerialBaud(): number {
        return this.serialBaud
    }

    /**
     * Check if the current connection is a TCP socket connection.
     */
    public isTcp(): boolean {
        return this.conn instanceof Socket
    }

    /**
     * Get the IP address of the current TCP connection. Most commonly 127.0.0.1
     * @returns a string containing the address.
     */
    public getTcpHost(): string {
        return this.tcpHost
    }

    /**
     * Get the current TCP TNC or sound modem port in use.
     */
    public getTcpPort(): number {
        return this.tcpPort
    }

    /**
     * Get the current connection in use to manage manually.
     * @returns a configured SerialPort or Socket instance.
     */
    public getConnection(): SerialPort | Socket {
        return this.conn
    }

    /**
     * Allows you to modify the existing connection without creating a new instance of the class.
     * serialPort takes priority over tcpHost, meaning that if you set both then a serial connection will be created.
     * serialBaud will default to 1200 if not set.
     * tcpHost will default to 127.0.0.1 if not set and tcpPort will default to 8100 if not set.
     * This means that if you set none of the configuration options, the connection will be set to a TCP connection to 127.0.0.1:8100
     */
    public setConnection(options: {
        serialPort?: string,
        serialBaud?: number
        tcpHost?: string,
        tcpPort?: number,
    }): void {
        if (options.serialPort) {
            this.conn = new SerialPort({
                path: options.serialPort,
                baudRate: options.serialBaud ?? 1200,
                lock: false
            })
        }
        else {
            this.conn = createConnection({
                host: options.tcpHost ?? '127.0.0.1',
                port: options.tcpPort ?? 8100
            })
        }
    }

    private static validate(decodedFrame: DecodedKissFrame): DecodedKissFrame {

        // check that payload is of an acceptable before spending CPU cycles try to serialize it
        if (!Array.isArray(decodedFrame.payload) || typeof decodedFrame.payload !== 'object' || typeof decodedFrame.payload !== 'number' || typeof decodedFrame.payload !== 'string') {
            throw new Error(`Unsupported payload field type: ${typeof decodedFrame.payload}`)
        }
        
        // source ssid can just be set to 0 as default
        decodedFrame.sourceSsid ??= 0
        
        // destination ssid can just be set to 0
        decodedFrame.destinationSsid ??= 0
        return decodedFrame
    }

    // private encodeRawFrame(stringpayloadFrame: KissStringPayloadFrame): EncodedKissFrame {
    //     return KissConnection.encodeRawFrame(stringpayloadFrame)
    // }

    // private static encodeRawFrame(stringpayloadFrame: KissStringPayloadFrame): EncodedKissFrame {

    //     // create frame with FEND code at the beginning
    //     let frame: number[] = [192, 0];
    //     let destination: number[] = (stringpayloadFrame.destinationCallsign.toString().toLocaleUpperCase() + "      ").split('').map(val => {
    //         return val.charCodeAt(0) * 2;
    //     });

    //     // get callsign, maximum length of 6
    //     if (destination.length > 6) {
    //         destination = destination.slice(0, 6);
    //     }
    //     for (let i: number = 0; i < destination.length; i++) {
    //         frame.push(destination[i]);
    //     }

    //     // check destination SSID length, and encode if it meets requirements. default to 0
    //     let destinationSSID: number = (stringpayloadFrame.destinationSsid < 16 && stringpayloadFrame.destinationSsid > -1 ? stringpayloadFrame.destinationSsid : 0)
    //     frame.push(96 + (destinationSSID * 2));

    //     // encode source callsign and encode, truncate if too long
    //     let source: number[] = (stringpayloadFrame.sourceCallsign.toString().toUpperCase() + "      ").split('').map(val => {
    //         return val.charCodeAt(0) * 2;
    //     });
    //     if (source.length > 6) {
    //         source = source.slice(0, 6);
    //     }
    //     for (let i: number = 0; i < source.length; i++) {
    //         frame.push(source[i]);
    //     }

    //     // check source SSID length, and encode if it meets requirements. default to 0
    //     let sourceSSID: number = (stringpayloadFrame.sourceSsid < 16 && stringpayloadFrame.sourceSsid > -1 ? stringpayloadFrame.sourceSsid : 0);
    //     if (!stringpayloadFrame.repeaters || !stringpayloadFrame.repeaters.length) {
    //         frame.push(224 + (sourceSSID * 2) + 1); // TODO: figure out why add 224, multiply by 2, and add one? code works though
    //     } else {
    //         frame.push(224 + (sourceSSID * 2)); // TODO: figure out why add 224 and multiply by 2? code works though
    //     }

    //     // encode repeaters, if any
    //     let repeaters: Repeater[] = stringpayloadFrame.repeaters || [];
    //     if (repeaters.length > 0) {
    //         for (let i: number = 0; i < repeaters.length; i++) {
    //             let repeater: number[] = (repeaters[i].callsign.toUpperCase() + "      ").split('').map(val => {
    //                 return val.charCodeAt(0) * 2;
    //             }).slice(0, 6); // truncate if necessary
    //             for (let j: number = 0; j < repeater.length; j++) {
    //                 frame.push(repeater[j]);
    //             }
    //             if (i === repeaters.length - 1) { // encode repeater SSIDs, default to 0
    //                 frame.push(((repeaters[i].ssid || 0) * 2) + 1);
    //             } else {
    //                 frame.push(((repeaters[i].ssid || 0) * 2));
    //             }
    //         }
    //     }

    //     // Control
    //     if (!stringpayloadFrame.aprs) {
    //         frame.push(0);
    //     } else {
    //         frame.push(3);
    //     }

    //     // PID
    //     frame.push(240);

    //     // encode actual mesage portion of frame
    //     let content: number[] = (stringpayloadFrame.payload as string).split('').map(val => {
    //         return val.charCodeAt(0);
    //     });
    //     for (let i = 0; i < content.length; i++) {
    //         frame.push(content[i]);
    //     }

    //     // add final FEND frame
    //     frame.push(192);

    //     // return fully encoded frame
    //     return frame;
    // };

    /**
     * Takes your unencoded KissInstanceFrame objects, validates them, optionally compressed them (configured in constructor), encodes them in KISS AX.25 format, and sends them immediately.
     * @param frameOrFrames - A single decoded KissInstanceFrame object or an array of them.
     * @returns the number of frames sent.
     */
    // public send(frameOrFrames: DecodedKissFrame | DecodedKissFrame[]): number {

    //     // here's where the send action actually happens
    //     const prepareFrame = (f: DecodedKissFrame): void => {
    //         try {
    //             const compressedFrame: KissStringPayloadFrame = this.compression ? this.compress(this.stringify(this.validate(f))) : this.stringify(this.validate(f)) // if compression enabled, compress using brotli
    //             this.conn.write(new Uint8Array(this.encodeRawFrame(compressedFrame))) // send frame
    //         }
    //         catch (error) {
    //             throw new Error(`Unable to encode frame(s) ${JSON.stringify(frameOrFrames)}\n${error}`)
    //         }
    //     }

    //     // if argument is array, loop through it and return number of frames sent
    //     if (Array.isArray(frameOrFrames)) {
    //         frameOrFrames.forEach(f => {
    //             prepareFrame(f)
    //         });
    //         return frameOrFrames.length
    //     }
    //     // if single frame, check for payload and send if so
    //     else if (frameOrFrames.payload) {
    //         prepareFrame(frameOrFrames)
    //         return 1
    //     }
    //     // return that no frames were sent
    //     else {
    //         return 0
    //     }

    // }

    /**
     * Static method to generate an encoded and optionally compressed (configured in constructor) single frame, does not send it.
     * This can be useful if you wish to manually manage your connection without using this class abstraction.
     * @param frameOrFrames - A single KissStaticFrame object.
     * @param compression - boolean value whether to compress the frames using brotli compression.
     * @returns A single encoded KISS AX.25 frame, suitable for sending to a Serial or Socket connection as is.
     */
    // public static getEncodedFrame(decodedFrame: KissFrameWithSource, compression = false): Uint8Array {
    //     const cf: KissStringPayloadFrame = compression ? KissConnection.compress(KissConnection.stringify(KissConnection.validate(decodedFrame))) :
    //         KissConnection.stringify(KissConnection.validate(decodedFrame)) // if compression enabled, compress using brotli
    //     return new Uint8Array(KissConnection.encodeRawFrame(cf)) // encode frame in AX.25 format
    // }

    /**
     * Static method to generate an encoded and optionally compressed (configured in constructor) array of frames, does not send them.
     * This can be useful if you wish to manually manage your connection without using this class abstraction.
     * @param frameOrFrames - An array of KissStaticFrame objects.
     * @param compression - boolean value whether to compress the frames using brotli compression.
     * @returns An array of encoded KISS frames, suitable for iteration through to send to a Serial or Socket connection.
     */
    // public static getEncodedFrames(frameOrFrames: KissFrameWithSource[], compression = false): Uint8Array[] {
    //     return frameOrFrames.map((f) => {
    //         return this.getEncodedFrame(f)
    //     })
    // }


    /**
     * Decode a raw AX.25 frame from your TNC or software modem into a JSON object.
     * @param encodedKissFrame - The raw frame from your TNC or software modem, still encoded in KISS + AX.25 and not usable by the end user.
     * @returns A decoded frame in JSON format that you can read and write to.
     */
    public static decode(encodedKissFrame: EncodedKissFrame): DecodedKissFrame {

        let encoded = Array.from(new Uint8Array(encodedKissFrame))

        if (encoded[0] === 0xC0) {
            encoded.shift() // shift to remove FEND KISS header and match indexes of AX.25 documentation
        }
        // do not remove ending 0xCO, because it is used as a marker that decoding is complete

        const decoded: DecodedKissFrame = {
            destinationCallsign: '',
            destinationSsid: 0,
            destinationAcceptsCompression: false,
            destinationSendsCompression: false,
            destinationCommand: true, // command = true = 1, response = false = 0
            sourceCallsign: '',
            sourceSsid: 0,
            sourceAcceptsCompression: false,
            sourceSendsCompression: false,
            sourceCommand: false, // command = true = 0, response = false = 1
            payload: '',
            repeaters: [],
            frameType: 'unnumbered',
            pid: null,
        }

        const getSsid = (ssidByteIndex: number) => {
            const ssidBinary: string = encoded[ssidByteIndex].toString(2) // get ssid byte in binary form
            // some APRS software incorrectly only encodes 7 bits, messing up the positioning
            if (ssidBinary.length === 8) {
                return parseInt(ssidBinary.slice(3, 7), 2)
            }
            else {
                return parseInt(ssidBinary.slice(2, 6), 2)
            }
        }

        const getSendsCompression = (ssidByteIndex: number): boolean => {
            const ssidBinary: string = encoded[ssidByteIndex].toString(2) // get ssid byte in binary form
            let reservedBit: string = ''
            // // some APRS software incorrectly only encodes 7 bits, messing up the positioning
            if (ssidBinary.length === 8) {
                reservedBit = ssidBinary[1]
            }
            else {
                reservedBit = ssidBinary[0]
            }
            return reservedBit === '0'
        }

        const getAcceptsCompression = (ssidByteIndex: number): boolean => {
            const ssidBinary: string = encoded[ssidByteIndex].toString(2) // get ssid byte in binary form
            let reservedBit: string = ''
            // // some APRS software incorrectly only encodes 7 bits, messing up the positioning
            if (ssidBinary.length === 8) {
                reservedBit = ssidBinary[2]
            }
            else {
                reservedBit = ssidBinary[1]
            }
            return reservedBit === '0'
        }

        const getCallsign = (startIndex: number) => {
            let i = startIndex
            let callsign: string = ''
            while (i < startIndex + 6 && encoded[i] >> 1 !== 0x00 && encoded[i] >> 1 !== 0x20) {
                callsign += String.fromCharCode(encoded[i] >> 1);
                i++
            }
            return callsign
        }

        // helps us keep track of which byte we're on after we decode potential repeaters that may or may not exist, makes more sense after the repeaters code section below
        let position:number = 1

        // 
        decoded.destinationCallsign = getCallsign(position) // 1
        decoded.destinationSsid = getSsid(position + 6) // 7
        decoded.destinationSendsCompression = getSendsCompression(position + 6) // 7
        decoded.destinationAcceptsCompression = getAcceptsCompression(position + 6) // 7
        decoded.destinationCommand = encoded[position + 6].toString(2)[0] === '1' // The bit at index 0 of the ssid field sets the command. Command = true = 1, response = false = 0

        position += 7 // should be 8 now

        // 
        decoded.sourceCallsign = getCallsign(position) // 8
        decoded.sourceSsid = getSsid(position + 6) // 14
        decoded.sourceSendsCompression = getSendsCompression(position + 6) // 14
        decoded.sourceAcceptsCompression = getAcceptsCompression(position + 6) // 14
        decoded.sourceCommand = !decoded.destinationCommand // The bit at index 0 of the ssid field sets the command. Command = true = 0, response = false = 1, inverted from destination command

        // if the last bit of the SSID byte is a 0, it indicates that there are up to 2 repeater address fields to follow
        const sourceSsidBinary: string = encoded[position + 6].toString(2) // 14
        const hasRepeaters: boolean = sourceSsidBinary[sourceSsidBinary.length - 1] === '0'
        if (hasRepeaters) {

            position += 7 // if there is a repeater then position is 15 now

            let repeaterOne: Repeater = {
                callsign: '',
                ssid: 0,
                hasBeenRepeated: true // default to true so that if this library is used for a digipeater, the digipeater doesn't get stuck endlessly repeating by accident
            }
            repeaterOne.callsign = getCallsign(position)
            repeaterOne.ssid = getSsid(position + 6)
            const repeaterOneSsidBinary: string = encoded[position + 6].toString(2)
            repeaterOne.hasBeenRepeated = repeaterOneSsidBinary[0] === '1' // first bit indicates whether repeater has already repeated packet, 1 = true, 0 = false
            const hasAnotherRepeater: boolean = repeaterOneSsidBinary[repeaterOneSsidBinary.length - 1] === '0' // last bit of first repeater SSID field indicates whether there's another repeater, 1 = end of repeaters, 0 = there's another repeater
            decoded.repeaters.push(repeaterOne)

            // AX.25 standard states a maximum of 2 repeaters, written imperatively rather than looped for ease of comprehension
            if (hasAnotherRepeater) {

                position += 7 // if there's a second repeater, then position is now 22

                const repeaterTwo: Repeater = {
                    callsign: '',
                    ssid: 0,
                    hasBeenRepeated: true // default to true so that if this library is used for a digipeater, the digipeater doesn't get stuck endlessly repeating by accident
                }
                repeaterTwo.callsign = getCallsign(position)
                repeaterTwo.ssid = getSsid(position + 6)
                decoded.repeaters.push(repeaterTwo)
            }
        }

        position += 7 // if no repeaters then will now be 15, if 1 repeater then position will now be 22, if 2 repeaters, then position is now 29

        // get control bit, which can be at index 15, 22, or 29. We're checking the first 2 bits of the next byte to determine frame type
        // 11 = unnumbered, aprs = true
        // 10 = supervisory
        // else information
        const frameTypeControlBits: string = encoded[position].toString(2).slice(0, 2)
        if (frameTypeControlBits === '11') {
            decoded.frameType = 'unnumbered'
        }
        else if (frameTypeControlBits === ' 10') {
            decoded.frameType = 'supervisory'
        }
        else {
            decoded.frameType = 'information'
        }

        // TODO: implement module 128, only doing the default of module 8 for now
        // if (modulo === 8) {
        //     position++
        // }
        // else if (modulo === 128) {
        //     position += 2
        // }
        // else {
        //     throw new Error('The only two modulo types allowed are 8 and 128!');
        // }
        position++

        // TODO: implement documentation section 4.2.2 and onward that is unnecessarily complicated, skipping ahead to payload portion for now

        // supervisory frames do not contain PID
        if (decoded.frameType !== 'supervisory') {
            decoded.pid = encoded[position]
            position++ // increment one byte
        }

        // KISS frames do not have frame check sequence returned from TNC or software modem, so after this, we are done
        while (encoded[position] !== 0xC0) {
            decoded.payload += String.fromCharCode(encoded[position])
            position++
        }

        //
        if (decoded.destinationSendsCompression) {
            decoded.payload = brotliDecompressSync(JSONB.parse(decoded.payload as string)).toString()
        }

        //
        if (decoded.payload as string) {
            if ((decoded.payload as string).startsWith('{') || (decoded.payload as string).startsWith('[')) {
                decoded.payload = JSONB.parse(decoded.payload as string)
            }
            else if (!isNaN(decoded.payload as number)) {
                if ((decoded.payload as string).includes('.')) {
                    decoded.payload = parseFloat(decoded.payload as string)
                }
                else {
                    decoded.payload = parseInt(decoded.payload as string)
                }
            }
        }

        return decoded
    }

}