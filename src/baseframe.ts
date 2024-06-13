import { CacheManager } from "./cachemanager"
import { KissConnection } from "./kissconnection"
import type { IFrameType, CommandResponse, InternalFrameType, Repeater, SFrameType, UFrameType } from "./types"

export abstract class BaseFrame {
    protected destinationCallsign: string
    protected destinationSsid: number // default 0
    protected destinationCommandBit: boolean // not directly modified or set by setter, instead setCommandResponse() toggles this boolean/bit appropriately
    protected destinationReservedBitOne: boolean // currently unused
    protected destinationReservedBitTwo: boolean // currently unused
    protected sourceCallsign: string
    protected sourceSsid: number // default 0
    protected sourceCommandBit: boolean // not directly modified or set by setter, instead setCommandResponse() toggles this boolean/bit appropriately
    protected compressionEnabled: boolean // used for supportsCompression, default false
    protected payloadCompressed: boolean // used for isCompressed, default false
    protected repeaters: Repeater[] // default empty array
    protected payload: any | undefined // default undefined
    protected internalFrameType: InternalFrameType // default unnumbered
    protected frameType: UFrameType | SFrameType | IFrameType // default UI
    protected sendSequence: number | undefined // default undefined
    protected pollOrFinal: boolean // default true
    protected receivedSequence: number | undefined // default undefined
    protected pid: number | undefined
    protected kissConnection: KissConnection
    protected cacheManager: CacheManager = new CacheManager() // no need constructor, it should always equal this

    // getters
    public abstract getEncoded(): number[]
    public abstract getDestinationCallsign(): string | undefined
    public abstract getDestinationSsid(): number
    protected abstract isDestinationCommandBit(): boolean
    protected abstract isDestinationReservedBitOne(): boolean // reserved by this library for future use
    protected abstract isDestinationReservedBitTwo(): boolean // reserved by this library for future use
    public abstract getSourceCallsign(): string | undefined
    public abstract getSourceSsid(): number
    protected abstract isSourceCommandBit(): boolean 
    public abstract isCompressionEnabled(): boolean // aka source reserved bit one
    public abstract isPayloadCompressed(): boolean // aka source reserved bit two
    public abstract getRepeaters(): Repeater[]
    public abstract getFrameType(): UFrameType | SFrameType | IFrameType | undefined
    public abstract getReceivedSequence(): number | undefined
    public abstract isPollOrFinal(): boolean
    public abstract getSendSequence(): number | undefined
    public abstract getPid(): number | undefined
    public abstract getPayload(): any
    protected abstract getInternalFrameType(): InternalFrameType

    /**
     * Get whether the command is a command frame or a response frame if it is using the latest version of the AX.25 protocol. If not, then it is using the legacy protocol.
     * @returns string 'command', 'response', or 'legacy'
     */
    public getCommandResponse(): CommandResponse { // property is ephemeral and computed
        // 1 and 0 respectively indicates a command frame
        if (this.isDestinationCommandBit() && !this.isSourceCommandBit()) {
            return 'command'
        }
        // 0 and 1 respectively indicates a response frame
        else if (!this.isDestinationCommandBit() && this.isSourceCommandBit()) {
            return 'response'
        }
        // 00 or 11 are used by older versions of the protocol
        else {
            return 'legacy'
        }
    }

    protected requiresReceivedSequence(): boolean {
        // calling getFrameType() first ensures that internalFrameType is not undefined in IncomingFrame
        return this.getFrameType() === 'information' || this.internalFrameType === 'supervisory'
    }

    protected requiresSendSequence(): boolean {
        return this.getFrameType() === 'information'
    }

    protected getKissConnection(): KissConnection {
        return this.kissConnection
    }    

    // setters are only in sendframe

    public toJSON() {
        return {
            destinationCallsign: this.getDestinationCallsign(),
            destinationSsid: this.getDestinationSsid(),
            sourceCallsign: this.getSourceCallsign(),
            sourceSsid: this.getSourceSsid(),
            compressionEnabled: this.isCompressionEnabled(),
            payloadCompressed: this.isPayloadCompressed(),
            commandResponse: this.getCommandResponse(),
            repeaters: this.getRepeaters(),
            frameType: this.getFrameType(),
            receivedSequence: this.getReceivedSequence(),
            pollOrFinal: this.isPollOrFinal(),
            sendSequence: this.getSendSequence(),
            pid: this.getPid(),
            payload: this.getPayload()
        }
    }

}