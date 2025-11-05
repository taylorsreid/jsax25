import { SupervisoryAbstract, type SFrameConstructor } from "./supervisoryabstract";

export class RRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RR')
    }
}