import type { mutableCommandOrResponse, mutablePollOrFinal } from "../../../misc";
import { OutgoingFrame, type OutgoingConstructor } from "../outgoing";

export interface XIDFrameConstructor extends OutgoingConstructor {
    commandOrResponse?: 'command' | 'response'
    pollOrFinal?: boolean
}

export class XIDFrame extends OutgoingFrame implements mutableCommandOrResponse, mutablePollOrFinal {

    constructor(args: XIDFrameConstructor) {
        super(args, 'XID')
    }

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

}