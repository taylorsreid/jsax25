import { OutgoingAbstract, type OutgoingConstructor } from "../outgoingabstract.js";

export class DISCFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'DISC')
    }
}