import { UIFrameConstructor, hasPayload, hasPid, mutableCommandOrResponse } from "types";
import { OutgoingAbstract } from "../outgoingabstract";

export class UIFrame extends OutgoingAbstract implements mutableCommandOrResponse, hasPid, hasPayload {
    // use this.x in the constructor
    constructor(args: UIFrameConstructor) {
        super(args, 'UI', 8)
        this.setCommandOrResponse(args.commandOrResponse)
        .setPollOrFinal(args.pollOrFinal)
        .setPayload(args.payload)
        .setPid(args.pid)
    }

    // use super.x in the getters and setters

    public setCommandOrResponse(commandOrResponse: "command" | "response"): this {
        return super.setCommandOrResponse(commandOrResponse)
    }

    public getPid(): number {
        return super.getPid()!
    }
    public setPid(pid: number): this {
        return super.setPid(pid)
    }

    public getPayload(): any {
        return super.getPayload()
    }
    public setPayload(payload: any): this {
        return super.setPayload(payload)
    }
    
}