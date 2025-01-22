import { OutboundFrame, type OutboundConstructor } from "../outbound.js";

export class DISCFrame extends OutboundFrame {
    constructor(args: OutboundConstructor) {
        super(args, 'DISC')
    }
}