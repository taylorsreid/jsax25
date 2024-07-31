import { OutgoingAbstract, type OutgoingConstructor } from "../outgoingabstract.js";

export class SABMEFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABME')
    }
}