import { Socket, createConnection } from 'net';
import { SerialPort } from 'serialport';
import { EventEmitter } from 'stream';
import JSONB from 'json-buffer'
import { brotliCompressSync, brotliDecompressSync } from 'zlib';
import { LocalStorage } from 'node-localstorage'
import { isEqual } from 'lodash';

// "type" must be included for Bun compatibility, using Bun version 1.1.10 as of writing
import { type Repeater } from './repeater';
import { type EncodedKissFrame } from './encodedkissframe';
import { type DecodedKissFrame } from './decodedkissframe';
import { type ListenFilter } from './listenfilter';
import { type KissConnectionConstructor } from './kissconnectionconstructor';
import { type Address } from './address';

// // re-export from index for better import organization by library users
export { type Repeater } from './repeater'
export { type EncodedKissFrame } from './encodedkissframe';
export { type DecodedKissFrame } from './decodedkissframe';
export { type ListenFilter } from './listenfilter';
export { type KissConnectionConstructor } from './kissconnectionconstructor';
export { type Address } from './address';

/**
 * A SerialPort/Socket connection to a TNC or software modem that encodes, compresses (optional), sends, receives, decodes, decompresses (if necessary), and emits AX.25 packets for amateur radio use.
 * 
 * See exported interface KissConnectionConstructor for constructor options.
 * 
 * send(frameOrFrames:KissFrameOptionalSource|KissFrameOptionalSource[]) takes unencoded kiss frame(s) (see interface KissInput for format), runs them through the above mentioned processes, and sends them immediately.
 * 
 * Call the listen(callback: (data: DecodedKissFrame) => { // do stuff }, filter?: ListenFilter) method to begin listening for packets. See method documentation for filtering specs.
 */
export class KissConnection extends EventEmitter {
    private conn: SerialPort | Socket | NullModem
    private serialPort: string
    private serialBaud: number
    private tcpHost: string
    private tcpPort: number
    private compression: boolean
    private suppressConnectionErrors: boolean
    private nullModem: boolean

