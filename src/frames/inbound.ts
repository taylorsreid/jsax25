import { DISCFrame, DMFrame, IFrame, KissConnection, REJFrame, RNRFrame, RRFrame, SABMEFrame, SABMFrame, SREJFrame, TESTFrame, UAFrame, UIFrame, XIDFrame, type IFrameConstructor, type OutgoingConstructor, type SFrameConstructor, type SREJFrameConstructor, type TestFrameConstructor, type UIFrameConstructor, type XIDFrameConstructor } from 'index.js';
import JSONB from 'json-buffer';
import type { SerialKissConstructor, TcpKissConstructor } from 'kissconnection.js';
import type { Repeater } from "../misc.js";
import { BaseAbstract, type FrameType, type IFrameType, type SFrameType, type UFrameType } from "./baseabstract.js";
import { controlFieldCombinations, type ControlFieldCombination } from './controlFieldCombinations.js';

export class IncomingFrame extends BaseAbstract {
    protected _destinationCallsign: string | undefined;
    protected _destinationSsid: number | undefined;
    protected _destinationCommandBit: boolean | undefined;
    protected _destinationReservedBitOne: boolean | undefined;
    protected _destinationReservedBitTwo: boolean | undefined;
    protected _sourceCallsign: string | undefined;
    protected _sourceSsid: number | undefined;
    protected _sourceCommandBit: boolean | undefined;
    protected _sourceReservedBitOne: boolean | undefined;
    protected _sourceReservedBitTwo: boolean | undefined;
    protected _repeaters: Repeater[] | undefined;
    public modulo: 8 | 128;
    protected _receivedSequence: number | undefined;
    protected _pollOrFinal: boolean | undefined;
    protected _sendSequence: number | undefined;
    protected _frameType: FrameType | undefined;
    protected _frameSubtype: IFrameType | UFrameType | SFrameType | undefined;
    protected _pid: number | undefined;
    protected _payload: any | undefined;
    public readonly encoded: number[];
    public readonly kissConnection: KissConnection | undefined;

    constructor(encodedKissFrame: number[], kissConnection?: KissConnection | TcpKissConstructor | SerialKissConstructor, modulo: 8 | 128 = 8) {
        super()

        //
        this.encoded = Array.from(encodedKissFrame)

        // doing this after modulo assignment causes a weird race condition in bun
        if (this.encoded[0] === 0xC0) {
            this.encoded.shift()
        }

        //
        this.modulo = modulo

        if (kissConnection instanceof KissConnection) {
            this.kissConnection = kissConnection
        }
        else if (typeof kissConnection !== 'undefined') {
            this.kissConnection = new KissConnection(kissConnection)
        }

    }

    protected static getBinaryString(byte: number): string {
        // get the byte in binary form
        let binary: string = byte.toString(2)
        while (binary.length < 8) { // pad the SSID byte with zeros to a length of 8
            binary = '0' + binary
        }
        return binary
    }

    public static decodeCallsign(bytes: number[]): string {
        // counter and empty string for later
        let i = 0
        let callsign: string = ''

        // decode callsign, stop decoding if the character is a space or the ASCII null symbol
        while (i < 6 && bytes[i] >> 1 !== 0x00 && bytes[i] >> 1 !== 0x20) {
            callsign += String.fromCharCode(bytes[i] >> 1); // AX.25 addresses are encoded with bit shifting to make room for a final bit on the final byte, yes it's dumb
            i++
        }

        return callsign
    }

    /** Get the destination amateur radio callsign. */
    public get destinationCallsign(): string {
        if (typeof this._destinationCallsign === 'undefined') {
            this._destinationCallsign = IncomingFrame.decodeCallsign(this.encoded.slice(1, 7))
        }
        return this._destinationCallsign
    }

    protected get destinationCommandBit(): boolean {
        if (typeof this._destinationCommandBit === 'undefined') {
            this._destinationCommandBit = IncomingFrame.getBinaryString(this.encoded[7])[0] === '1'
        }
        return this._destinationCommandBit
    }

    // reserved by this library for future use
    public get destinationReservedBitOne(): boolean {
        if (typeof this._destinationReservedBitOne === 'undefined') {
            this._destinationReservedBitOne = IncomingFrame.getBinaryString(this.encoded[7])[1] === '0'
        }
        return this._destinationReservedBitOne
    }

    // reserved by this library for future use
    public get destinationReservedBitTwo(): boolean {
        if (typeof this._destinationReservedBitTwo === 'undefined') {
            this._destinationReservedBitTwo = IncomingFrame.getBinaryString(this.encoded[7])[2] === '0'
        }
        return this._destinationReservedBitTwo
    }

