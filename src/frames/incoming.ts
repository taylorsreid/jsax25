// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { resetRepeaters, type Repeater } from "../misc";
import { BaseAbstract, type FrameSubtype } from "./baseabstract";
import { controlFieldCombinations } from './controlFieldCombinations';
import { IFrame, IFrameConstructor } from "./outgoing/information";
import { OutgoingConstructor } from "./outgoing/outgoingabstract";
import { REJFrame, RNRFrame, RRFrame, SFrameConstructor, SREJFrame, SREJFrameConstructor } from "./outgoing/supervisory";
import { DISCFrame, DMFrame, SABMEFrame, SABMFrame, TESTFrame, TESTFrameConstructor, UAFrame, UIFrame, UIFrameConstructor, XIDFrame, XIDFrameConstructor } from "./outgoing/unnumbered";

/**
 * A class abstraction around an incoming binary AX25 frame allowing data to be retrieved using getters.
 */
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
    protected _type: 'information' | 'supervisory' | 'unnumbered' | undefined;
    protected _subtype: FrameSubtype | undefined;
    protected _pid: number | undefined;
    protected _payload: Buffer | undefined;

    /** The raw number array backing the AX25 frame's data. */
    public readonly encoded: number[];

    /**
     * Create a new IncomingFrame object from an incoming ArrayLike\<number\> or Iterable\<number\> from a KISS source such as a TCP port, serial port, etc.
     * @param encodedKissFrame An ArrayLike\<number\> or Iterable\<number\> representing a raw KISS frame.
     * @param modulo Determines the number of outstanding information frames allowed per layer 2 connection at one time. Only change this to 128 on supervisory and information frames when you are sure that you are using modulo 128, as setting it incorrectly will cause frames not to decode. Defaults to 8.
     */
    constructor(encodedKissFrame: ArrayLike<number> | Iterable<number>, modulo: 8 | 128 = 8) {
        super()
        this.encoded = Array.from(encodedKissFrame)
        this.modulo = modulo
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

    public get destinationSsid(): number {
        if (typeof this._destinationSsid === 'undefined') {
            this._destinationSsid = parseInt(this.encoded[8].toString(2).padStart(8, '0').slice(3, 7), 2)
        }
        return this._destinationSsid
    }

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

    public get sourceSsid(): number {
        if (typeof this._sourceSsid === 'undefined') {
            this._sourceSsid = parseInt(this.encoded[15].toString(2).padStart(8, '0').slice(3, 7), 2)
        }
        return this._sourceSsid
    }

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
        // When I wrote this only God and myself understood how it worked. Now only God understands.
        return (this.modulo === 8) ? this.encoded[16 + (7 * this.repeaters.length)].toString(2).padStart(8, '0') : this.encoded[16 + (7 * this.repeaters.length)].toString(2).padStart(8, '0') + this.encoded[17 + (7 * this.repeaters.length)].toString(2).padStart(8, '0')
    }

    public get type(): 'unnumbered' | 'supervisory' | 'information' {
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
                const found = controlFieldCombinations.find((cc) => {
                    return cc.binaryOne === cfb.slice(0, 3) && cc.binaryTwo === cfb.slice(4)
                })! // all valid frame types are listed
                this._subtype = found.frameSubtype
            }
            else if (this.type === 'supervisory') {
                const found = controlFieldCombinations.find((cc) => {
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
        return this._subtype // it has to be one of the 3
    }

    public get receivedSequence(): number | undefined {
        if (this.type !== 'unnumbered' && typeof this._receivedSequence === 'undefined') { // received sequences only exist on the other 2 frame types
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

    public get pid(): number | undefined {
        if (typeof this._pid === 'undefined' && (this.subtype === 'I' || this.subtype === 'UI')) { // only exist on I and UI frames
            this._pid = this.encoded[17 + (7 * this.repeaters.length)]
        }
        return this._pid
    }

    /**
     * The data or "body" being carried by the frame.
     * 
     * Only exists on unnumbered information (UI), information (I), Test (TEST), and exchange identification (XID) frames.
     * @returns a Buffer representing the payload data on frames that have a payload, or undefined on frames that don't have a payload.
     */
    public get payload(): Buffer | undefined {
        if (typeof this._payload === 'undefined' && (this.subtype === 'UI' || this.subtype === 'I' || this.subtype === 'TEST' || this.subtype === 'XID')) {
            // ternary accounts for the presence of a pid field and gets the correct offset
            let position: number = ((this.subtype === 'I' || this.subtype === 'UI') ? 18 : 17) + (7 * this.repeaters.length)

            // decode all the way until the frame end flag since kiss frames have a 0xC0 at the end of the frame
            this._payload = Buffer.from(this.encoded.slice(position, this.encoded.lastIndexOf(0xC0)))
        }
        return this._payload
    }

    protected get responseConstructor(): OutgoingConstructor {
        return {
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

    /**
     * Get a pre-addressed OutgoingFrame to reply with. A convenience method that returns a frame type of your choice, with the destination and source information reversed from the source frame.
     * @example
     * ```ts
     * import { createConnection, Socket } from "net";
     * import { IncomingFrame, UIFrame } from "jsax25";
     * 
     * const MY_CALL: string = 'N0CALL'
     * const MY_SSID: number = 10
     * 
     * const kissConnection: Socket = createConnection({
     *      host: 'localhost',
     *      port: 8001
     * })
     * 
     * kissConnection.on('data', (chunk) => {
     *      const incoming = new IncomingFrame(chunk)
     * 
     *      if (incoming.destinationCallsign === MY_CALL && incoming.destinationSsid === MY_SSID) {
     * 
     *          // response's destinationCallsign and destinationSsid are set to incoming's sourceCallsign and sourceSsid
     *          // response's sourceCallsign and sourceSsid are set to incoming's destinationCallsign and destinationSsid
     *          const response: UIFrame = incoming.replyWith('UI', `Thank you ${incoming.sourceCallsign}-${incoming.sourceSsid}! I've received your message!`)
     * 
     *          kissConnection.write(new Uint8Array(response.encode()))
     *      }
     * })
     * ```
     */
    public replyWith(frameSubtype: 'RR', receivedSequence: number, pollOrFinal?: boolean, commandOrResponse?: 'command' | 'response'): RRFrame
    public replyWith(frameSubtype: 'RNR', receivedSequence: number, pollFinal?: boolean, commandOrResponse?: 'command' | 'response'): RNRFrame
    public replyWith(frameSubtype: 'REJ', receivedSequence: number, pollFinal?: boolean, commandOrResponse?: 'command' | 'response'): REJFrame   
    public replyWith(frameSubtype: 'SREJ', receivedSequence: number, pollFinal: boolean, commandOrResponse?: 'command' | 'response'): SREJFrame
    public replyWith(frameSubtype: 'SABME'): SABMEFrame
    public replyWith(frameSubtype: 'SABM'): SABMFrame
    public replyWith(frameSubtype: 'DISC'): DISCFrame
    public replyWith(frameSubtype: 'DM'): DMFrame
    public replyWith(frameSubtype: 'UA'): UAFrame
    public replyWith(frameSubtype: 'UI', payload: any, pid?: number, pollOrFinal?: boolean, commandOrResponse?: 'command' | 'response'): UIFrame
    public replyWith(frameSubtype: 'XID', commandOrResponse?: 'command' | 'response', pollOrFinal?: boolean): XIDFrame
    public replyWith(frameSubtype: 'TEST', payload?: any, commandOrResponse?: 'command' | 'response'): TESTFrame
    public replyWith(frameSubtype: 'I', payload: any, receivedSequence: number, sendSequence: number, pollOrFinal?: boolean, pid?: number): IFrame
    public replyWith(frameSubtype: Exclude<FrameSubtype, 'FRMR'>, param1?: any, param2?: any, param3?: any, param4?: any, param5?: any) {
            switch (frameSubtype) {
                case 'RR':
                    param2 ??= false
                    param3 ??= 'response'
                    return new RRFrame(this.sResponseConstructor(param1, param2, param3))
                case 'RNR':
                    param2 ??= false
                    param3 ??= 'response'
                    return new RNRFrame(this.sResponseConstructor(param1, param2, param3))
                case 'REJ':
                    param2 ??= false
                    param3 ??= 'response'
                    return new REJFrame(this.sResponseConstructor(param1, param2, param3))
                case 'SREJ':
                    // pollOrFinal is optional in SFrameConstructor but required in SREJFrameConstructor. We already set it in the sResponseConstructor method, so type cast it.
                    param3 ??= 'response'
                    return new SREJFrame(this.sResponseConstructor(param1, param2, param3) as SREJFrameConstructor)
                case 'SABME':
                    return new SABMEFrame(this.responseConstructor)
                case 'SABM':
                    return new SABMFrame(this.responseConstructor)
                case 'DISC':
                    return new DISCFrame(this.responseConstructor)
                case 'DM':
                    return new DMFrame(this.responseConstructor)
                case 'UA':
                    return new UAFrame(this.responseConstructor)
                case 'UI':
                    const uic: UIFrameConstructor = structuredClone(this.responseConstructor) as UIFrameConstructor
                    uic.payload = param1
                    uic.pid = param2 ?? this.pid ?? 240
                    uic.pollOrFinal = param3 ?? false
                    uic.commandOrResponse = param4 ?? 'response'
                    return new UIFrame(uic)
                case 'XID':
                    const xidc: XIDFrameConstructor = structuredClone(this.responseConstructor)
                    xidc.commandOrResponse = param1 ?? 'command'
                    xidc.pollOrFinal = param2 ?? false
                    return new XIDFrame(xidc)
                case 'TEST':
                    const tc: TESTFrameConstructor = structuredClone(this.responseConstructor)
                    tc.payload = param1
                    tc.commandOrResponse = param2 ?? 'command'
                    return new TESTFrame(tc)
                case 'I':
                    const ic: IFrameConstructor = structuredClone(this.responseConstructor) as IFrameConstructor
                    ic.modulo = this.modulo
                    ic.payload = param1
                    ic.receivedSequence = param2
                    ic.sendSequence = param3
                    ic.pollOrFinal = param4 ?? false
                    ic.pid = param5 ?? this.pid ?? 240
                    return new IFrame(ic)
            }
    }

}