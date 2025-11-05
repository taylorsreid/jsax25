import { OutgoingFrame, type OutgoingConstructor } from "../outgoing";

export class SABMFrame extends OutgoingFrame {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABM')
    }
}