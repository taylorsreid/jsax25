import { OutgoingConstructor } from "types";
import { OutgoingAbstract } from "../outgoingabstract";

export class UAFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'UA', 8)
    }
}