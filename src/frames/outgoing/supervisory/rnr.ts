import { SupervisoryAbstract, type SFrameConstructor } from "./supervisoryabstract";

export class RNRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RNR')
    }
}