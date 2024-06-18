import { SFrameConstructor } from "types";
import { SupervisoryAbstract } from "./supervisoryabstract";

export class RRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RR')
        this.setReceivedSequence(args.receivedSequence)
    }
}