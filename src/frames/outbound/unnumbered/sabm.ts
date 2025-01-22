import { OutgoingAbstract, type OutgoingConstructor } from "../outgoingabstract.js";

export class SABMFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABM')
    }
}