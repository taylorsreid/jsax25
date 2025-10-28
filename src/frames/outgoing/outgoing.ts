import { isPromise } from "util/types";
import { KissConnection, type SerialKissConstructor, type TcpKissConstructor } from "../../index.js";
import { validateCallsign, validateSsid, type Repeater } from "../../misc.js";
import { BaseAbstract, type FrameSubtype, type FrameType } from "../baseabstract.js";
import { controlFieldCombinations } from "../controlFieldCombinations.js";
import type { IFrameConstructor } from './information.js';
import type { SREJFrameConstructor } from './supervisory/srej.js';
import type { SFrameConstructor } from './supervisory/supervisoryabstract.js';
import type { TestFrameConstructor } from './unnumbered/test.js';
import type { UIFrameConstructor } from './unnumbered/ui.js';
import type { XIDFrameConstructor } from './unnumbered/xid.js';

export interface OutgoingConstructor {
    /** A configured and active KissConnection to send the outgoing frame on. */
    kissConnection?: KissConnection | TcpKissConstructor | SerialKissConstructor
    /** The amateur radio callsign of the remote station. */
    destinationCallsign: string
    /** The SSID of the remote station, default is 0. */
    destinationSsid: number
    /** The first reserved bit on the destination field. */
    destinationReservedBitOne?: boolean
    /** The second reserved bit on the destination field. */
    destinationReservedBitTwo?: boolean
    /** The amateur radio callsign of your station. */
    sourceCallsign: string
    /** The SSID of your station, default is 0. */
    sourceSsid: number
    /** The first reserved bit of the source field. */
    sourceReservedBitOne?: boolean
    /** The second reserved bit of the source field. */
    sourceReservedBitTwo?: boolean
    /** The repeater path that you wish your packet to take, defaults to an empty array. */
    repeaters?: Repeater[],
}

export abstract class OutgoingFrame extends BaseAbstract {
    // all ! properties are set via setters and/or the controlFieldCombinations search
    public readonly subtype: FrameSubtype
    public readonly type: FrameType
    private _kissConnection: KissConnection | undefined
    private _destinationCallsign!: string
    private _destinationSsid!: number
    private _destinationCommandBit!: boolean;  // set by commandOrResponse setter and/or the controlFieldCombinations search
    private _destinationReservedBitOne!: boolean;
    private _destinationReservedBitTwo!: boolean;
    private _sourceCallsign!: string
    private _sourceSsid!: number
    private _sourceCommandBit!: boolean;  // set by commandOrResponse setter and/or the controlFieldCombinations search
    private _sourceReservedBitOne!: boolean;
    private _sourceReservedBitTwo!: boolean;
    private _repeaters!: Repeater[];
    private _modulo: 8 | 128;
    private binaryOne: string | undefined;
    private _receivedSequence: number | undefined
    private _pollOrFinal!: boolean;
    private binaryTwo: string | undefined;
    private _sendSequence: number | undefined
    private _pid: number | undefined;
    private _payload: any
    private _encoded: number[] | undefined

