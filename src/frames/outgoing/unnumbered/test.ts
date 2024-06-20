import type { TestFrameConstructor, hasPayload, mutableCommandOrResponse } from "types";
import { OutgoingAbstract } from "../outgoingabstract";

export class TESTFrame extends OutgoingAbstract implements hasPayload, mutableCommandOrResponse {

    constructor(args: TestFrameConstructor) {
        super(args, 'TEST', 8)
        this.setPayload(args.payload)
    }
    
    public getPayload(): any {
        return super.getPayload()
    }
    public setPayload(payload: any): this {
        return super.setPayload(payload)
    }

    public setCommandOrResponse(commandOrResponse: "command" | "response"): this {
        return super.setCommandOrResponse(commandOrResponse)
    }
    
}