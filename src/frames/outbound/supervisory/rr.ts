import { SupervisoryAbstract, type SFrameConstructor } from "./supervisoryabstract.js";

export class RRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RR')
    }
}