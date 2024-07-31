import { OutgoingAbstract, type OutgoingConstructor } from "../outgoingabstract.js";

export class UAFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'UA')
    }
}