    constructor(args: OutgoingConstructor | IFrameConstructor | SFrameConstructor | SREJFrameConstructor | TestFrameConstructor | UIFrameConstructor | XIDFrameConstructor, frameSubtype: FrameSubtype) {

        super()

        this._modulo = ('modulo' in args && typeof args.modulo !== 'undefined') ? args.modulo : 8

        const found = controlFieldCombinations.find((cc) => {
            return cc.frameSubtype === frameSubtype && cc.modulo === this.modulo
        })

        if (!found) {
            throw new Error(`Invalid combination of a ${frameSubtype} frame and modulo ${this.modulo}, this combination does not exist.`)
        }

        this.type = found.frameType
        this.subtype = found.frameSubtype
        this.binaryOne = found.binaryOne
        this.binaryTwo = found.binaryTwo
        this.kissConnection = args.kissConnection
        this.destinationCallsign = args.destinationCallsign
        this.destinationSsid = args.destinationSsid
        this.destinationReservedBitOne = args?.destinationReservedBitOne ?? false
        this.destinationReservedBitTwo = args?.destinationReservedBitTwo ?? false
        this.sourceCallsign = args.sourceCallsign
        this.sourceSsid = args.sourceSsid
        this.sourceReservedBitOne = args.sourceReservedBitOne ?? false
        this.sourceReservedBitTwo = args.sourceReservedBitTwo ?? false
        this.repeaters = args?.repeaters ?? []
        this.commandOrResponse = 'commandOrResponse' in args && args.commandOrResponse ? args.commandOrResponse : found.commandOrResponse
        this.pollOrFinal = 'pollOrFinal' in args && typeof args.pollOrFinal !== 'undefined' ? args.pollOrFinal : found.pollOrFinal
        this.receivedSequence = 'receivedSequence' in args && (this.type === 'information' || this.type === 'supervisory') ? args.receivedSequence : undefined
        this.sendSequence = 'sendSequence' in args && this.type === 'information' ? args.sendSequence : undefined
        if ('pid' in args && (this.type === 'information' || this.subtype === 'UI')) {
            this.pid = args.pid ?? 0xF0
        }
        else if (this.type === 'information' || this.subtype === 'UI') {
            this.pid = 0xF0
        }
        if ('payload' in args && (this.subtype === 'UI' || this.subtype === 'I' || this.subtype === 'TEST' || this.subtype === 'XID')) {
            this.payload = args.payload
        }
    }

    protected static encodeAddressField(callsign: string, commandOrHasBeenRepeated: boolean, reservedBitOne: boolean, reservedBitTwo: boolean, ssid: number, finalAddress: boolean): number[] {

        // no need to do preflight checks in this protected method, already done via the setters
        callsign = callsign.padEnd(6)

        // empty array to hold our encoded results
        let bytes: number[] = []

        // get ascii code for each character in the callsign, bit shift it left by one, and push
        for (let i = 0; i < callsign.length; i++) {
            bytes.push(callsign.charCodeAt(i) << 1)
        }

        // empty string to hold our 1s and 0s
        let bits: string = ''
        bits += commandOrHasBeenRepeated ? '1' : '0' // if command or has been repeated, push 1
        bits += reservedBitOne ? '0' : '1' // if reserved bit is being used, push 0, otherwise push 1 when not in use. very counterintuitive
        bits += reservedBitTwo ? '0' : '1' // if reserved bit is being used, push 0, otherwise push 1 when not in use. very counterintuitive
        bits += ssid.toString(2).padStart(4, '0') // get binary representation of the ssid and pad it with zeros to a length of 4
        bits += finalAddress ? '1' : '0' // used to indicate whether this is the last address or not

        bytes.push(parseInt(bits, 2))

        return bytes
    }

    protected static encodeControlField(modulo: 8 | 128, bitsOne: string | number, pollFinal: boolean, bitsTwo: string | number): number | number[] {

        // no need to do preflight checks in this protected method, these values are internally calculated

        // if a number is passed in, convert it to a binary string and pad it with 0s to a length of 3
        if (typeof bitsOne === 'number') {
            bitsOne = bitsOne.toString(2)
            if (modulo === 8) {
                bitsOne = bitsOne.padStart(3, '0')
            }
            else {
                bitsOne = bitsOne.padStart(7, '0')
            }
        }

        bitsOne += pollFinal ? '1' : '0'

        if (typeof bitsTwo === 'number') {
            bitsTwo = bitsTwo.toString(2)
            if (modulo === 8) {
                bitsTwo = bitsTwo.padStart(3, '0')
            }
            else {
                bitsTwo = bitsTwo.padStart(7, '0')
            }
            bitsTwo += '0' // if a number was passed in then it's an information frame, which gets an extra 0 at the end
        }

        // return a number if modulo 8, return a number[] if modulo 128
        return (modulo === 8) ? parseInt(bitsOne + bitsTwo, 2) : [parseInt(bitsOne, 2), parseInt(bitsTwo, 2)]
    }

    public get kissConnection(): KissConnection | undefined {
        return this._kissConnection
    }
    public set kissConnection(kissConnection: KissConnection | TcpKissConstructor | SerialKissConstructor | undefined) {
        if (kissConnection instanceof KissConnection || typeof kissConnection === 'undefined') {
            this._kissConnection = kissConnection
        }
        else {
            this._kissConnection = new KissConnection(kissConnection)
        }
    }

