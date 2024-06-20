import { SFrameConstructor } from "types";
import { SupervisoryAbstract } from "./supervisoryabstract";

export class RRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RR', args.modulo)
        this.setReceivedSequence(args.receivedSequence)
        .setPollOrFinal(args.pollOrFinal)
        .setCommandOrResponse(args.commandOrResponse)
    }
}