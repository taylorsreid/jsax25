import type { OutgoingConstructor } from "../../../types"
import { OutgoingAbstract } from "../outgoingabstract"

export class SABMFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABM')
    }
}