    public get destinationCallsign(): string {
        return this._destinationCallsign
    }
    public set destinationCallsign(callsign: string) {
        // uppercase per AX.25 spec, trim for prettiness, will repad at encode time
        callsign = callsign.toUpperCase().trim()
        // pre flight check
        validateCallsign(callsign)
        this._destinationCallsign = callsign
        this._encoded = undefined
    }

    public get destinationSsid(): number {
        return this._destinationSsid
    }
    public set destinationSsid(ssid: number) {
        // pre flight check
        validateSsid(ssid)
        this._destinationSsid = ssid
        this._encoded = undefined
    }

    public get destinationCommandBit(): boolean {
        return this._destinationCommandBit;
    }
    protected set destinationCommandBit(value: boolean) {
        this._destinationCommandBit = value;
    }

    public get destinationReservedBitOne(): boolean {
        return this._destinationReservedBitOne
    }
    public set destinationReservedBitOne(on: boolean) {
        this._destinationReservedBitOne = on
        this._encoded = undefined
    }

    public get destinationReservedBitTwo(): boolean {
        return this._destinationReservedBitTwo
    }
    public set destinationReservedBitTwo(on: boolean) {
        this._destinationReservedBitTwo = on
        this._encoded = undefined
    }

    public get sourceCallsign(): string {
        return this._sourceCallsign
    }
    public set sourceCallsign(callsign: string) {
        // uppercase per AX.25 spec, trim for prettiness, will repad at encode time
        callsign = callsign.toUpperCase().trim()
        // pre flight check
        validateCallsign(callsign)
        this._sourceCallsign = callsign
        this._encoded = undefined
    }

    public get sourceSsid(): number {
        return this._sourceSsid
    }
    public set sourceSsid(ssid: number) {
        // pre flight check
        validateSsid(ssid)
        this._sourceSsid = ssid
        this._encoded = undefined
    }

    public get sourceCommandBit(): boolean {
        return this._sourceCommandBit;
    }
    protected set sourceCommandBit(value: boolean) {
        this._sourceCommandBit = value;
    }

    public get sourceReservedBitOne(): boolean {
        return this._sourceReservedBitOne
    }
    public set sourceReservedBitOne(on: boolean) {
        this._sourceReservedBitOne = on
        this._encoded = undefined
    }

    public get sourceReservedBitTwo(): boolean {
        return this._sourceReservedBitTwo
    }
    public set sourceReservedBitTwo(on: boolean) {
        this._sourceReservedBitTwo = on
        this._encoded = undefined
    }

    public get commandOrResponse(): 'command' | 'response' { // computed property
        // 1 and 0 indicates a command frame, 0 and 1 indicates a response frame
        return (this.destinationCommandBit && !this.sourceCommandBit) ? 'command' : 'response'
    }
    protected set commandOrResponse(commandOrResponse: 'command' | 'response') {  // Not mutable on some frames.
        if (commandOrResponse === 'command') {
            this.destinationCommandBit = true
            this.sourceCommandBit = false
        }
        else {
            this.destinationCommandBit = false
            this.sourceCommandBit = true
        }
        this._encoded = undefined
    }
    public get isCommand(): boolean {
        return this.commandOrResponse === 'command'
    }
    public get isResponse(): boolean {
        return this.commandOrResponse === 'response'
    }
    public get isLegacy(): boolean {
        return false
    }

    public get repeaters(): Repeater[] {
        return this._repeaters
    }
    /** The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined. */
    public set repeaters(repeaters: Repeater[]) {
        // decided not to truncate since some people are still doing more than 2 repeaters hops even though it's against AX.25 spec, plus it's a stupid rule
        // uppercase everything
        this._repeaters = repeaters.map((r) => {
            r.callsign = r.callsign.toUpperCase()
            r.ssid ??= 0
            return r
        })
        this._encoded = undefined
    }

