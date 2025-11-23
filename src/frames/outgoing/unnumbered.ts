// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { OutgoingAbstract, type OutgoingConstructor } from "./outgoingabstract";

/** Disconnect Frame */
export class DISCFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'DISC')
    }
}

/** Disconnected Mode Frame */
export class DMFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'DM')
    }
}

/** Set Asynchronous Balance Mode Extended Frame */
export class SABMEFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABME')
    }
}

/** Set Asynchronous Balance Mode Frame */
export class SABMFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'SABM')
    }
}

/** Test Frame Constructor */
export interface TESTFrameConstructor extends OutgoingConstructor {
    commandOrResponse?: 'command' | 'response'
    payload?: any
}

/** Test Frame */
export class TESTFrame extends OutgoingAbstract {

    constructor(args: TESTFrameConstructor) {
        super(args, 'TEST')
    }

    public override get commandOrResponse(): 'command' | 'response' {
        return super.commandOrResponse
    }
    public override set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }
    
    public override get payload(): any {
        return super.payload
    }
    public override set payload(payload: any) {
        super.payload = payload
    }
    
}

/** Unnumbered Acknowledge Frame */
export class UAFrame extends OutgoingAbstract {
    constructor(args: OutgoingConstructor) {
        super(args, 'UA')
    }
}

/** Unnumbered Information Frame Constructor */
export interface UIFrameConstructor extends OutgoingConstructor {
    commandOrResponse?: 'command' | 'response'
    pollOrFinal?: boolean
    pid?: number
    payload: any
}

/** Unnumbered Information Frame */
export class UIFrame extends OutgoingAbstract {
    // use this.x in the constructor
    constructor(args: UIFrameConstructor) {
        super(args, 'UI')
    }

    // use super.x in the getters and setters
    // all setters must have a getter or the property will be returned as undefined

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

    public override get pid(): number {
        return super.pid!
    }
    public override set pid(pid: number) {
        super.pid = pid
    }

    public override get payload(): any {
        return super.payload!
    }
    public override set payload(payload: any) {
        super.payload = payload
    }
    
}

/** Exchange Identification Frame Constructor */
export interface XIDFrameConstructor extends OutgoingConstructor {
    /**
     * Whether the frame is a command frame or a response frame.
     * @default 'command'
     */
    commandOrResponse?: 'command' | 'response'

    /**
     * Used in all types of frames. The P/F bit is also used in a command (poll) mode to request an immediate reply to a frame.
     * The reply to this poll is indicated by setting the response (final) bit in the appropriate frame.
     * @default false
     */
    pollOrFinal?: boolean
}

/** Exchange Identification Frame */
export class XIDFrame extends OutgoingAbstract {

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