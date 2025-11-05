import { OutgoingFrame, type OutgoingConstructor } from "../outgoing";

export class DMFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'DM')
    }
}