    /**
     * @attribute serialPort?: string - The path to your TNC or software modem's serial port. If defined, it will override any TCP options that you include. Leave blank to use TCP. No default.
     * @attribute serialBaud?: number - A custom baud rate for your TNC or software modem's serial port. Default 1200 (most common) if not defined.
     * @attribute tcpHost?: string - The IP address or URL to your TNC or software mode. Default '127.0.0.1' (most common) if not defined.
     * @attribute tcpPort?: number - The TCP port to your TNC or software modem. Default 8100 (most common) if not defined.
     * @attribute compression?: boolean - Enable optional compression of the payload/body portion of the packet using the brotli algorithm. Callsigns and SSIDs are not compressed in the spirit of amateur radio. Note that regardless of setting, if for some reason the compressed version is larger than the uncompressed version, the uncompressed version is sent. Default false if not defined.
     * @attribute suppressConnectionErrors:? boolean - SerialPort and Socket will by default print errors to the console, set this to true to disable them. Default false if not defined.
     * @attribute nullModem?: boolean - A fake modem for running tests without a radio. Anything written to it will simply be printed to the console. Setting this to true overrides any and all serial and TCP options. Default to false if not defined.
     */
    constructor(options?: KissConnectionConstructor) {

        super()

        // set all class properties to passed args, or to default if not set
        if (options) {
            this.serialPort = options.serialPort
            this.serialBaud = options.serialBaud ?? 1200
            this.tcpHost = options.tcpHost ?? '127.0.0.1'
            this.tcpPort = options.tcpPort ?? 8100
            this.compression = options.compression ?? false
            this.suppressConnectionErrors = options.suppressConnectionErrors ?? false
            this.nullModem = options.nullModem ?? false
        }
        else {
            this.tcpHost = '127.0.0.1'
            this.tcpPort = 8100
            this.compression = false
            this.suppressConnectionErrors = false
        }

        if (this.nullModem) {
            this.conn = new NullModem()
        }
        else if (this.serialPort) {
            
            // throw error if using SerialPort with Bun due to a bug in Bun
            if (process.versions.bun) {
                throw new Error('Serial connections with Bun are not supported yet due to a bug in Bun.\nRun in Node or rerun with Bun using a TCP connection.\nSee https://github.com/oven-sh/bun/issues/10704 and https://github.com/oven-sh/bun/issues/4622 for details.')
            }

            // otherwise create the connection
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

    }

    /**
     * Check to see if the connection is open.
     */
    public isConnected(): boolean {
        return !this.conn.closed
    }

    /**
     * Close the current serial or TCP connection.
     */
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
     * Check if the current connection is a NullModem test.
     */
    public isNullModem(): boolean {
        return this.conn instanceof NullModem
    }

    /**
     * Get the current connection in use to manage it manually.
     * @returns a configured SerialPort or Socket instance.
     */
    public getConnection(): SerialPort | Socket | NullModem {
        return this.conn
    }

    /**
     * Begin decoding packets from the connection and define what to do with that data.
     * @param callback A callback that provides a decoded kiss frame to do with as you see fit.
     * @param filter An optional filter. Providing it will cause only packets that equal the provided criteria to be fully decoded and emitted.
     * This has the benefit of saving CPU cycles on machines with limited capabilities.
     * For example, providing { destination: { callsign: <YOUR_CALLSIGN>, ssid: <YOUR_SSID> } } will only decode and emit packets that are addressed to you.
     * It is also possible to filter by source and/or repeater(s). Properties that are left undefined are ignored.
     * This method can be called multiple times to listen to multiple different filters simultaneously.
     * @returns the KissConnection instance for method chaining.
     */
    public listen(callback: (data: DecodedKissFrame) => void, filter?: ListenFilter): this {
        this.conn.on('data', (data: EncodedKissFrame) => {
            if (filter) {

                const arr = Array.from(new Uint8Array(data))
                let decoded: ListenFilter = {}

                // shift() to remove FEND KISS header and match indexes of AX.25 documentation
                if (arr[0] === 0xC0) {
                    arr.shift()
                }

                // if the destination property of the filter object is even partially defined then we need to decode that field
                if (filter.destination) {
                    const pd = KissConnection.decodeAddressBytes(arr.slice(1, 8))
                    decoded.destination = {
                        callsign: pd.callsign,
                        ssid: pd.ssid
                    }
                    // if optional properties are not defined on the filter, then the ones found will be fine, so add them to the filter to make comparison easier
                    filter.destination.callsign ??= pd.callsign
                    filter.destination.ssid ??= pd.ssid
                }
                // if the source property of the filter object is even partially defined then we need to decode that field
                if (filter.source) {
                    const ps = KissConnection.decodeAddressBytes(arr.slice(8, 15))
                    decoded.source = {
                        callsign: ps.callsign,
                        ssid: ps.ssid
                    }
                    // if optional properties are not defined on the filter, then the ones found will be fine, so add them to the filter to make comparison easier
                    filter.source.callsign ??= ps.callsign
                    filter.source.ssid ??= ps.ssid
                }
                // if the repeaters property of the filter object is even partially defined then we need to decode that field
                if (filter.repeaters) {
                    decoded.repeaters = KissConnection.decodeRepeaters(data)
                    for (let i = 0; i < decoded.repeaters.length; i++) {
                        // if a repeater and its properties are not defined on the filter, then the ones found will be fine, so add them to the filter to make comparison easier
                        filter.repeaters[i].callsign ??= decoded.repeaters[i].callsign
                        filter.repeaters[i].ssid ??= decoded.repeaters[i].ssid
                        filter.repeaters[i].hasBeenRepeated ??= decoded.repeaters[i].hasBeenRepeated
                    }
                }

                // compare the filter criteria with what has been decoded, and if it passes call the callback
                if (isEqual(filter, decoded)) {
                    callback(KissConnection.decode(data))
                }

            }
            else {
                callback(KissConnection.decode(data))
            }
        })
        return this
    }

    /**
     * Takes your unencoded KissInput object(s), encodes them via the encode() method, and sends them immediately.
     * @param decodedFrame a single KissInput object or an array of them.
     * @returns this KissConnection instance for method chaining.
     */
    public send(decodedFrameOrFrames: DecodedKissFrame | DecodedKissFrame[]): this {

        // remind user that they're in a test mode
        if (this.nullModem) {
            console.log(`Preparing to write to NullModem... ${JSON.stringify(decodedFrameOrFrames)}`)
        }

        // if argument is array, loop through it and return number of frames sent
        if (Array.isArray(decodedFrameOrFrames)) {

            const encodedFrames: EncodedKissFrame[] = []

            // encode each frame
            decodedFrameOrFrames.forEach((f) => {
                encodedFrames.push(KissConnection.encode(f, this.compression))
            });

            // send each frame
            encodedFrames.forEach((f) => {
                this.conn.write(new Uint8Array(f)) // send encoded frames all at once after encoding first
            })
        }
        // if single frame, encode and send
        else {
            this.conn.write(new Uint8Array(KissConnection.encode(decodedFrameOrFrames, this.compression))) // validate and repair if necessary, then encode and send
        }

        // return this for method chaining
        return this
    }

    /**
     * Updates the localstorage cache whether or not a callsign + SSID combo supports compression.
     * @param callsign the callsign to store.
     * @param ssid the callsign's SSID to store, an operator may have devices that do not support the custom compression of this class, so it's important to store them with SSID.
     * @param supportsCompression boolean value whether the callsign + SSID combo supports this class' custom Brotli compression algorithm.
     */
    private static setCompressionCache(callsign: string, ssid: number, supportsCompression: boolean): void {
        new LocalStorage('./compressionCache').setItem(callsign + '-' + ssid, `${supportsCompression}`)
    }

    /**
     * Check the localstorage whether or not a callsign + SSID combo supports compression.
     * @param callsign the callsign to check.
     * @param ssid the callsign's SSID to check, an operator may have devices that do not support the custom compression of this class, so it's important to check the SSID as well.
     * @returns boolean value whether the callsign + SSID combo supports this class' custom Brotli compression algorithm.
     */
    private static getCompressionCache(callsign: string, ssid: number): boolean {
        return new LocalStorage('./compressionCache').getItem(callsign + '-' + ssid) === 'true'
    }

    /**
     * Decodes a destination, source, or repeater address field and returns it in an easier to work object.
     * @param bytes a number array representing one byte.
     * @returns an Adress object that is easier to work with than raw binary.
     */
    private static decodeAddressBytes(bytes: number[]): Address {

        // counter and empty string for later
        let i = 0
        let callsign: string = ''

        // decode callsign, stop decoding if the character is a space or the ASCII null symbol
        while (i < 6 && bytes[i] >> 1 !== 0x00 && bytes[i] >> 1 !== 0x20) { 
            callsign += String.fromCharCode(bytes[i] >> 1); // AX.25 addresses are encoded with bit shifting to make room for a final bit on the final byte, yes it's dumb
            i++
        }

        // get the ssid byte in binary form
        let ssidBinary: string = bytes[bytes.length - 1].toString(2)
        while (ssidBinary.length < 8) { // pad the SSID byte with zeros to a length of 8
            ssidBinary = '0' + ssidBinary
        }

        return {
            callsign: callsign,

            // If destination or source fields, indicates with it's counterpart what kind of frame it is.
            // If repeater field, indicates whether or not the packet has already been repeated by that repeater. Repeater must flip this from 0 to 1 prior to repeating.
            commandOrHasBeenRepeated: ssidBinary[0] === '1',

            // Unused except in the source address field, where it indicates whether the sender supports using the brotli compression algorithm on the payload.
            // 0 = true, 1 = false. Yes it's backwards / counterintuitive. I didn't invent the AX.25 standard.
            reservedBitOne: ssidBinary[1] === '0',

            // Unused except in the source address field, where it indicates whether the payload is actually compressed using the brotli algorithm.
            // This is is just like the previous, backwards and counterintuitive.
            reservedBitTwo: ssidBinary[2] === '0',

            // Select the section of the SSID field that actually represents the SSID and convert it from binary to decimal.
            ssid: parseInt(ssidBinary.slice(3, 7), 2),

            // Final bit indicates whether it is the last address field in the packet.
            finalAddress: ssidBinary[ssidBinary.length - 1] === '1'
        }
    }

    /**
     * Specifically decodes only the repeaters field of an encoded packet. Very useful if you are looking to write repeater software,
     * as this will save you some CPU cycles versus decoding the entire packet.
     * @param encodedKissframe a kiss frame represented by a number array
     * @returns a populated array of Repeater objects OR null if the packet doesn't have any repeaters. Should never return an empty array.
     */
    public static decodeRepeaters(encodedKissframe: EncodedKissFrame): Repeater[] | null {
        const arr = Array.from(new Uint8Array(encodedKissframe))

        // if called from outside of decode(), it will have a FEND header. shift() to remove FEND KISS header and match indexes of AX.25 documentation
        if (arr[0] === 0xC0) {
            arr.shift()
        }

        // if the last bit of the source SSID byte is a 0, it indicates that there are up to 2 repeater address fields to follow
        if (arr[14].toString(2).endsWith('0')) {
        // if ((arr[14] << 7 & 0) === 0) { // can also do this but the performance improvement is less than 1 millisecond
            const repeaters: Repeater[] = []
            const first = KissConnection.decodeAddressBytes(arr.slice(15, 22))
            repeaters.push({
                callsign: first.callsign,
                ssid: first.ssid,
                hasBeenRepeated: first.commandOrHasBeenRepeated // first bit indicates whether repeater has already repeated packet, 1 = true, 0 = false
            })

            // last bit of first repeater SSID field indicates whether there's another repeater, 1 = end of repeaters, 0 = there's another repeater
            if (!first.finalAddress) { // 0 indicates another repeater, hence the inversion
                const second = KissConnection.decodeAddressBytes(arr.slice(22, 29))
                repeaters.push({
                    callsign: second.callsign,
                    ssid: second.ssid,
                    hasBeenRepeated: second.commandOrHasBeenRepeated
                })
            }
            return repeaters
        }
        return null
    }

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
            destination: {
                callsign: '',
                ssid: 0,
            },
            source: {
                callsign: '',
                ssid: 0
            },
            commandResponse: 'legacy',
            payload: '',
            repeaters: [],
            frameType: 'unnumbered',
            pid: 240
        }

