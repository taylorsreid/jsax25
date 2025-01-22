import type { hasPayload, hasPid, mutableCommandOrResponse, mutablePollOrFinal } from "../../../misc.js";
import { OutboundFrame, type OutboundConstructor } from "../outbound.js";

export interface UIFrameConstructor extends OutboundConstructor {
    commandOrResponse?: 'command' | 'response'
    pollOrFinal?: boolean
    pid?: number
    payload: string
}

export class UIFrame extends OutboundFrame implements mutableCommandOrResponse, mutablePollOrFinal, hasPid, hasPayload {
    // use this.x in the constructor
    constructor(args: UIFrameConstructor) {
        super(args, 'UI')
    }

    // use super.x in the getters and setters
    // all setters must have a getter or the property will be returned as undefined

    public get commandOrResponse(): 'command' | 'response' {
        return super.commandOrResponse
    }
    public set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }

    public get pollOrFinal(): boolean {
        return super.pollOrFinal
    }
    public set pollOrFinal(pollOrFinal: boolean) {
        super.pollOrFinal = pollOrFinal
    }

    public get pid(): number {
        return super.pid!
    }
    public set pid(pid: number) {
        super.pid = pid
    }

    public get payload(): string {
        return super.payload!
    }
    public set payload(payload: string) {
        super.payload = payload
    }
    
}