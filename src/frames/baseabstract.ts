import type { IFrameType, FrameType, Repeater, SFrameType, UFrameType } from "../types"

export abstract class BaseAbstract {
    protected abstract framesubType: UFrameType | SFrameType | IFrameType | undefined
    protected abstract frameType: FrameType | undefined
    protected abstract destinationCallsign: string | undefined
    protected abstract destinationSsid: number | undefined
    protected abstract destinationCommandBit: boolean | undefined
    protected abstract destinationReservedBitOne: boolean | undefined
    protected abstract destinationReservedBitTwo: boolean | undefined
    protected abstract sourceCallsign: string | undefined
    protected abstract sourceSsid: number | undefined
    protected abstract sourceCommandBit: boolean | undefined
    protected abstract sourceReservedBitOne: boolean | undefined
    protected abstract sourceReservedBitTwo: boolean | undefined
    protected abstract repeaters: Repeater[] | undefined
    protected modulo: 8 | 128
    protected abstract receivedSequence: number | undefined
    protected abstract pollOrFinal: boolean | undefined
    protected abstract sendSequence: number | undefined
    protected abstract pid: number | undefined
    protected abstract payload: any | undefined

    // public abstract getters
    public abstract getDestinationCallsign(): string
    public abstract getDestinationSsid(): number
    public abstract isDestinationReservedBitOne(): boolean
    public abstract isDestinationReservedBitTwo(): boolean
    public abstract getSourceCallsign(): string
    public abstract getSourceSsid(): number
    public abstract isSourceReservedBitOne(): boolean
    public abstract isSourceReservedBitTwo(): boolean
    public abstract getCommandOrResponse(): 'command' | 'response' | 'legacy'
    public abstract isCommand(): boolean
    public abstract isResponse(): boolean
    public abstract getRepeaters(): Repeater[]
    protected abstract getModulo(): 8 | 128 | undefined
    protected abstract getReceivedSequence(): number | string | undefined // undefined on incoming frame if it doesn't have a received sequence
    public abstract isPollOrFinal(): boolean
    protected abstract getSendSequence(): number | string | undefined // undefined on incoming frame if it doesn't have a send sequence
    protected abstract getPid(): number | undefined
    protected abstract getPayload(): any
    public abstract getEncoded(): number[]

    protected setModulo(modulo: 8 | 128): this {

        this.modulo = modulo
        return this
    }
    
    // remaining setters only in outgoing

}