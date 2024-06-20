import { OutgoingConstructor } from "types";
import { OutgoingAbstract } from "../outgoingabstract";

export class DISCFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'DISC', 8)
    }
}