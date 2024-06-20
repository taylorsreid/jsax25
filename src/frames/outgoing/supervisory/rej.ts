import { SFrameConstructor } from "types";
import { SupervisoryAbstract } from "./supervisoryabstract";

export class REJFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'REJ', args.modulo)
        this.setReceivedSequence(args.receivedSequence)
        .setPollOrFinal(args.pollOrFinal)
        .setCommandOrResponse(args.commandOrResponse)
    }
}