        // decode the first byte of the packet, the destination field
        const dest = KissConnection.decodeAddressBytes(encoded.slice(1, 8))
        decoded.destination.callsign = dest.callsign
        decoded.destination.ssid = dest.ssid

        // decode the second byte of the packet, the source field
        const src = KissConnection.decodeAddressBytes(encoded.slice(8, 15))
        decoded.source.callsign = src.callsign
        decoded.source.ssid = src.ssid

        // The reserved bits of the source field are used by this library to indicate compression compatibility and whether or not compression was used.
        let acceptsCompression = src.reservedBitOne
        let payloadIsCompressed = src.reservedBitTwo

        // 1 and 0 respectively indicates a command frame
        if (dest.commandOrHasBeenRepeated && !src.commandOrHasBeenRepeated) {
            decoded.commandResponse = 'command'
        }
        // 0 and 1 respectively indicates a response frame
        else if (!dest.commandOrHasBeenRepeated && src.commandOrHasBeenRepeated) {
            decoded.commandResponse = 'response'
        }
        // 00 or 11 are used by older versions of the protocol
        else {
            decoded.commandResponse = 'legacy'
        }

        // if to reduce fs writes, store others who are compression compatible
        if (acceptsCompression) {
            KissConnection.setCompressionCache(decoded.source.callsign, decoded.source.ssid, true)
        }

