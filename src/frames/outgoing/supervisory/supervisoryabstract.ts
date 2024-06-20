import { hasModulo, hasReceivedSequence, mutableCommandOrResponse } from "types";
import { OutgoingAbstract } from "../outgoingabstract";

export abstract class SupervisoryAbstract extends OutgoingAbstract implements hasReceivedSequence, hasModulo, mutableCommandOrResponse {

    public getReceivedSequence(): number {
        return super.getReceivedSequence()
    }
    public setReceivedSequence(receivedSequence: number): this {
        return super.setReceivedSequence(receivedSequence)
    }

    public getModulo(): 8 | 128 {
        return super.getModulo()
    }
    public setModulo(modulo: 8 | 128): this {
        return super.setModulo(modulo)
    }

    public getCommandOrResponse(): "command" | "response" {
        return super.getCommandOrResponse()
    }
    public setCommandOrResponse(commandOrResponse: "command" | "response"): this {
        return super.setCommandOrResponse(commandOrResponse)
    }
    
}