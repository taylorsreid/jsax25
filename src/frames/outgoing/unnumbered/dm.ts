import { OutgoingConstructor } from "types";
import { OutgoingAbstract } from "../outgoingabstract";

export class DMFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'DM')
    }
}