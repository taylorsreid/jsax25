import type { hasPayload, mutableCommandOrResponse } from "../../../misc.js";
import { OutgoingAbstract, type OutgoingConstructor } from "../outgoingabstract.js";

export interface TestFrameConstructor extends OutgoingConstructor {
    /**  */
    commandOrResponse?: 'command' | 'response'
    payload?: any
}

export class TESTFrame extends OutgoingAbstract implements hasPayload, mutableCommandOrResponse {

    constructor(args: TestFrameConstructor) {
        super(args, 'TEST')
    }

    public get commandOrResponse(): 'command' | 'response' {
        return super.commandOrResponse
    }
    public set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }
    
    public get payload(): any {
        return super.payload
    }
    public set payload(payload: any) {
        super.payload = payload
    }
    
}