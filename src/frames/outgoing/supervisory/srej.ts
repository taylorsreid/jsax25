import { SupervisoryAbstract, type SFrameConstructor } from "./supervisoryabstract.js";

export interface SREJFrameConstructor extends SFrameConstructor {
    /** In an SREJ frame, this indicates whether to acknowledge previous frames up to N(R) - 1 inclusive. */
    pollOrFinal: boolean
}

export class SREJFrame extends SupervisoryAbstract {
    constructor(args: SREJFrameConstructor) {
        super(args, 'SREJ')
    }
}