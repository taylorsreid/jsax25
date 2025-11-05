import { SupervisoryAbstract, type SFrameConstructor } from "./supervisoryabstract";

export class REJFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'REJ')
    }
}