import { DISCFrame, DMFrame, IFrame, KissConnection, REJFrame, RNRFrame, RRFrame, SABMEFrame, SABMFrame, SREJFrame, TESTFrame, UAFrame, UIFrame, XIDFrame, type IFrameConstructor, type OutgoingConstructor, type SFrameConstructor, type SREJFrameConstructor, type TestFrameConstructor, type UIFrameConstructor, type XIDFrameConstructor } from 'index.js';
import type { SerialKissConstructor, TcpKissConstructor } from 'kissconnection.js';
import { resetRepeaters, type Repeater } from "../misc.js";
import { BaseAbstract, type FrameSubtype, type FrameType } from "./baseabstract.js";
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
    protected _type: FrameType | undefined;
    protected _subtype: FrameSubtype | undefined;
    protected _pid: number | undefined;
    protected _payload: Buffer | undefined; // TODO: buffer? number[]?
    public readonly encoded: number[];
    public readonly kissConnection: KissConnection | undefined;

    constructor(encodedKissFrame: number[], kissConnection?: KissConnection | TcpKissConstructor | SerialKissConstructor, modulo: 8 | 128 = 8) {
        super()

        this.encoded = encodedKissFrame

        //
        this.modulo = modulo

        if (kissConnection instanceof KissConnection) {
            this.kissConnection = kissConnection
        }
        else if (typeof kissConnection !== 'undefined') {
            this.kissConnection = new KissConnection(kissConnection)
        }
    }

    private static decodeCallsign(bytes: number[]): string {
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
            this._destinationCallsign = IncomingFrame.decodeCallsign(this.encoded.slice(2, 8))
        }
        return this._destinationCallsign
    }

    public get destinationCommandBit(): boolean {
        if (typeof this._destinationCommandBit === 'undefined') {
            this._destinationCommandBit = this.encoded[8].toString(2).padStart(8, '0').startsWith('1')
        }
        return this._destinationCommandBit
    }

    public get destinationReservedBitOne(): boolean {
        if (typeof this._destinationReservedBitOne === 'undefined') {
            this._destinationReservedBitOne = this.encoded[8].toString(2).padStart(8, '0')[1] === '0'
        }
        return this._destinationReservedBitOne
    }

    public get destinationReservedBitTwo(): boolean {
        if (typeof this._destinationReservedBitTwo === 'undefined') {
            this._destinationReservedBitTwo = this.encoded[8].toString(2).padStart(8, '0')[2] === '0'
        }
        return this._destinationReservedBitTwo
    }

    /** Get the destination's SSID. */
    public get destinationSsid(): number {
        if (typeof this._destinationSsid === 'undefined') {
            this._destinationSsid = parseInt(this.encoded[8].toString(2).padStart(8, '0').slice(3, 7), 2)
        }
        return this._destinationSsid
    }

    /** Get the sender's amateur radio callsign. */
    public get sourceCallsign(): string {
        if (typeof this._sourceCallsign === 'undefined') {
            this._sourceCallsign = IncomingFrame.decodeCallsign(this.encoded.slice(9, 15))
        }
        return this._sourceCallsign
    }

    public get sourceCommandBit(): boolean {
        if (typeof this._sourceCommandBit === 'undefined') {
            this._sourceCommandBit = this.encoded[15].toString(2).padStart(8, '0').startsWith('1')
        }
        return this._sourceCommandBit
    }

    public get sourceReservedBitOne(): boolean {
        if (typeof this._sourceReservedBitOne === 'undefined') {
            this._sourceReservedBitOne = this.encoded[15].toString(2).padStart(8, '0')[1] === '0'
        }
        return this._sourceReservedBitOne
    }
    public get sourceReservedBitTwo(): boolean {
        if (typeof this._sourceReservedBitTwo === 'undefined') {
            this._sourceReservedBitTwo = this.encoded[15].toString(2).padStart(8, '0')[2] === '0'
        }
        return this._sourceReservedBitTwo
    }

    /** Get the sender's SSID. */
    public get sourceSsid(): number {
        if (typeof this._sourceSsid === 'undefined') {
            this._sourceSsid = parseInt(this.encoded[15].toString(2).padStart(8, '0').slice(3, 7), 2)
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
            let position: number = 16
            while (this.encoded[position - 1].toString(2).endsWith('0')) {
                this._repeaters.push({
                    callsign: IncomingFrame.decodeCallsign(this.encoded.slice(position, position + 6)),
                    ssid: parseInt(this.encoded[position + 6].toString(2).padStart(8, '0').slice(3, 7), 2),
                    hasBeenRepeated: this.encoded[position + 6].toString(2).padStart(8, '0').startsWith('1')
                })
                position += 7
            }
        }
        return this._repeaters
    }

    private getControlFieldBits(): string {
        // TODO: EXPLAIN
        return (this.modulo === 8) ? this.encoded[16 + (7 * this.repeaters.length)].toString(2).padStart(8, '0') : this.encoded[16 + (7 * this.repeaters.length)].toString(2).padStart(8, '0') + this.encoded[17 + (7 * this.repeaters.length)].toString(2).padStart(8, '0')
    }

    public get type(): FrameType {
        if (typeof this._type === 'undefined') {
            const cfb: string = this.getControlFieldBits()
            if (cfb.endsWith('11')) {
                this._type = 'unnumbered'
            }
            else if (cfb.endsWith('01')) {
                this._type = 'supervisory'
            }
            else {
                this._type = 'information'
            }
        }
        return this._type
    }

    public get subtype(): FrameSubtype {
        if (typeof this._subtype === 'undefined') {

            const cfb: string = this.getControlFieldBits()
            if (this.type === 'unnumbered') {
                const found: ControlFieldCombination = controlFieldCombinations.find((cc) => {
                    return cc.binaryOne === cfb.slice(0, 3) && cc.binaryTwo === cfb.slice(4)
                })! // all valid frame types are listed
                this._subtype = found.frameSubtype
            }
            else if (this.type === 'supervisory') {
                const found: ControlFieldCombination = controlFieldCombinations.find((cc) => {
                    if (this.modulo === 8) {
                        return cc.binaryTwo === cfb.slice(4, 8)
                    }
                    else {
                        return cc.binaryTwo === cfb.slice(8, 16)
                    }
                })! // all valid frame types are listed
                this._subtype = found.frameSubtype
            }
            else {
                this._subtype = 'I'
            }
        }
        return this._subtype! // it has to be one of the 3
    }

    public get receivedSequence(): number | undefined {
        if (this.type !== 'unnumbered' && typeof this._receivedSequence === 'undefined') { // received sequences only exist on the other 2 internal frame types
            this._receivedSequence = (this.modulo === 8) ? parseInt(this.getControlFieldBits().slice(0, 3), 2) : parseInt(this.getControlFieldBits().slice(0, 7), 2)
        }
        return this._receivedSequence
    }

    public get pollOrFinal(): boolean {
        if (typeof this._pollOrFinal === 'undefined') {
            this._pollOrFinal = (this.modulo === 8) ? this.getControlFieldBits()[3] === '1' : this.getControlFieldBits()[7] === '1'
        }
        return this._pollOrFinal
    }

    public get sendSequence(): number | undefined {
        if (this.subtype === 'I' && typeof this._sendSequence === 'undefined') { // send sequences only exist on I frames
            this._sendSequence = (this.modulo === 8) ? parseInt(this.getControlFieldBits().slice(4, 7), 2) : parseInt(this.getControlFieldBits().slice(8, 16), 2)
        }
        return this._sendSequence
    }

    /**
     * Number indicating which layer 3 protocol is in use, default is 240 which is none.
     * @returns a number corresponding to the layer 3 protocol in use. See AX.25 documentation for a key: value table.
     */
    public get pid(): number | undefined {
        if (typeof this._pid === 'undefined' && (this.subtype === 'I' || this.subtype === 'UI')) { // only exist on I and UI frames
            this._pid = this.encoded[17 + (7 * this.repeaters.length)]
        }
        return this._pid
    }

    public get payload(): Buffer | undefined {
        if (typeof this._payload === 'undefined' && (this.subtype === 'UI' || this.subtype === 'I' || this.subtype === 'TEST' || this.subtype === 'XID')) {
            // this._payload = ''

            // ternary accounts for the presence of a pid field
            let position: number = ((this.subtype === 'I' || this.subtype === 'UI') ? 18 : 17) + (7 * this.repeaters.length)

            // decode all the way until the frame end flag since kiss frames have a 0xC0 at the end of the frame
            // this._payload = String.fromCharCode(...this.encoded.slice(position, this.encoded.lastIndexOf(0xC0)))
            this._payload = Buffer.from(this.encoded.slice(position, this.encoded.lastIndexOf(0xC0)))
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
            repeaters: resetRepeaters(this.repeaters)
        }
    }

    protected sResponseConstructor(receivedSequence: number, pollOrFinal: boolean, commandOrResponse: 'command' | 'response'): SFrameConstructor {
        const c: SFrameConstructor = structuredClone(this.responseConstructor) as SFrameConstructor
        c.modulo = this.modulo
        c.receivedSequence = receivedSequence
        c.pollOrFinal = pollOrFinal
        c.commandOrResponse = commandOrResponse
        return c
    }

    public newREJFrame(receivedSequence: number, pollOrFinal: boolean, commandOrResponse: 'command' | 'response'): REJFrame {
        return new REJFrame(this.sResponseConstructor(receivedSequence, pollOrFinal, commandOrResponse))
    }

    public newRNRFrame(receivedSequence: number, pollOrFinal: boolean, commandOrResponse: 'command' | 'response'): RNRFrame {
        return new RNRFrame(this.sResponseConstructor(receivedSequence, pollOrFinal, commandOrResponse))
    }

    public newRRFrame(receivedSequence: number, pollOrFinal: boolean, commandOrResponse: 'command' | 'response'): RRFrame {
        return new RRFrame(this.sResponseConstructor(receivedSequence, pollOrFinal, commandOrResponse))
    }

    public newSREJFrame(receivedSequence: number, pollOrFinal: boolean, commandOrResponse: 'command' | 'response'): SREJFrame {
        // pollOrFinal is optional in SFrameConstructor but required in SREJFrameConstructor. We already set it in the sResponseConstructor method, so type cast it.
        return new SREJFrame(this.sResponseConstructor(receivedSequence, pollOrFinal, commandOrResponse) as SREJFrameConstructor)
    }

    public newDISCFrame(): DISCFrame {
        return new DISCFrame(this.responseConstructor)
    }

    public newDMFrame(): DMFrame {
        return new DMFrame(this.responseConstructor)
    }

    public newSABMFrame(): SABMFrame {
        return new SABMFrame(this.responseConstructor)
    }

    public newSABMEFrame(): SABMEFrame {
        return new SABMEFrame(this.responseConstructor)
    }

    public newTESTFrame(payload?: any, commandOrResponse: 'command' | 'response' = 'command'): TESTFrame {
        const c: TestFrameConstructor = structuredClone(this.responseConstructor)
        c.payload = payload
        c.commandOrResponse = commandOrResponse
        return new TESTFrame(c)
    }

    public newUAFrame(): UAFrame {
        return new UAFrame(this.responseConstructor)
    }

    public newUIFrame(payload: any, pid: number = this.pid ?? 240, pollOrFinal: boolean = false, commandOrResponse: 'command' | 'response' = 'response'): UIFrame {
        const c: UIFrameConstructor = structuredClone(this.responseConstructor) as UIFrameConstructor
        c.payload = payload
        c.pid = pid
        c.pollOrFinal = pollOrFinal
        c.commandOrResponse = commandOrResponse
        return new UIFrame(c)
    }

    public newXIDFrame(commandOrResponse: 'command' | 'response' = 'response', pollOrFinal: boolean = false): XIDFrame {
        const c: XIDFrameConstructor = structuredClone(this.responseConstructor)
        c.commandOrResponse = commandOrResponse
        c.pollOrFinal = pollOrFinal
        return new XIDFrame(c)
    }

    public newIFrame(payload: any, receivedSequence: number, sendSequence: number, pollOrFinal: boolean = false, pid: number = this.pid ?? 240): IFrame {
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