import type { hasReceivedSequence, mutableCommandOrResponse, mutableModulo, mutablePollOrFinal } from "../../../misc.js";
import type { IFrameType, SFrameType, UFrameType } from "../../baseabstract.js";
import { OutboundFrame, type OutboundConstructor } from "../outbound.js";

export interface SFrameConstructor extends OutboundConstructor {
    modulo?: 8 | 128
    receivedSequence: number
    pollOrFinal?: boolean
    commandOrResponse?: 'command' | 'response'
}

export abstract class SupervisoryAbstract extends OutboundFrame implements mutablePollOrFinal, hasReceivedSequence, mutableModulo, mutableCommandOrResponse {

    constructor(args: SFrameConstructor, frameSubtype: IFrameType | UFrameType | SFrameType) {
        super(args, frameSubtype)
    }

    public get pollOrFinal(): boolean {
        return super.pollOrFinal
    }
    public set pollOrFinal(pollOrFinal: boolean) {
        super.pollOrFinal = pollOrFinal
    }

    public get receivedSequence(): number {
        return super.receivedSequence!
    }
    public set receivedSequence(receivedSequence: number) {
        super.receivedSequence = receivedSequence
    }

    public get modulo(): 8 | 128 {
        return super.modulo
    }
    public set modulo(modulo: 8 | 128) {
        super.modulo = modulo
    }

    public get commandOrResponse(): "command" | "response" {
        return super.commandOrResponse
    }
    public set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }
    
}