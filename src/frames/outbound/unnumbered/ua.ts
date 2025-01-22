import { OutboundFrame, type OutboundConstructor } from "../outbound.js";

export class UAFrame extends OutboundFrame {
    constructor(args: OutboundConstructor) {
        super(args, 'UA')
    }
}