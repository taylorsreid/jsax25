import { hasModulo, hasReceivedSequence } from "types";
import { OutgoingAbstract } from "../outgoingabstract";

export abstract class SupervisoryAbstract extends OutgoingAbstract implements hasReceivedSequence, hasModulo {

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
    
}