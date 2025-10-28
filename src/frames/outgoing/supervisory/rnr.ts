import { SupervisoryAbstract, type SFrameConstructor } from "./supervisoryabstract.js";

export class RNRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RNR')
    }
}