// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import type { mutableCommandOrResponse, mutablePollOrFinal } from "../../../misc";
import { OutgoingFrame, type OutgoingConstructor } from "../outgoing";

export interface XIDFrameConstructor extends OutgoingConstructor {
    commandOrResponse?: 'command' | 'response'
    pollOrFinal?: boolean
}

export class XIDFrame extends OutgoingFrame implements mutableCommandOrResponse, mutablePollOrFinal {

    constructor(args: XIDFrameConstructor) {
        super(args, 'XID')
    }

    public override get commandOrResponse(): 'command' | 'response' {
        return super.commandOrResponse
    }
    public override set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }

    public override get pollOrFinal(): boolean {
        return super.pollOrFinal
    }
    public override set pollOrFinal(pollOrFinal: boolean) {
        super.pollOrFinal = pollOrFinal
    }

}