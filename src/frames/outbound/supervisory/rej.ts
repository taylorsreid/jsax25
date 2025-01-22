import { SupervisoryAbstract, type SFrameConstructor } from "./supervisoryabstract.js";

export class REJFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'REJ')
    }
}