import { OutgoingFrame, type OutgoingConstructor } from "../outgoing";

export class SABMEFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABME')
    }
}