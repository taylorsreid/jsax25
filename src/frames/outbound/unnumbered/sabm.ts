import { OutboundFrame, type OutboundConstructor } from "../outbound.js";

export class SABMFrame extends OutboundFrame {
    constructor(args: OutboundConstructor) {
        super(args, 'SABM')
    }
}