        // helps us keep track of which byte we're on after we decode potential repeaters that may or may not exist, makes more sense after the repeaters code section below
        let position: number = 15

        // Decode repeaters and move our position keeper forward for each repeater decoded. Method only returns a populated array or null, never an empty array.
        const repeaters: Repeater[] = KissConnection.decodeRepeaters(encoded)
        if (repeaters) {
            decoded.repeaters = repeaters
            position += (7 * (repeaters.length)) // if no repeaters then position will now be 15, if 1 repeater then position will now be 22, if 2 repeaters, then position is now 29
        }

        // Get control bit, which can be at index 15, 22, or 29. We're checking the first 2 bits of the next byte to determine frame type.
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

        // only information frames contain a PID
        if (decoded.frameType === 'information') {
            decoded.pid = encoded[position]
            position++ // increment one byte
        }

        position++

        // Read the payload from its ASCII codes, KISS frames do not have frame check sequence returned from TNC or software modem, so after this, we are done.
        while (encoded[position] !== 0xC0) {
            decoded.payload += String.fromCharCode(encoded[position])
            position++
        }

        // decompress payload if compression bit is set
        if (payloadIsCompressed) {
            try {
                decoded.payload = brotliDecompressSync(JSONB.parse(decoded.payload as string)).toString()
            } catch (error) { // if decompression fails then it must have been a misread
                payloadIsCompressed = false
            }
        }

