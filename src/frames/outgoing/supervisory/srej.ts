import { SFrameConstructor } from "types";
import { SupervisoryAbstract } from "./supervisoryabstract";

export class SREJFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'SREJ')
        this.setReceivedSequence(args.receivedSequence)
    }
}