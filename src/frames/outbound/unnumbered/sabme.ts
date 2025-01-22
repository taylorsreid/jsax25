import { OutboundFrame, type OutboundConstructor } from "../outbound.js";

export class SABMEFrame extends OutboundFrame {
    constructor(args: OutboundConstructor) {
        super(args, 'SABME')
    }
}