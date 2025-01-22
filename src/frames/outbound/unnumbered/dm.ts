import { OutgoingAbstract, type OutgoingConstructor } from "../outgoingabstract.js";

export class DMFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'DM')
    }
}