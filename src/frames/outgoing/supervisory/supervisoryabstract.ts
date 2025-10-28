import type { hasReceivedSequence, mutableCommandOrResponse, mutableModulo, mutablePollOrFinal } from "../../../misc.js";
import type { SFrameType } from "../../baseabstract.js";
import { OutgoingFrame, type OutgoingConstructor } from "../outgoing.js";

export interface SFrameConstructor extends OutgoingConstructor {
    modulo?: 8 | 128
    receivedSequence: number
    pollOrFinal?: boolean
    commandOrResponse?: 'command' | 'response'
}

export abstract class SupervisoryAbstract extends OutgoingFrame implements mutablePollOrFinal, hasReceivedSequence, mutableModulo, mutableCommandOrResponse {

    constructor(args: SFrameConstructor, frameSubtype: SFrameType) {
        super(args, frameSubtype)
    }

    public override get pollOrFinal(): boolean {
        return super.pollOrFinal
    }
    public override set pollOrFinal(pollOrFinal: boolean) {
        super.pollOrFinal = pollOrFinal
    }

    public override get receivedSequence(): number {
        return super.receivedSequence!
    }
    public override set receivedSequence(receivedSequence: number) {
        super.receivedSequence = receivedSequence
    }

    public override get modulo(): 8 | 128 {
        return super.modulo
    }
    public override set modulo(modulo: 8 | 128) {
        super.modulo = modulo
    }

    public override get commandOrResponse(): "command" | "response" {
        return super.commandOrResponse
    }
    public override set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }
    
}