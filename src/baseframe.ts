import { CacheManager } from "./cachemanager"
import { KissConnection } from "./kissconnection"
import { IFrameType, type CommandResponse, type InternalFrameType, type Repeater, type SFrameType, type UFrameType } from "./types"

export abstract class BaseFrame {
    protected destinationCallsign: string | undefined
    protected destinationSsid: number // default 0
    protected destinationCommandBit: boolean // not directly modified or set by setter, instead setCommandResponse() toggles this boolean/bit appropriately
    protected destinationReservedBitOne: boolean // currently unused
    protected destinationReservedBitTwo: boolean // currently unused
    protected sourceCallsign: string
    protected sourceSsid: number // default 0
    protected sourceCommandBit: boolean // not directly modified or set by setter, instead setCommandResponse() toggles this boolean/bit appropriately
    protected sourceSupportsCompression: boolean // used for supportsCompression, default false
    protected payloadIsCompressed: boolean // used for isCompressed, default false
    protected repeaters: Repeater[] // default empty array
    protected payload: any | undefined // default undefined
    protected internalFrameType: InternalFrameType | undefined // default unnumbered
    protected frameType: UFrameType | SFrameType | IFrameType | undefined // default UI
    protected sendSequence: number | undefined // default undefined
    protected pollOrFinal: boolean // default true
    protected receivedSequence: number | undefined // default undefined
    protected pid: number | undefined
    protected kissConnection: KissConnection
    protected cacheManager: CacheManager = new CacheManager() // no need constructor, it should always equal this

    // getters
    abstract getEncoded(): number[]
    abstract getDestinationCallsign(): string | undefined
    abstract getDestinationSsid(): number
    abstract getDestinationCommandBit(): boolean
    abstract getDestinationReservedBitOne(): boolean
    abstract getDestinationReservedBitTwo(): boolean
    abstract getSourceCallsign(): string | undefined
    abstract getSourceSsid(): number
    abstract getSourceCommandBit(): boolean 
    abstract isSourceAcceptingCompression(): boolean // aka source reserved bit one
    abstract isPayloadCompressed(): boolean // aka source reserved bit two
    abstract hasRepeaters(): boolean
    abstract getRepeaters(): Repeater[]
    abstract getFrameType(): UFrameType | SFrameType | IFrameType | undefined
    abstract getReceivedSequence(): number | undefined
    abstract isPollOrFinal(): boolean
    abstract getSendSequence(): number | undefined
    abstract getPid(): number | undefined
    abstract getPayload(): any

    /**
     * Get whether the command is a command frame or a response frame if it is using the latest version of the AX.25 protocol. If not, then it is using the legacy protocol.
     * @returns string 'command', 'response', or 'legacy'
     */
    public getCommandResponse(): CommandResponse { // property is ephemeral and computed
        // 1 and 0 respectively indicates a command frame
        if (this.getDestinationCommandBit() && !this.getSourceCommandBit()) {
            return 'command'
        }
        // 0 and 1 respectively indicates a response frame
        else if (!this.getDestinationCommandBit() && this.getSourceCommandBit()) {
            return 'response'
        }
        // 00 or 11 are used by older versions of the protocol
        else {
            return 'legacy'
        }
    }

    public hasReceivedSequence(): boolean {
        // calling getFrameType() first ensures that internalFrameType is not undefined in IncomingFrame
        return this.getFrameType() === 'information' || this.internalFrameType === 'supervisory'
    }

    public hasSendSequence(): boolean {
        return this.getFrameType() === 'information'
    }

    public hasPid(): boolean {
        return this.getFrameType() === 'information' || this.getFrameType() === 'UI' // computed value, not stored
    }

    public getKissConnection(): KissConnection {
        return this.kissConnection
    }    

    // setters are only in sendframe

    public toJSON() {
        return {
            destinationCallsign: this.getDestinationCallsign(),
            destinationSsid: this.getDestinationSsid(),
            isDestinationCommandBitOn: this.getDestinationCommandBit(),
            isDestinationReservedBitOneOn: this.getDestinationReservedBitOne(),
            isDestinationReservedBitTwoOn: this.getDestinationReservedBitTwo(),
            sourceCallsign: this.getSourceCallsign(),
            sourceSsid: this.getSourceSsid(),
            sourceCommandBit: this.getSourceCommandBit(),
            sourceAcceptsCompression: this.isSourceAcceptingCompression(),
            payloadIsCompressed: this.isPayloadCompressed(),
            commandResponse: this.getCommandResponse(),
            hasRepeaters: this.hasRepeaters(),
            repeaters: this.getRepeaters(),
            frameType: this.getFrameType(),
            hasReceivedSequence: this.hasReceivedSequence(),
            receivedSequence: this.getReceivedSequence(),
            isPollOrFinal: this.isPollOrFinal(),
            hasSendSequence: this.hasSendSequence(),
            sendSequence: this.getSendSequence(),
            // hasPid: this.hasPid(),
            pid: this.getPid(),
            payload: this.getPayload()
        }
    }

}