        // strip whitespace that some sources occasionally send
        decoded.payload = (decoded.payload as string).trim()

        // if the decoded payload starts with JSONish characters, try parsing it.
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

    /**
    * Encode a callsign in ASCII code format, bit shifted to the left by 1.
    * @param callsign the string representation of the callsign to encode.
    * @returns an array of ASCII codes, bit shifted to the left by 1.
    */
    public static encodeAddress(address: Address): number[] {

        // empty array to hold our encoded results
        let bytes: number[] = []

        // fix any formatting issues
        address.callsign = address.callsign.toUpperCase() // convert to upper case
        while (address.callsign.length < 6) { // pad with spaces to a length of 6 per AX.25 spec
            address.callsign += ' '
        }

        // get ascii code for each character in the callsign, bit shift it left by one, and push
        for (let i = 0; i < address.callsign.length; i++) {
            bytes.push(address.callsign.charCodeAt(i) << 1)
        }

        // get binary representation of the ssid and pad it with zeros to a length of 4
        let ssidBinary = address.ssid.toString(2)
        while (ssidBinary.length < 4) {
            ssidBinary = '0' + ssidBinary
        }

        // empty string to hold our 1s and 0s
        let bits: string = ''
        bits += address.commandOrHasBeenRepeated ? '1' : '0' // if command or has been repeated, push 1
        bits += address.reservedBitOne ? '0' : '1' // if reserved bit is being used, push 0, otherwise push 1 when not in use. very counterintuitive
        bits += address.reservedBitTwo ? '0' : '1' // if reserved bit is being used, push 0, otherwise push 1 when not in use. very counterintuitive
        bits += ssidBinary
        bits += address.finalAddress ? '1' : '0' // used to indicate whether this is the last address or not
        bytes.push(parseInt(bits, 2)) // convert the binary string to an actual number and push it to our bytes array

        return bytes
    }

