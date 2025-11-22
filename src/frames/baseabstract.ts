// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import util from "node:util"
import type { Repeater } from "../misc"

export type SFrameType = 'RR' | 'RNR' | 'REJ' | 'SREJ'
export type UFrameType = 'SABME' | 'SABM' | 'DISC' | 'DM' | 'UA' | 'UI' | 'FRMR' | 'XID' | 'TEST'
export type IFrameType = 'I'
export type FrameSubtype = SFrameType | UFrameType | IFrameType

export abstract class BaseAbstract {
    public abstract type: 'information' | 'supervisory' | 'unnumbered'
    public abstract subtype: FrameSubtype
    public abstract destinationCallsign: string
    public abstract destinationSsid: number
    public abstract destinationCommandBit: boolean
    public abstract destinationReservedBitOne: boolean
    public abstract destinationReservedBitTwo: boolean
    public abstract sourceCallsign: string
    public abstract sourceSsid: number
    public abstract sourceCommandBit: boolean
    public abstract sourceReservedBitOne: boolean
    public abstract sourceReservedBitTwo: boolean
    public abstract commandOrResponse: 'command' | 'response' | 'legacy'
    public abstract isCommand: boolean
    public abstract isResponse: boolean
    public abstract isLegacy: boolean
    public abstract repeaters: Repeater[]
    public abstract modulo: 8 | 128
    protected abstract receivedSequence: number | undefined
    public abstract pollOrFinal: boolean
    protected abstract sendSequence: number | undefined
    protected abstract pid: number | undefined
    protected abstract payload: any

    public toJSON() {
        return {
            type: this.type,
            subtype: this.subtype,
            destinationCallsign: this.destinationCallsign,
            destinationSsid: this.destinationSsid,
            destinationCommandBit: this.destinationCommandBit,
            destinationReservedBitOne: this.destinationReservedBitOne,
            destinationReservedBitTwo: this.destinationReservedBitTwo,
            sourceCallsign: this.sourceCallsign,
            sourceSsid: this.sourceSsid,
            sourceCommandBit: this.sourceCommandBit,
            sourceReservedBitOne: this.sourceReservedBitOne,
            sourceReservedBitTwo: this.sourceReservedBitTwo,
            commandOrResponse: this.commandOrResponse,
            isCommand: this.isCommand,
            isResponse: this.isResponse,
            isLegacy: this.isLegacy,
            repeaters: this.repeaters,
            modulo: this.modulo,
            receivedSequence: this.receivedSequence,
            pollOrFinal: this.pollOrFinal,
            sendSequence: this.sendSequence,
            pid: this.pid,
            payload: this.payload
        }
    }

    public toString(): string {
        return JSON.stringify(this.toJSON())
    }

    [util.inspect.custom] = () => {
        return this.toJSON()
    }

}