import { OutgoingFrame, type OutgoingConstructor } from "../outgoing.js";

export class DISCFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'DISC')
    }
}