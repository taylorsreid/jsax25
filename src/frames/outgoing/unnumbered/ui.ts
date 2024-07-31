import type { hasPayload, hasPid, mutableCommandOrResponse, mutablePollOrFinal } from "../../../misc.js";
import { OutgoingAbstract, type OutgoingConstructor } from "../outgoingabstract.js";

export interface UIFrameConstructor extends OutgoingConstructor {
    commandOrResponse?: 'command' | 'response'
    pollOrFinal?: boolean
    pid?: number
    payload: any
}

export class UIFrame extends OutgoingAbstract implements mutableCommandOrResponse, mutablePollOrFinal, hasPid, hasPayload {
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

    public get payload(): any {
        return super.payload
    }
    public set payload(payload: any) {
        super.payload = payload
    }
    
}