    public get modulo(): 8 | 128 {
        if (this.type === 'unnumbered') {
            return 8
        }
        return this._modulo
    }
    protected set modulo(modulo: 8 | 128) {
        // ignore call if frame is unnumbered
        if (this.type === 'unnumbered') {
            this._modulo = 8
            return
        }

        const found = controlFieldCombinations.find((cc) => {
            return cc.frameSubtype === this.subtype && cc.modulo === modulo
        })
        if (typeof found === 'undefined') {
            throw new Error(`${this.subtype} frames with a modulo of ${modulo} do not exist.`);
        }
        this._modulo = modulo
        if (found.binaryOne) {
            this.binaryOne = found.binaryOne
        }
        if (found.binaryTwo) {
            this.binaryTwo = found.binaryTwo
        }
        this._encoded = undefined
    }

    protected get receivedSequence(): number | undefined { // Doesn't exist on some frames.
        return this._receivedSequence
    }
    protected set receivedSequence(receivedSequence: number | undefined) {
        if (this.modulo === 8 && typeof receivedSequence !== 'undefined' && (receivedSequence < 0 || receivedSequence > 7)) {
            throw new Error(`Received sequence ${receivedSequence} must be between 0 and 7 inclusive when set to modulo 8.`)
        }
        else if (this.modulo === 128 && typeof receivedSequence !== 'undefined' && (receivedSequence < 0 || receivedSequence > 127)) {
            throw new Error(`Received sequence ${receivedSequence} must be between 0 and 127 inclusive when set to modulo 128.`)
        }
        this._receivedSequence = receivedSequence
        this._encoded = undefined
    }

    public get pollOrFinal(): boolean {
        return this._pollOrFinal
    }
    protected set pollOrFinal(pollOrFinal: boolean) { // not mutable on some frames
        this._pollOrFinal = pollOrFinal
        this._encoded = undefined
    }

    protected get sendSequence(): number | undefined { // only exists on information frames
        return this._sendSequence
    }
    protected set sendSequence(sendSequence: number | undefined) {
        if (this.modulo === 8 && typeof sendSequence !== 'undefined' && (sendSequence < 0 || sendSequence > 7)) {
            throw new Error(`Send sequence ${sendSequence} must be between 0 and 7 inclusive when set to modulo 8.`)
        }
        else if (this.modulo === 128 && typeof sendSequence !== 'undefined' && (sendSequence < 0 || sendSequence > 127)) {
            throw new Error(`Send sequence ${sendSequence} must be between 0 and 127 inclusive when set to modulo 128.`)
        }
        this._sendSequence = sendSequence
        this._encoded = undefined
    }

    protected get pid(): number | undefined { // only exists on information and UI frames
        if (this.type === 'information' || this.subtype === 'UI') {
            return this._pid
        }
        return undefined
    }
    protected set pid(pid: number | undefined) { // only exists on information and UI frames
        if (pid! < 0) {
            throw new Error(`PID ${pid} is invalid. PID must be a positive number.`)
        }
        this._pid = pid
        this._encoded = undefined
    }

    protected get payload(): any { // only exists on information, UI, XID, and TEST frames
        return this._payload
    }
    /** Set the payload/body of your packet frame. */
    protected set payload(payload: any) { // not mutable on XID frames
        this._payload = payload
        this._encoded = undefined
    }

