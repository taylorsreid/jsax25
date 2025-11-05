import { OutgoingFrame, type OutgoingConstructor } from "../outgoing";

export class UAFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'UA')
    }
}