    /** Get the destination's SSID. */
    public get destinationSsid(): number {
        if (typeof this._destinationSsid === 'undefined') {
            this._destinationSsid = parseInt(IncomingFrame.getBinaryString(this.encoded[7]).slice(3, 7), 2)
        }
        return this._destinationSsid
    }

    /** Get the sender's amateur radio callsign. */
    public get sourceCallsign(): string {
        if (typeof this._sourceCallsign === 'undefined') {
            this._sourceCallsign = IncomingFrame.decodeCallsign(this.encoded.slice(8, 14))
        }
        return this._sourceCallsign
    }

    protected get sourceCommandBit(): boolean {
        if (typeof this._sourceCommandBit === 'undefined') {
            this._sourceCommandBit = IncomingFrame.getBinaryString(this.encoded[14])[0] === '1'
        }
        return this._sourceCommandBit
    }

    public get sourceReservedBitOne(): boolean {
        if (typeof this._sourceReservedBitOne === 'undefined') {
            this._sourceReservedBitOne = IncomingFrame.getBinaryString(this.encoded[14])[1] === '0'
        }
        return this._sourceReservedBitOne
    }
    public get sourceReservedBitTwo(): boolean {
        if (typeof this._sourceReservedBitTwo === 'undefined') {
            this._sourceReservedBitTwo = IncomingFrame.getBinaryString(this.encoded[14])[2] === '0'
        }
        return this._sourceReservedBitTwo
    }

    // TODO: compression moved to back burner
    // public isCompressionEnabled(): boolean {
    //     if (typeof this.compressionEnabled === 'undefined') {
    //         this.compressionEnabled = IncomingFrame.getBinaryString(this.encoded[14])[1] === '0'
    //         this.cacheManager.set(this.getSourceCallsign(), this.getSourceSsid(), { supportsCompression: this.compressionEnabled })
    //     }
    //     return this.compressionEnabled
    // }

    // /**
    //  * Source address field reserved bit two is used by this library to indicate whether the outgoing frame is compressed or not.
    //  * @returns A boolean representation of whether the bit is toggled on.
    //  */
    // public isPayloadCompressed(): boolean {
    //     if (typeof this.payloadCompressed === 'undefined') {
    //         this.payloadCompressed = IncomingFrame.getBinaryString(this.encoded[14])[2] === '0' && this.isCompressionEnabled() // double check both bits to prevent false positives
    //     }
    //     return this.payloadCompressed
    // }

    /** Get the sender's SSID. */
    public get sourceSsid(): number {
        if (typeof this._sourceSsid === 'undefined') {
            this._sourceSsid = parseInt(IncomingFrame.getBinaryString(this.encoded[14]).slice(3, 7), 2)
        }
        return this._sourceSsid
    }

    /**
     * Get whether the command is a command frame or a response frame if it is using the latest version of the AX.25 protocol. If not, then it is using the legacy protocol.
     * @returns string 'command', 'response', or 'legacy'
     */
    public get commandOrResponse(): 'command' | 'response' | 'legacy' { // property is ephemeral and computed
        // 1 and 0 respectively indicates a command frame
        if (this.destinationCommandBit && !this.sourceCommandBit) {
            return 'command'
        }
        // 0 and 1 respectively indicates a response frame
        else if (!this.destinationCommandBit && this.sourceCommandBit) {
            return 'response'
        }
        // 00 or 11 are used by older versions of the protocol
        else {
            return 'legacy'
        }
    }
    public get isCommand(): boolean {
        return this.destinationCommandBit && !this.sourceCommandBit
    }
    public get isResponse(): boolean {
        return !this.destinationCommandBit && this.sourceCommandBit
    }
    public get isLegacy(): boolean {
        return !this.isCommand && !this.isResponse
    }

    public get repeaters(): Repeater[] {
        if (typeof this._repeaters === 'undefined') {
            this._repeaters = [] // initialize
            let position: number = 15
            while (this.encoded[position - 1].toString(2).endsWith('0')) {
                this._repeaters.push({
                    callsign: IncomingFrame.decodeCallsign(this.encoded.slice(position, position + 6)),
                    ssid: parseInt(IncomingFrame.getBinaryString(this.encoded[position + 6]).slice(3, 7), 2),
                    hasBeenRepeated: IncomingFrame.getBinaryString(this.encoded[position + 6]).startsWith('1')
                })
                position += 7
            }
        }
        return this._repeaters
    }

    private getControlFieldBits(): string {
        return (this.modulo === 8) ? IncomingFrame.getBinaryString(this.encoded[15 + (7 * this.repeaters.length)]) : IncomingFrame.getBinaryString(this.encoded[15 + (7 * this.repeaters.length)]) + IncomingFrame.getBinaryString(this.encoded[16 + (7 * this.repeaters.length)])
    }