    public get encoded(): number[] {
        // avoid reencoding if it's not necessary
        if (typeof this._encoded !== 'undefined') {
            return this._encoded
        }

        let encRet: number[] = []

        // encode and push destination address field
        encRet.push(...OutgoingFrame.encodeAddressField(
            this.destinationCallsign, // already uppercased via this.setDestinationCallsign() and gets padded in OutgoingFrame.encodeAddressField
            this.destinationCommandBit,
            this.destinationReservedBitOne, // currently unused
            this.destinationReservedBitTwo, // currently unused
            this.destinationSsid,
            false // indicates that it's not the final address
        ))

        // encode and push source address field
        encRet.push(...OutgoingFrame.encodeAddressField(
            this.sourceCallsign, // already uppercased via KissConnection.setMyCallsign() and gets padded in OutgoingFrame.encodeAddressField
            this.sourceCommandBit,
            this.sourceReservedBitOne,
            this.sourceReservedBitTwo,
            this.sourceSsid,
            this.repeaters.length <= 0 // true if it's the last address aka no repeaters
        ))

        // encode repeaters, preflight checks already done via setter
        if (this.repeaters.length > 0) {
            for (let i = 0; i < this.repeaters.length; i++) {
                encRet.push(...
                    OutgoingFrame.encodeAddressField(
                        this.repeaters[i].callsign,
                        this.repeaters[i].hasBeenRepeated ?? false, // indicates whether this repeater has already repeated the packet, this bit is flipped by the repeater
                        this.repeaters[i].reservedBitOne ?? false, // currently unused
                        this.repeaters[i].reservedBitTwo ?? false, // currently unused
                        this.repeaters[i].ssid,
                        i === this.repeaters.length - 1 // whether we are on the last repeater in the array or not
                    )
                )
            }
        }

        // encode control field
        let ctl: number | number[]
        if (this.type === 'information') {
            ctl = OutgoingFrame.encodeControlField(this.modulo, this.receivedSequence!, this.pollOrFinal, this.sendSequence!)
        }
        else if (this.type === 'unnumbered') {
            ctl = OutgoingFrame.encodeControlField(this.modulo, this.binaryOne!, this.pollOrFinal, this.binaryTwo!)
        }
        else {
            ctl = OutgoingFrame.encodeControlField(this.modulo, this.receivedSequence!, this.pollOrFinal, this.binaryTwo!)
        }
        Array.isArray(ctl) ? encRet.push(...ctl) : encRet.push(ctl)

        if (this.subtype === 'UI' || this.subtype === 'I') {
            encRet.push(this.pid ?? 0xF0)
        }

        if (this.subtype === 'UI' || this.subtype === 'I' || this.subtype === 'TEST' ) { // ignore XID because it has its own separate encoding procedure
            switch (typeof this.payload) {
                case "string":
                case "number":
                case "bigint":
                case "boolean":
                case "function":
                    encRet.push(...new TextEncoder().encode(String(this.payload)))
                    break;
                case "object":
                    if (isPromise(this.payload)) {
                        throw new Error(`${this.subtype} frame's payload is a promise, resolve all promises to a value before setting them as the payload.`)
                    }
                    else if (
                        (Array.isArray(this.payload) && this.payload.every(item => typeof item === 'number')) ||
                        Buffer.isBuffer(this.payload) ||
                        this.payload instanceof Uint8Array ||
                        this.payload instanceof Uint8ClampedArray
                    ) {
                        encRet.push(...this.payload)
                    }
                    else {
                        encRet.push(...new TextEncoder().encode(JSON.stringify(this.payload)))
                    }
                    break;
                case "undefined":
                    break; // do nothing
                case "symbol":
                    throw new Error(`Invalid payload on ${this.subtype} frame. Symbols cannot be serialized.`)
            }
        }
        else if (this.subtype === 'XID') { // the xid payload is just raw numbers
            encRet.push(...[
                132, // see AX.25 documentation 4.3.3.7 Exchange Identification (XID) Frame, 132 evaluates to half duplex only
                0, // all bits reserved by documentation but never implemented
                97, // supports rejc and srej
                53, // supports modulo 8 and modulo 128
                64, // required by spec, not mutable
                2048, // max I fields length tx 2048 bits === 256 bytes
                2048, // max I fields length rx, ''
                32, // max window size frames tx
                32, // max window size frames rx
                3000, // default acknowledge timer
                10 // default retries is 10
    
                // TODO: fix this? don't have any nearby digis that actually support this it seems like
            ])
        }

        // add header and footer to make AX.25 frame a KISS frame
        encRet.unshift(0x00) // indicates to TNC or software modem that this is a data frame
        encRet.unshift(0xC0) // FEND flag
        encRet.push(0xC0) // FEND flag

        return encRet
    }

    // convenience method
    public send(): void {
        if (typeof this.kissConnection === 'undefined') {
            throw new Error('A valid KISS connection must be set to call the OutgoingFrame.send() method.')
        }
        this.kissConnection.write(this)
    }

}