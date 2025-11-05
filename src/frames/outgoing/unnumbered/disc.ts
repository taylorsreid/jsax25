import { OutgoingFrame, type OutgoingConstructor } from "../outgoing";

export class DISCFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'DISC')
    }
}