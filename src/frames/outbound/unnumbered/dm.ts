import { OutboundFrame, type OutboundConstructor } from "../outbound.js";

export class DMFrame extends OutboundFrame {
    constructor(args: OutboundConstructor) {
        super(args, 'DM')
    }
}