    public get frameType(): FrameType {
        if (typeof this._frameType === 'undefined') {
            const cfb: string = this.getControlFieldBits()
            if (cfb.endsWith('11')) {
                this._frameType = 'unnumbered'
            }
            else if (cfb.endsWith('01')) {
                this._frameType = 'supervisory'
            }
            else {
                this._frameType = 'information'
            }
        }
        return this._frameType
    }

    public get frameSubtype(): UFrameType | SFrameType | IFrameType {
        if (typeof this._frameSubtype === 'undefined') {

            const cfb: string = this.getControlFieldBits()
            if (this.frameType === 'unnumbered') {
                const found: ControlFieldCombination = controlFieldCombinations.find((cc) => {
                    return cc.binaryOne === cfb.slice(0, 3) && cc.binaryTwo === cfb.slice(4)
                })! // all valid frame types are listed
                this._frameSubtype = found.frameSubtype
            }
            else if (this.frameType === 'supervisory') {
                const found: ControlFieldCombination = controlFieldCombinations.find((cc) => {
                    if (this.modulo === 8) {
                        return cc.binaryTwo === cfb.slice(4, 8)
                    }
                    else {
                        return cc.binaryTwo === cfb.slice(8, 16)
                    }
                })! // all valid frame types are listed
                this._frameSubtype = found.frameSubtype
            }
            else {
                this._frameSubtype = 'I'
            }
        }
        return this._frameSubtype! // it has to be one of the 3
    }

    public get receivedSequence(): number | undefined {
        if (this.frameType !== 'unnumbered') { // received sequences only exist on the other 2 internal frame types
            if (typeof this._receivedSequence === 'undefined') {
                this._receivedSequence = (this.modulo === 8) ? parseInt(this.getControlFieldBits().slice(0, 3), 2) : parseInt(this.getControlFieldBits().slice(0, 7), 2)
            }
            return this._receivedSequence
        }
        return undefined
    }

    public get pollOrFinal(): boolean {
        if (typeof this._pollOrFinal === 'undefined') {
            this._pollOrFinal = (this.modulo === 8) ? this.getControlFieldBits()[3] === '1' : this.getControlFieldBits()[7] === '1'
        }
        return this._pollOrFinal
    }

    public get sendSequence(): number | undefined {
        if (this.frameSubtype === 'I') { // send sequences only exist on I frames
            if (typeof this._sendSequence === 'undefined') {
                this._sendSequence = (this.modulo === 8) ? parseInt(this.getControlFieldBits().slice(4, 7), 2) : parseInt(this.getControlFieldBits().slice(8, 16), 2)
            }
            return this._sendSequence
        }
        return undefined
    }

    /**
     * Number indicating which layer 3 protocol is in use, default is 240 which is none.
     * @returns a number corresponding to the layer 3 protocol in use. See AX.25 documentation for a key: value table.
     */
    public get pid(): number | undefined {
        if (typeof this._pid === 'undefined' && (this.frameSubtype === 'I' || this.frameSubtype === 'UI')) { // only exist on I and UI frames
            this._pid = this.encoded[16 + (7 * this.repeaters.length)]
        }
        return this._pid
    }

    public get payload(): any | undefined {
        if (typeof this._payload === 'undefined' && (this.frameSubtype === 'UI' || this.frameSubtype === 'I' || this.frameSubtype === 'TEST' || this.frameSubtype === 'XID')) {

            this._payload = ''

            // 
            let position: number = ((this.frameSubtype === 'I' || this.frameSubtype === 'UI') ? 17 : 16) + (7 * this.repeaters.length) // if no repeaters then position is 16, if 1 repeater then position is 23, if 2 repeaters then position is 30

            // 
            this._payload = String.fromCharCode(...this.encoded.slice(position, this.encoded.lastIndexOf(0xC0)))

            // TODO: compression moved to back burner
            // if (this.isPayloadCompressed()) { // getPayloadIsCompressed() actually double checks both bits to prevent false positives
            //     try {
            //         this.payload = brotliDecompressSync(JSONB.parse(this.payload)).toString()
            //         this.cacheManager.set(this.getDestinationCallsign(), this.getDestinationSsid(), { supportsCompression: true })
            //     }
            //     catch (error) { // if decompression fails then something else must be using the reserved bits, save that to the cache to prevent sending compressed data to a client that doesn't support it
            //         this.cacheManager.set(this.getDestinationCallsign(), this.getDestinationSsid(), { supportsCompression: false })
            //     }
            // }

            // if the decoded payload starts with JSONish characters, try parsing it. Do not parse information frames because multiple frame payloads need to be concatenated first
            if (((this._payload as string).startsWith('{') || (this._payload as string).startsWith('[')) && this.frameSubtype !== 'I') {
                try {
                    this._payload = JSONB.parse(this._payload as string)
                } catch (error) {
                    // it was probably just a string that started with { or [, so we'll continue
                }
            }
            // if it's a number as a string, parse it to a number, again ignore it if it's an information frame because we need to concatenate the payloads first
            else if (!isNaN(this._payload as number) && this.frameSubtype !== 'I') {
                if ((this._payload as string).includes('.')) {
                    this._payload = parseFloat(this._payload as string)
                }
                else {
                    this._payload = parseInt(this._payload as string)
                }
            }
        }
        return this._payload
    }

