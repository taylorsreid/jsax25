import { OutgoingAbstract } from "../outgoingabstract";
import { OutgoingConstructor, mutableCommandOrResponse } from "types";


export class XIDFrame extends OutgoingAbstract implements mutableCommandOrResponse {

    constructor(args: OutgoingConstructor) {
        super(args, 'XID')
        this.setPayload([
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
        ])
    }

    public setCommandOrResponse(commandOrResponse: "command" | "response"): this {
        return super.setCommandOrResponse(commandOrResponse)
    }

    public getPayload() {
        return super.getPayload()
    }

}