import type { hasPayload, mutableCommandOrResponse } from "../../../misc.js";
import { OutgoingFrame, type OutgoingConstructor } from "../outgoing.js";

export interface TestFrameConstructor extends OutgoingConstructor {
    commandOrResponse?: 'command' | 'response'
    payload?: any
}

export class TESTFrame extends OutgoingFrame implements hasPayload, mutableCommandOrResponse {

    constructor(args: TestFrameConstructor) {
        super(args, 'TEST')
    }

    public override get commandOrResponse(): 'command' | 'response' {
        return super.commandOrResponse
    }
    public override set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }
    
    public override get payload(): any {
        return super.payload
    }
    public override set payload(payload: any) {
        super.payload = payload
    }
    
}