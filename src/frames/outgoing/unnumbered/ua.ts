import { OutgoingFrame, type OutgoingConstructor } from "../outgoing.js";

export class UAFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'UA')
    }
}