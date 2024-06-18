import { SFrameConstructor } from "types";
import { SupervisoryAbstract } from "./supervisoryabstract";

export class RNRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RNR')
        this.setReceivedSequence(args.receivedSequence)
    }
}