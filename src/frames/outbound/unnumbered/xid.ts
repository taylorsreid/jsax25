import type { mutableCommandOrResponse, mutablePollOrFinal } from "../../../misc.js";
import { OutboundFrame, type OutboundConstructor } from "../outbound.js";

export interface XIDFrameConstructor extends OutboundConstructor {
    commandOrResponse?: 'command' | 'response'
    pollOrFinal?: boolean
}

export class XIDFrame extends OutboundFrame implements mutableCommandOrResponse, mutablePollOrFinal {

    constructor(args: XIDFrameConstructor) {
        super(args, 'XID')
    }

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

}