    /**
     * Takes your JSON KissInput objects and translates them into an AX.25 frame/packet that you can send to your software modem or TNC.
     * @param decoded your JSON KissInput object.
     * @returns an EncodedKissFrame suitable for sending to your TNC.
     */
    public static encode(decoded: DecodedKissFrame, useCompression: boolean = false): EncodedKissFrame {

        // check for user error before spending CPU cycles to encode
        if (decoded.destination.callsign.length > 6) {
            throw new Error(`Destination callsign ${decoded.destination} is over the maximum length of 6 characters by ${decoded.destination.callsign.length - 6}.`);
        }
        if (decoded.destination.ssid < 0 || decoded.destination.ssid > 15) {
            throw new Error(`Destination SSID ${decoded.destination.ssid} is invalid, the value must be between 0 and 15.`)
        }
        if (decoded.source.callsign.length > 6) {
            throw new Error(`Callsign ${decoded.source.callsign} is over the maximum length of 6 characters by ${decoded.source.callsign.length - 6}`);
        }
        if (decoded.source.ssid < 0 || decoded.source.ssid > 15) {
            throw new Error(`Source SSID ${decoded.source.ssid} is invalid, the value must be between 0 and 15 inclusive.`)
        }

        // set undefined properties to defaults
        decoded.commandResponse ??= 'command'
        decoded.repeaters ??= []
        decoded.frameType ??= 'unnumbered'
        decoded.pid ??= 0xF0

        // stringify payload if it isn't a string already
        if (typeof decoded.payload !== 'string') {
            decoded.payload = JSONB.stringify(decoded.payload)
        }
        
        // if compression is enabled, and the destination is in the cache as supporting compression, use compression if the compressed version is shorter
        let payloadIsCompressed = false
        if (useCompression && KissConnection.getCompressionCache(decoded.destination.callsign, decoded.destination.ssid)) {
            const compressedPayload: string = JSONB.stringify(brotliCompressSync(decoded.payload as string))
            if (compressedPayload.length < (decoded.payload as string).length) {
                decoded.payload = compressedPayload
                payloadIsCompressed = true
            }
        }

        // frame that we will push to and return at the end
        let encoded: number[] = [] 

        // encode and push destination address field
        encoded.push(...KissConnection.encodeAddress({
            callsign: decoded.destination.callsign,
            commandOrHasBeenRepeated: true,
            reservedBitOne: false, // currently unused
            reservedBitTwo: false, // currently unused
            ssid: decoded.destination.ssid,
            finalAddress: false, // indicates that it's not the final address
        }))
        
        // encode and push source address field
        encoded.push(...KissConnection.encodeAddress({
            callsign: decoded.source.callsign,
            commandOrHasBeenRepeated: false,
            reservedBitOne: useCompression, // first reserved bit is used to indicate whether the sender can decode brotli compressed payloads
            reservedBitTwo: payloadIsCompressed, // second reserved bit is used to indicate whether the payload is compressed or not
            ssid: decoded.source.ssid,
            finalAddress: decoded.repeaters.length === 0 // true if it's the last address aka no repeaters
        }))

        // loop through and encode repeaters if they exist
        if (decoded.repeaters.length > 0) {
            if (decoded.repeaters.length > 2) {
                decoded.repeaters = decoded.repeaters.slice(0, 2) // truncate if necessary, AX.25 standard states no more than 2 repeaters
            }
            for (let i = 0; i < decoded.repeaters.length; i++) {
                encoded.push(...KissConnection.encodeAddress({
                    callsign: decoded.repeaters[i].callsign,
                    commandOrHasBeenRepeated: decoded.repeaters[i].hasBeenRepeated, // indicates whether this repeater has already repeated the packet, this bit is flipped by the repeater
                    reservedBitOne: false, // currently unused
                    reservedBitTwo: false, // currently unused
                    ssid: decoded.repeaters[i].ssid,
                    finalAddress: i === decoded.repeaters.length - 1 // whether we are on the last repeater in the array or not
                }))
            }
        }

        // TODO: implement supervisory and information frames? Maybe not because they don't seem to ever be used.
        if (decoded.frameType !== 'unnumbered') {
            console.log(`Encoding of ${decoded.frameType} frames is not implemented yet, defaulting to unnumbered.`)
        }
        encoded.push(3) // just for the first two bits, leaving poll/final and unnumbered frame modifier bits alone for now
        encoded.push(decoded.pid); // default 240 aka 0xF0

        // encode payload
        (decoded.payload as string).split('').map((c) => {
            encoded.push(c.charCodeAt(0))
        })

        // add header and footer to make AX.25 frame a KISS frame
        encoded.unshift(0x00) // indicates to TNC or software modem that this is a data frame
        encoded.unshift(0xC0) // FEND flag
        encoded.push(0xC0) // FEND flag
        return encoded
    }
}

class NullModem {

    public closed: boolean = false

    public on(event: string, listener: any) {

    }

    public write(buffer: string | Uint8Array, cb?: (err?: Error) => void): boolean | void {
        console.log('NullModem.write() called.')
    }

    public end() {
        this.closed = true
    }
}