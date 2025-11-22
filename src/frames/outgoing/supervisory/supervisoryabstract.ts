// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import type { SFrameType } from "../../baseabstract";
import { OutgoingFrame, type OutgoingConstructor } from "../outgoing";

export interface SFrameConstructor extends OutgoingConstructor {
    modulo?: 8 | 128
    receivedSequence: number
    pollOrFinal?: boolean
    commandOrResponse?: 'command' | 'response'
}

export abstract class SupervisoryAbstract extends OutgoingFrame {

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