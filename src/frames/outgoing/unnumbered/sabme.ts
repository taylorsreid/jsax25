import type { OutgoingConstructor } from "../../../types"
import { OutgoingAbstract } from "../outgoingabstract"

export class SABMEFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABME')
    }
}