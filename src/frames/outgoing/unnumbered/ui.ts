import type { hasPayload, hasPid, mutableCommandOrResponse, mutablePollOrFinal } from "../../../misc.js";
import { OutgoingFrame, type OutgoingConstructor } from "../outgoing.js";

export interface UIFrameConstructor extends OutgoingConstructor {
    commandOrResponse?: 'command' | 'response'
    pollOrFinal?: boolean
    pid?: number
    payload: any
}

export class UIFrame extends OutgoingFrame implements mutableCommandOrResponse, mutablePollOrFinal, hasPid, hasPayload {
    // use this.x in the constructor
    constructor(args: UIFrameConstructor) {
        super(args, 'UI')
    }

    // use super.x in the getters and setters
    // all setters must have a getter or the property will be returned as undefined

    public override get commandOrResponse(): 'command' | 'response' {
        return super.commandOrResponse
    }
    public override set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }

    public override get pollOrFinal(): boolean {
        return super.pollOrFinal
    }
    public override set pollOrFinal(pollOrFinal: boolean) {
        super.pollOrFinal = pollOrFinal
    }

    public override get pid(): number {
        return super.pid!
    }
    public override set pid(pid: number) {
        super.pid = pid
    }

    public override get payload(): any {
        return super.payload!
    }
    public override set payload(payload: any) {
        super.payload = payload
    }
    
}