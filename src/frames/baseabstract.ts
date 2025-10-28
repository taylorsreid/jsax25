import type { Repeater } from "../misc.js"
import util from "node:util"

export type FrameType = 'information' | 'supervisory' | 'unnumbered'
export type SFrameType = 'RR' | 'RNR' | 'REJ' | 'SREJ'
export type UFrameType = 'SABME' | 'SABM' | 'DISC' | 'DM' | 'UA' | 'UI' | 'FRMR' | 'XID' | 'TEST'
export type IFrameType = 'I'
export type FrameSubtype = SFrameType | UFrameType | IFrameType

export abstract class BaseAbstract {
    public abstract type: FrameType
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
    public abstract encoded: number[]

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

    [util.inspect.custom] = () => {
        return this.toJSON()
    }

}