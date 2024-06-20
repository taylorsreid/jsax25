import { SFrameConstructor } from "types";
import { SupervisoryAbstract } from "./supervisoryabstract";

export class SREJFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'SREJ', args.modulo)
        this.setReceivedSequence(args.receivedSequence)
        .setPollOrFinal(args.pollOrFinal)
        .setCommandOrResponse(args.commandOrResponse)
    }
}