import { Socket, createConnection } from 'net';
import { SerialPort } from 'serialport';
import { EventEmitter } from 'stream';
import JSONB from 'json-buffer'
import { brotliCompressSync, brotliDecompressSync } from 'zlib';
import { LocalStorage } from 'node-localstorage'

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
 * @attribute destinationCallsign: string - The destination amateur radio callsign.
 * @attribute destinationSsid: number - The destination's SSID. Default 0 if not defined.
 * @attribute destinationCommand?: boolean - Whether the frame is a command frame from the destination or not. Must be opposite of sourceCommand.
 * @attribute sourceCallsign?: string - The sender's amateur radio callsign. Optional when sending via the class instance send() method because it can be set in the constructor.
 * @attribute sourceSsid?: number - The sender's SSID. Default 0 if not defined.
 * @attribute sourceCommand?: boolean - Whether the frame is a command frame from the source or not. Must be opposite of destinationCommand.
 * @attribute sourceAcceptsCompression: boolean - If the sender is using this library, indicates whether they support compression using the Brotli algorithm.
 * @attribute payloadIsCompressed: boolean - If the sender is using this library, indicates whether the payload is compressed or not. The payload is not always compressed even if compression is enabled, for instance if the compressed version is longer than the uncompressed version.
 * @attribute payload: Serializable - The payload/body of your packet frame. Can be of multiple different types, see exported Serializable interface for exact allowed types.
 * @attribute repeaters: Repeater[] - The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined.
 * @attribute frametype: 'information'|'supervisory'|'unnumbered' - The frame type being sent. Default and most common is 'unnumbered'.
 * @attribute pid: number - The PID indicates which layer 3 protocol is in use, default is 240 which is none.
 */
export interface KissOutput {
    /** The destination amateur radio callsign. */
    destinationCallsign: string,
    /** The destination's SSID. Default 0 if not defined. */
    destinationSsid: number,
    /** Whether the frame is a command frame from the destination or not. Must be opposite of sourceCommand. */
    destinationCommand: boolean, // command = true = 1, response = false = 0, inverted from sourceCommand
    /** The sender's amateur radio callsign. */
    sourceCallsign: string,
    /** The sender's SSID. Default 0 if not defined. */
    sourceSsid: number,
    /** Whether the frame is a command frame from the source or not. Must be opposite of destinationCommand. */
    sourceCommand: boolean // command = true = 0, response = false = 1
    /** If the sender is using this library, indicates whether they support compression using the Brotli algorithm. */
    sourceAcceptsCompression: boolean,
    /** If the sender is using this library, indicates whether the payload is compressed or not.
     * The payload is not always compressed even if compression is enabled, 
     * for instance if the compressed version is longer than the uncompressed version. */
    payloadIsCompressed: boolean,
    /** The payload/body of your packet frame. Can be of multiple different types, see exported Serializable interface for exact allowed types. */
    payload: Serializable,
    /** The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined. */
    repeaters: Repeater[],
    /** Which of the allowed frame types the frame is, unnumbered is the most common in APRS and is the default. */
    frameType: 'information'|'supervisory'|'unnumbered',
    /** The PID indicates which layer 3 protocol is in use, default is 240 which is none. */
    pid: number
}

/**
 * @attribute destinationCallsign: string - The destination amateur radio callsign.
 * @attribute destinationSsid: number - The destination's SSID. Default 0 if not defined.
 * @attribute sourceCallsign?: string - The sender's amateur radio callsign. Optional when sending via the class instance send() method because it can be set in the constructor.
 * @attribute sourceSsid?: number - The sender's SSID. Default 0 if not defined.
 * @attribute payload: Serializable - The payload/body of your packet frame. Can be of multiple different types, see exported Serializable interface for exact allowed types.
 * @attribute repeaters?: Repeater[] - The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined.
 * @attribute frametype?: 'information'|'supervisory'|'unnumbered' - The frame type being sent. Default and most common is 'unnumbered'.
 * @attribute pid?: number - The PID indicates which layer 3 protocol is in use, default is 240 which is none.
 */
