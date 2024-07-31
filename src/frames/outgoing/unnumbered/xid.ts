import type { mutableCommandOrResponse } from "../../../misc.js";
import { OutgoingAbstract, type OutgoingConstructor } from "../outgoingabstract.js";

export interface XIDFrameConstructor extends OutgoingConstructor {
    commandOrResponse?: 'command' | 'response'
    pollOrFinal?: boolean
}

export class XIDFrame extends OutgoingAbstract implements mutableCommandOrResponse {

    constructor(args: XIDFrameConstructor) {
        super(args, 'XID')
        this.payload = [
            132, // see AX.25 documentation 4.3.3.7 Exchange Identification (XID) Frame, 132 evaluates to half duplex only
            0, // all bits reserved by documentation but never implemented
            97, // supports rejc and srej
            53, // supports modulo 8 and modulo 128
            64, // required by spec, not mutable
            2048, // max I fields length tx 2048 bits === 256 bytes
            2048, // max I fields length rx, ''
            32, // max window size frames tx
            32, // max window size frames rx
            3000, // default acknowledge timer
            10 // default retries is 10

            // TODO: fix this? don't have any nearby digis that actually support this it seems like
        ]
    }

    public get commandOrResponse(): 'command' | 'response' {
        return super.commandOrResponse
    }
    public set commandOrResponse(commandOrResponse: "command" | "response") {
        super.commandOrResponse = commandOrResponse
    }

    // readonly on this frame type
    public get payload(): any {
        return super.payload
    }
    private set payload(payload: any) {
        super.payload = payload
    }

}