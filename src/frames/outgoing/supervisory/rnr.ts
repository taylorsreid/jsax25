import { SFrameConstructor } from "types";
import { SupervisoryAbstract } from "./supervisoryabstract";

export class RNRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RNR', args.modulo)
        this.setReceivedSequence(args.receivedSequence)
        .setPollOrFinal(args.pollOrFinal)
        .setCommandOrResponse(args.commandOrResponse)
    }
}