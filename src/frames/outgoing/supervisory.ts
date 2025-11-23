// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import type { SFrameType } from "../baseabstract";
import { OutgoingAbstract, type OutgoingConstructor } from "./outgoingabstract";

/** Supervisory Frame Constructor */
export interface SFrameConstructor extends OutgoingConstructor {
    /**
     * Determines the number of outstanding information frames allowed per layer 2 connection at one time.
     * 
     * Only change this to 128 on supervisory and information frames when you are sure that you are using modulo 128, as setting it incorrectly will cause frames not to decode.
     * @default 8
     */
    modulo?: 8 | 128

    /**
     * Exists on information and supervisory frames. Otherwise undefined. Prior to sending an information or supervisory frame,
     * this variable is updated to equal that of the received state variable, thus implicitly acknowledging the proper reception of all frames
     * up to and including receivedSequence - 1.
     * 
     * Valid values are integers 0 to 7 inclusive when using modulo 8, or integers 0 to 127 inclusive when using modulo 127.
     */
    receivedSequence: number

    /**
     * Used in all types of frames. The P/F bit is also used in a command (poll) mode to request an immediate reply to a frame.
     * The reply to this poll is indicated by setting the response (final) bit in the appropriate frame.
     * @default false
     */
    pollOrFinal?: boolean

    /**
     * Whether the frame is a command frame or a response frame.
     * @default 'response'
     */
    commandOrResponse?: 'command' | 'response'
}

export abstract class SupervisoryAbstract extends OutgoingAbstract {
    constructor(args: SFrameConstructor, frameSubtype: SFrameType) {
        super(args, frameSubtype)
    }

    public override get pollOrFinal(): boolean {
        return super.pollOrFinal
    }
    public override set pollOrFinal(pollOrFinal: boolean) {
        super.pollOrFinal = pollOrFinal
    }

    public override get receivedSequence(): number {
        return super.receivedSequence!
    }
    public override set receivedSequence(receivedSequence: number) {
        super.receivedSequence = receivedSequence
    }

    public override get modulo(): 8 | 128 {
        return super.modulo
    }
    public override set modulo(modulo: 8 | 128) {
        super.modulo = modulo
    }

    public override get commandOrResponse(): "command" | "response" {
        return super.commandOrResponse
    }
    public override set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }
}

/** Reject Frame */
export class REJFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'REJ')
    }
}

/** Receive Not Ready Frame */
export class RNRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RNR')
    }
}

/** Receive Ready Frame */
export class RRFrame extends SupervisoryAbstract {
    constructor(args: SFrameConstructor) {
        super(args, 'RR')
    }
}

/** Selective Reject Frame Constructor */
export interface SREJFrameConstructor extends SFrameConstructor {
    /** In an SREJ frame, this indicates whether to acknowledge previous frames up to receivedSequence - 1, inclusive. */
    pollOrFinal: boolean
}

/** Selective Reject Frame */
export class SREJFrame extends SupervisoryAbstract {
    constructor(args: SREJFrameConstructor) {
        super(args, 'SREJ')
    }
}