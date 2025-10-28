import { OutgoingFrame, type OutgoingConstructor } from "../outgoing.js";

export class SABMFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABM')
    }
}