import { OutgoingFrame, type OutgoingConstructor } from "../outgoing.js";

export class SABMEFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABME')
    }
}