    // use a getter so that it's lazy loaded
    protected get responseConstructor(): OutgoingConstructor {
        return {
            kissConnection: this.kissConnection,
            destinationCallsign: this.sourceCallsign,
            destinationSsid: this.sourceSsid,
            destinationReservedBitOne: this.sourceReservedBitOne,
            destinationReservedBitTwo: this.sourceReservedBitTwo,
            sourceCallsign: this.destinationCallsign,
            sourceSsid: this.destinationSsid,
            sourceReservedBitOne: this.destinationReservedBitOne,
            sourceReservedBitTwo: this.destinationReservedBitTwo,
            repeaters: structuredClone(this.repeaters).map((r) => {
                r.hasBeenRepeated = false
                return r
            })
        }
    }

    protected sResponseConstructor(receivedSequence: number, requestRemoteStatus: boolean): SFrameConstructor {
        const c: SFrameConstructor = structuredClone(this.responseConstructor) as SFrameConstructor
        c.modulo = this.modulo
        c.receivedSequence = receivedSequence
        c.pollOrFinal = requestRemoteStatus
        c.commandOrResponse = (requestRemoteStatus) ? 'command' : 'response'
        return c
    }

    public REJFrame(receivedSequence: number, requestRemoteStatus: boolean): REJFrame {
        return new REJFrame(this.sResponseConstructor(receivedSequence, requestRemoteStatus))
    }

    public RNRFrame(receivedSequence: number, requestRemoteStatus: boolean): RNRFrame {
        return new RNRFrame(this.sResponseConstructor(receivedSequence, requestRemoteStatus))
    }

    public RRFrame(receivedSequence: number, requestRemoteStatus: boolean): RRFrame {
        return new RRFrame(this.sResponseConstructor(receivedSequence, requestRemoteStatus))
    }

    public SREJFrame(receivedSequence: number, pollOrFinal: boolean, commandOrResponse: 'command' | 'response'): SREJFrame {
        const c: SREJFrameConstructor = structuredClone(this.responseConstructor) as SREJFrameConstructor
        c.modulo = this.modulo
        c.receivedSequence = receivedSequence
        c.pollOrFinal = pollOrFinal
        c.commandOrResponse = commandOrResponse
        return new SREJFrame(c)
    }

    public DISCFrame(): DISCFrame {
        return new DISCFrame(this.responseConstructor)
    }

    public DMFrame(): DMFrame {
        return new DMFrame(this.responseConstructor)
    }

    public SABMFrame(): SABMFrame {
        return new SABMFrame(this.responseConstructor)
    }

    public SABMEFrame(): SABMEFrame {
        return new SABMEFrame(this.responseConstructor)
    }

    public TESTFrame(payload?: any, commandOrResponse: 'command' | 'response' = 'command'): TESTFrame {
        const c: TestFrameConstructor = structuredClone(this.responseConstructor)
        c.payload = payload
        c.commandOrResponse = commandOrResponse
        return new TESTFrame(c)
    }

    public UAFrame(): UAFrame {
        return new UAFrame(this.responseConstructor)
    }

    public UIFrame(payload: any, pid: number = this.pid ?? 240, pollOrFinal: boolean = false, commandOrResponse: 'command' | 'response' = 'response'): UIFrame {
        const c: UIFrameConstructor = structuredClone(this.responseConstructor) as UIFrameConstructor
        c.payload = payload
        c.pid = pid
        c.pollOrFinal = pollOrFinal
        c.commandOrResponse = commandOrResponse
        return new UIFrame(c)
    }

    public XIDFrame(commandOrResponse: 'command' | 'response' = 'response', pollOrFinal: boolean = false): XIDFrame {
        const c: XIDFrameConstructor = structuredClone(this.responseConstructor)
        c.commandOrResponse = commandOrResponse
        c.pollOrFinal = pollOrFinal
        return new XIDFrame(c)
    }

    public IFrame(payload: any, receivedSequence: number, sendSequence: number, pollOrFinal: boolean = false, pid: number = this.pid ?? 240): IFrame {
        const c: IFrameConstructor = structuredClone(this.responseConstructor) as IFrameConstructor
        c.modulo = this.modulo
        c.payload = payload
        c.receivedSequence = receivedSequence
        c.sendSequence = sendSequence
        c.pollOrFinal = pollOrFinal
        c.pid = pid
        return new IFrame(c)
    }

}