export interface KissInput {
    /** The destination amateur radio callsign. */
    destinationCallsign: string,
    /** The destination's SSID. Default 0 if not defined. */
    destinationSsid: number,
    /** The sender's callsign. Optional when sending via the class instance send() method because it can be set in the constructor. */
    sourceCallsign?: string,
    /** The sender's SSID. Default 0 if not defined. */
    sourceSsid?: number,
    /** The payload/body of your packet frame. Can be of multiple different types, see exported Serializable interface for exact allowed types. */
    payload: Serializable,
    /** The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined. */
    repeaters?: Repeater[],
    /** Which of the allowed frame types the frame is, unnumbered is the most common in APRS and is the default. */
    frameType?: 'information'|'supervisory'|'unnumbered',
    /** The PID indicates which layer 3 protocol is in use, default is 240 which is none. */
    pid?: number
}

/** TODO: REVISE
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
 * send(frameOrFrames:KissFrameOptionalSource|KissFrameOptionalSource[]) takes unencoded kiss frame(s) (see interface KissInput for format), runs them through the above mentioned processes, and sends them immediately.
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
    private localStorage = new LocalStorage('./acceptsCompression')

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
    }) {

        super()

        // set all class properties, include defaults
        this.callsign = options.callsign.toUpperCase()
        this.ssid = options.ssid ?? 0
        this.serialPort = options.serialPort
        this.serialBaud = options.serialBaud ?? 1200
        this.tcpHost = options.tcpHost ?? '127.0.0.1'
        this.tcpPort = options.tcpPort ?? 8100
        this.compression = options.compression ?? false
        this.suppressConnectionErrors = options.suppressConnectionErrors ?? false

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
        if (this.suppressConnectionErrors) {
            this.conn.on('error', () => { })
        }

        // attach event listener upon object instantiation
        this.conn.on('data', (data) => {

            // decode frame to emit
            const decodedFrame = this.decode(data)

            // emit the data to the unfiltered channel in case the dev wants to listen for both data addressed to them and not addressed to them
            this.emit('data', decodedFrame)

            if (decodedFrame.destinationCallsign === this.callsign) {
                this.emit('callsign', decodedFrame)
            }

            // emit data to the filtered channel if it matches the callsign and ssid
            if (decodedFrame.destinationCallsign === this.callsign && decodedFrame.destinationSsid === this.ssid) {
                this.emit('callsignSsid', decodedFrame)
            }

            //TODO: implement resending if supervisory frame is requesting it
            // if (decodedFrame.frameType === 'supervisory') {
            //
            // }

        })
    }

    public getCallsign(): string {
        return this.callsign
    }

    public getSsid(): number {
        return this.ssid
    }

    public setCallsign(callsign: string): void {
        this.callsign = callsign
    }

    public setSsid(ssid: number): void {
        this.ssid = ssid
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
     * Takes your unencoded KissInstanceFrame objects, validates them, optionally compressed them (configured in constructor), encodes them in KISS AX.25 format, and sends them immediately.
     * @param decodedFrameOrFrames - A single decoded KissInstanceFrame object or an array of them.
     * @returns the number of frames sent.
     */
    public send(decodedFrameOrFrames: KissInput | KissInput[]): number {
        
        if (Array.isArray(decodedFrameOrFrames)) { // if argument is array, loop through it and return number of frames sent
            const encodedFrames: EncodedKissFrame[] = []
            decodedFrameOrFrames.forEach((instanceFrame) => {
                encodedFrames.push(this.encode(instanceFrame)) // validate and repair if necessary, then encode and add to array to send
            });
            encodedFrames.forEach((f) => {
                this.conn.write(new Uint8Array(f)) // send encoded frames all at once after encoding first
            })
            return encodedFrames.length // return number of frames sent
        }
        else if (decodedFrameOrFrames) { // if single frame, check for payload and send if so
            this.conn.write(new Uint8Array(this.encode(decodedFrameOrFrames))) // validate and repair if necessary, then encode and send
            return 1
        }
        else { // return that no frames were sent
            return 0
        }
    }

    private setCompressionCache(callsign: string, ssid: number, supportsCompression: boolean): void {
        this.localStorage.setItem(`kc_compression_cache_${callsign}-${ssid}`, `${supportsCompression}`)
    }

    private getCompressionCache(callsign: string, ssid: number): boolean {
        return this.localStorage.getItem(`kc_compression_cache_${callsign}-${ssid}`) === 'true'
    }

    /**
     * Decode a raw AX.25 frame from your TNC or software modem into a JSON object.
     * @param encodedKissFrame - The raw frame from your TNC or software modem, still encoded in KISS + AX.25 and not usable by the end user.
     * @returns A decoded frame in JSON format that you can read and write to.
     */
    public decode(encodedKissFrame: EncodedKissFrame): KissOutput {

        let encoded = Array.from(new Uint8Array(encodedKissFrame))

        if (encoded[0] === 0xC0) {
            encoded.shift() // shift to remove FEND KISS header and match indexes of AX.25 documentation
        }
        // do not remove ending 0xCO, because it is used as a marker that decoding is complete

        const decoded: KissOutput = {
            destinationCallsign: '',
            destinationSsid: 0,
            destinationCommand: true, // command = true = 1, response = false = 0
            sourceCallsign: '',
            sourceSsid: 0,
            sourceCommand: false, // command = true = 0, response = false = 1
            payloadIsCompressed: false,
            sourceAcceptsCompression: false,
            payload: '',
            repeaters: [],
            frameType: 'unnumbered',
            pid: 240
        }

        /**
         * Decodes the SSID byte into a human readable SSID.
         * @param ssidByteIndex the index of the SSID byte.
         * @returns a decimal representation of the SSID.
         */
        const decodeSsid = (ssidByteIndex: number) => {
            let ssidBinary: string = encoded[ssidByteIndex].toString(2) // get ssid byte in binary form
            while (ssidBinary.length < 8) { // pad the SSID with zeros
                ssidBinary = '0' + ssidBinary
            }
            return parseInt(ssidBinary.slice(3, 7), 2) // extract only SSID bytes
        }

        /**
         * Checks the first source reserved bit whether it supports this class' custom compression method using Brotli.
         * @param ssidByteIndex the index of the source SSID byte.
         * @returns a boolean representation of whether or not the sender supports compression using Brotli.
         */
        const decodeAcceptsCompression = (ssidByteIndex: number): boolean => {
            let ssidBinary: string = encoded[ssidByteIndex].toString(2) // get ssid byte in binary form
            while (ssidBinary.length < 8) {
                ssidBinary = '0' + ssidBinary
            }
            return ssidBinary[1] === '0' // 0 = true, 1 = false. Yes it's backwards, I didn't invent AX.25.
        }

        /**
         * Checks the second source reserved bit whether or not the payload is compressed. Even if the sender supports compression, the payload may not always be compressed.
         * For example, if the payload is larger after being run through the Brotli algorithm and serialized, it will default back to the uncompressed payload.
         * @param ssidByteIndex the index of the source SSID byte.
         * @returns a boolean representation of whether or not the payload is compressed using Brotli.
         */
        const decodePayloadIsCompressed = (ssidByteIndex: number): boolean => {
            let ssidBinary: string = encoded[ssidByteIndex].toString(2) // get ssid byte in binary form
            while (ssidBinary.length < 8) {
                ssidBinary = '0' + ssidBinary
            }
            return ssidBinary[2] === '0' // 0 = true, 1 = false. Yes it's backwards, I didn't invent AX.25.
        }

        /**
         * Decodes a callsign from its ASCII codes.
         * @param startIndex the index of the first character in the callsign.
         * @returns the callsign as a string.
         */
        const decodeCallsign = (startIndex: number) => {
            let i = startIndex
            let callsign: string = ''
            while (i < startIndex + 6 && encoded[i] >> 1 !== 0x00 && encoded[i] >> 1 !== 0x20) { // stop decoding if the character is a space or the ASCII null symbol
                callsign += String.fromCharCode(encoded[i] >> 1); // AX.25 addresses are encoded with bit shifting to make room for a final bit on the final byte, yes it's dumb
                i++
            }
            return callsign
        }

        // helps us keep track of which byte we're on after we decode potential repeaters that may or may not exist, makes more sense after the repeaters code section below
        let position:number = 1

        // decode the destination callsign and ssid
        decoded.destinationCallsign = decodeCallsign(position) // position = 1
        decoded.destinationSsid = decodeSsid(position + 6) // position = 7
        decoded.destinationCommand = encoded[position + 6].toString(2)[0] === '1' // The bit at index 0 of the ssid field sets the command. Command = true = 1, response = false = 0

        position += 7 // position should be 8 now

        // decode the source callsign and ssid
        decoded.sourceCallsign = decodeCallsign(position) // position = 8
        decoded.sourceSsid = decodeSsid(position + 6) // position = 14
        decoded.payloadIsCompressed = decodePayloadIsCompressed(position + 6) // position = 14
        decoded.sourceAcceptsCompression = decodeAcceptsCompression(position + 6) // position = 14
        this.setCompressionCache(decoded.sourceCallsign, decoded.sourceSsid, decoded.sourceAcceptsCompression)
        decoded.sourceCommand = !decoded.destinationCommand // The bit at index 0 of the ssid field sets the command. Command = true = 0, response = false = 1, inverted from destination command

        // if the last bit of the SSID byte is a 0, it indicates that there are up to 2 repeater address fields to follow
        const sourceSsidBinary: string = encoded[position + 6].toString(2) // position = 14
        const hasRepeaters: boolean = sourceSsidBinary[sourceSsidBinary.length - 1] === '0'
        if (hasRepeaters) {

            position += 7 // if there is a repeater then position is 15 now

            let repeaterOne: Repeater = {
                callsign: '',
                ssid: 0,
                hasBeenRepeated: true // default to true so that if this library is used for a digipeater, the digipeater doesn't get stuck endlessly repeating by accident
            }
            repeaterOne.callsign = decodeCallsign(position)
            repeaterOne.ssid = decodeSsid(position + 6)
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
                repeaterTwo.callsign = decodeCallsign(position)
                repeaterTwo.ssid = decodeSsid(position + 6)
                const repeaterTwoSsidBinary: string = encoded[position + 6].toString(2)
                repeaterTwo.hasBeenRepeated = repeaterTwoSsidBinary[0] === '1' // first bit indicates whether repeater has already repeated packet, 1 = true, 0 = false
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

        position++

        // TODO: implement documentation section 4.2.2 and onward that is unnecessarily complicated, skipping ahead to payload portion for now

        // supervisory frames do not contain PID
        if (decoded.frameType !== 'supervisory') {
            decoded.pid = encoded[position]
            position++ // increment one byte
        }

        // read the payload from it's ASCII codes
        // KISS frames do not have frame check sequence returned from TNC or software modem, so after this, we are done
        while (encoded[position] !== 0xC0) {
            decoded.payload += String.fromCharCode(encoded[position])
            position++
        }

        // decompress payload if compression bit is set
        if (decoded.payloadIsCompressed) {
            try {
                decoded.payload = brotliDecompressSync(JSONB.parse(decoded.payload as string)).toString()
                // this.setCompressionCache(decoded.sourceCallsign, decoded.sourceSsid, true) // save to cache for future that this callsign + SSID combo supports compression
            } catch (error) { // if decompression fails then it must have been a misread
                decoded.payloadIsCompressed = false
                // this.setCompressionCache(decoded.sourceCallsign, decoded.sourceSsid, false) // save to cache for future that this callsign + SSID combo does NOT support compression
            }
        }

        // TODO: some characters not decoding, rare but happens
        // TODO: strip \r and \n
        // if the decoded payload starts with JSON characters, parse it
        if ((decoded.payload as string).startsWith('{') || (decoded.payload as string).startsWith('[')) {
            try {
                decoded.payload = JSONB.parse(decoded.payload as string)
            } catch (error) {
                // it was probably just a string that started with { or [, so we'll continue
            }
        }
        // if it's a number as a string, parse it to a number
        else if (!isNaN(decoded.payload as number)) {
            if ((decoded.payload as string).includes('.')) {
                decoded.payload = parseFloat(decoded.payload as string)
            }
            else {
                decoded.payload = parseInt(decoded.payload as string)
            }
        }

        // all done
        return decoded
    }

    public encode(decodedKissFrame: KissInput): EncodedKissFrame {

        // check for user error before spending CPU cycles to encode
        if (!this.callsign && !decodedKissFrame.sourceCallsign) {
            throw new Error('No source callsign is set for this frame or instance. A source callsign must be set in every frame or a default must be set in the class constructor.');
        }
        if (decodedKissFrame.destinationCallsign.length > 6) {
            throw new Error(`Destination callsign ${decodedKissFrame.destinationCallsign} is over the maximum length of 6 characters by ${decodedKissFrame.destinationCallsign.length - 6}.`);
        }
        decodedKissFrame.destinationSsid ??= 0
        if (decodedKissFrame.destinationSsid < 0 || decodedKissFrame.destinationSsid > 15) {
            throw new Error(`Destination SSID ${decodedKissFrame.destinationSsid} in invalid, the value must be between 0 and 15.`)
        }
        if (decodedKissFrame.sourceCallsign.length > 6) {
            throw new Error(`Callsign ${decodedKissFrame.sourceCallsign} is over the maximum length of 6 characters by ${decodedKissFrame.sourceCallsign.length - 6}`);
        }
        decodedKissFrame.sourceSsid ??= 0
        if (decodedKissFrame.sourceSsid < 0 || decodedKissFrame.sourceSsid > 15) {
            throw new Error(`Source SSID ${decodedKissFrame.sourceSsid} in invalid, the value must be between 0 and 15.`)
        }

        // Go through optionals and set them to reasonable defaults. Leave none of the optionals as undefined to prevent undefined type errors and adhere to AX.25 standard.
        decodedKissFrame.destinationCallsign = decodedKissFrame.destinationCallsign.toUpperCase() // AX.25 spec states that callsigns must be capital letters
        while (decodedKissFrame.destinationCallsign.length < 6) {
            decodedKissFrame.destinationCallsign += ' ' // pad callsign with spaces if it's under spec length
        }
        // AX.25 spec states that callsigns must be capital letters, class instance callsign already uppercased in constructor
        decodedKissFrame.sourceCallsign = decodedKissFrame.sourceCallsign.toUpperCase() ?? this.callsign
        while (decodedKissFrame.sourceCallsign.length < 6) {
            decodedKissFrame.sourceCallsign += ' ' // pad callsign with spaces if it's under spec length
        }
        if (typeof decodedKissFrame.payload !== 'string') {
            decodedKissFrame.payload = JSONB.stringify(decodedKissFrame.payload) // stringify if it isn't a string already
        }
        decodedKissFrame.repeaters ??= [] // set repeaters to empty if none set
        decodedKissFrame.frameType ??= 'unnumbered'
        decodedKissFrame.pid ??= 0xF0

        // if compression is enabled, and the destination is in the cache as supporting compression, use compression if the compressed version is shorter
        let payloadIsCompressed = false
        if (this.compression && this.getCompressionCache(decodedKissFrame.destinationCallsign, decodedKissFrame.destinationSsid)) {
            const compressedPayload: string = JSONB.stringify(brotliCompressSync(decodedKissFrame.payload as string))
            if (compressedPayload.length < (decodedKissFrame.payload as string).length) {
                decodedKissFrame.payload = compressedPayload
                payloadIsCompressed = true
            }
            else {
                payloadIsCompressed = false
            }
        }

        /**
         * Encode a callsign in ASCII code format, bit shifted to the left by 1.
         * @param callsign the string representation of the callsign to encode.
         * @returns an array of ASCII codes, bit shifted to the left by 1.
         */
        const encodeCallsign = (callsign: string): number[] => {
            let cn:number[] = []
            for (let i = 0; i < callsign.length; i++) {
                cn.push(callsign.charCodeAt(i) << 1)                
            }
            return cn
        }

        let encodedKissFrame: number[] = [] // frame that we will push to and return at the end

        // encode the destination callsign, SSID, control bit, and reserved bits
        encodedKissFrame.push(...encodeCallsign(decodedKissFrame.destinationCallsign))
        let destinationSsidField:string[] = ['1', '1', '1']  // control bit and reserved bits, which are all currently unused on the destination
        let destSsidBin:string = decodedKissFrame.destinationSsid.toString(2) // get the binary of the destination SSID
        while (destSsidBin.length < 4) { // pad it with zeros to a length of 4
            destSsidBin = '0' + destSsidBin
        }
        destinationSsidField.push(destSsidBin) // add padded SSID to field
        destinationSsidField.push('0') // 0 means not the final address, 1 means final address
        encodedKissFrame.push(parseInt(destinationSsidField.join(''), 2)) // push assembled field to encoded frame
        
        // encode the source callsign, SSID, control bit, and reserved bits
        encodedKissFrame.push(...encodeCallsign(decodedKissFrame.sourceCallsign))
        let sourceSsidField:string[] = ['0'] // control bit, currently unused
        sourceSsidField.push(this.compression ? '0' : '1') // if compression is enabled, set bit to 0, else set to default of 1
        sourceSsidField.push(payloadIsCompressed ? '0' : '1') // if payload is compressed, set bit to 0, else set to default of 1
        let srcSsidBin:string = decodedKissFrame.sourceSsid.toString(2) // get the binary representation of the source SSID
        while (srcSsidBin.length < 4) { // pad it with zeros to a length of 4
            srcSsidBin = '0' + srcSsidBin
        }
        sourceSsidField.push(srcSsidBin) // add padded SSID to field
        sourceSsidField.push(decodedKissFrame.repeaters.length < 1 ? '1' : '0')  // if no repeaters, push 1 to mark as final address, else push 0 if there's repeaters
        encodedKissFrame.push(parseInt(sourceSsidField.join(''), 2))  // push assembled field to encoded frame

        // encode repeaters if the exist
        if (decodedKissFrame.repeaters.length > 0) {
            if (decodedKissFrame.repeaters.length > 2) {
                decodedKissFrame.repeaters = decodedKissFrame.repeaters.slice(0, 2) // truncate if necessary, AX.25 standard states no more than 2 repeaters
            }
            for (let i = 0; i < decodedKissFrame.repeaters.length; i++) {
                encodedKissFrame.push(...encodeCallsign(decodedKissFrame.repeaters[i].callsign)) // encode callsign
                let rsb:string[] = [decodedKissFrame.repeaters[i].hasBeenRepeated ? '1' : '0', '1', '1'] // push hasBeenRepeated bit, and both unused reserved bits
                let rptSsidBin:string = decodedKissFrame.repeaters[i].ssid.toString(2) // get binary of SSID
                while (rptSsidBin.length < 4) { // pad SSID with zeros to a length of 4
                    rptSsidBin = '0' + rptSsidBin                    
                }
                rsb.push(rptSsidBin) // add padded SSID to field
                rsb.push(i === decodedKissFrame.repeaters.length - 1 ? '1' : '0') // if final repeater, push 1 to mark as final address, else push 0
                encodedKissFrame.push(parseInt(rsb.join(''), 2))
            }
        }

        // TODO: implement supervisory and information frames
        if (decodedKissFrame.frameType !== 'unnumbered') {
            console.log(`Encoding ${decodedKissFrame.frameType} frames is not implemented yet, defaulting to unnumbered.`)
        }
        encodedKissFrame.push(3) // just for the first two bits, leaving poll/final and unnumbered frame modifier bits alone for now

        // TODO: implement encode PID
        if (decodedKissFrame.pid !== 0xF0) {
            console.log(`Layer 3 protocol with PID ${decodedKissFrame.pid} is not implemented yet, defaulting to no layer 3.`)
        }
        encodedKissFrame.push(0xF0); // default 240 aka 0xF0
        
        // encode payload
        (decodedKissFrame.payload as string).split('').map((c) => {
            encodedKissFrame.push(c.charCodeAt(0))
        })
        
        // add header and footer to make AX.25 frame a KISS frame
        encodedKissFrame.unshift(0x00) // indicates to TNC or software modem that this is a data frame
        encodedKissFrame.unshift(0xC0) // FEND flag
        encodedKissFrame.push(0xC0) // FEND flag
        return encodedKissFrame
    }

}