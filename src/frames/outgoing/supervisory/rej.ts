import { SFrameConstructor } from "types";
import { SupervisoryAbstract } from "./supervisoryabstract";

export class REJFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'REJ')
        this.setReceivedSequence(args.receivedSequence)
    }
}