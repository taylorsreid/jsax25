import { OutgoingFrame, type OutgoingConstructor } from "../outgoing.js";

export class DMFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'DM')
    }
}