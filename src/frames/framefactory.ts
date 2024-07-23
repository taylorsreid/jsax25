import { IFrameConstructor, OutgoingConstructor, Repeater, SFrameConstructor, TestFrameConstructor, UIFrameConstructor, XIDFrameConstructor } from "types";
import { DISCFrame, DMFrame, IFrame, KissConnection, REJFrame, RNRFrame, RRFrame, SABMEFrame, SABMFrame, SREJFrame, TESTFrame, UAFrame, UIFrame, XIDFrame } from "../index";

export class FrameFactory {

    private baseConstructor: OutgoingConstructor

    constructor(args: OutgoingConstructor) {

        if (args.destinationCallsign.length < 1 || args.destinationCallsign.length > 6) {
            throw new Error(`'${args.destinationSsid}' is not a valid destination callsign. Callsigns must have a length from 1 to 6 characters inclusive.`)
        }
        if (args.sourceCallsign.length < 1 || args.sourceCallsign.length > 6) {
            throw new Error(`'${args.sourceCallsign}' is not a valid source callsign. Callsigns must have a length from 1 to 6 characters inclusive.`)
        }
        if (args.destinationSsid && (args.destinationSsid < 0 || args.destinationSsid > 15)) {
            throw new Error(`${args.destinationSsid} is not a valid destination SSID. SSIDs must be between 0 and 15 inclusive.`)
        }
        if (args.sourceSsid && (args.sourceSsid < 0 || args.sourceSsid > 15)) {
            throw new Error(`${args.sourceSsid} is not a valid source SSID. SSIDs must be between 0 and 15 inclusive.`)
        }

        this.baseConstructor = args

    }

    public getKissConnection(): KissConnection {
        return this.baseConstructor.kissConnection
    }
    public getDestinationCallsign(): string {
        return this.baseConstructor.destinationCallsign
    }
    public getDestinationSsid(): number {
        return this.baseConstructor.destinationSsid ?? 0
    }
    public getSourceCallsign(): string {
        return this.baseConstructor.sourceCallsign
    }
    public getSourceSsid(): number {
        return this.baseConstructor.sourceSsid ?? 0
    }
    public getRepeaters(): Repeater[] {
        return this.baseConstructor.repeaters ?? []
    }

    public rej(receivedSequence: number, commandOrResponse: 'command' | 'response', requestRemoteStatus: boolean = false, modulo: 8 | 128 = 8): REJFrame {
        const c: SFrameConstructor = this.baseConstructor as SFrameConstructor
        c.receivedSequence = receivedSequence
        c.commandOrResponse = commandOrResponse
        c.pollOrFinal = requestRemoteStatus
        c.modulo = modulo
        return new REJFrame(c)
    }

    public rnr(receivedSequence: number, commandOrResponse: 'command' | 'response', requestRemoteStatus: boolean = false, modulo: 8 | 128 = 8): RNRFrame {
        const c: SFrameConstructor = this.baseConstructor as SFrameConstructor
        c.receivedSequence = receivedSequence
        c.commandOrResponse = commandOrResponse
        c.pollOrFinal = requestRemoteStatus
        c.modulo = modulo
        return new RNRFrame(c)
    }

    public rr(receivedSequence: number, commandOrResponse: 'command' | 'response', requestRemoteStatus: boolean = false, modulo: 8 | 128 = 8): RRFrame {
        const c: SFrameConstructor = this.baseConstructor as SFrameConstructor
        c.receivedSequence = receivedSequence
        c.commandOrResponse = commandOrResponse
        c.pollOrFinal = requestRemoteStatus
        c.modulo = modulo
        return new RRFrame(c)
    }

    public srej(receivedSequence: number, commandOrResponse: 'command' | 'response', acknowledgePrevious: boolean = true, modulo: 8 | 128 = 8): SREJFrame {
        const c: SFrameConstructor = this.baseConstructor as SFrameConstructor
        c.receivedSequence = receivedSequence
        c.commandOrResponse = commandOrResponse
        c.pollOrFinal = acknowledgePrevious
        c.modulo = modulo
        return new SREJFrame(c)
    }

    public disc(): DISCFrame {
        return new DISCFrame(this.baseConstructor)
    }

    public dm(): DMFrame {
        return new DMFrame(this.baseConstructor)
    }

    public sabm(): SABMFrame {
        return new SABMFrame(this.baseConstructor)
    }

    public sabme(): SABMEFrame {
        return new SABMEFrame(this.baseConstructor)
    }

    public test(payload?: any, commandOrResponse: 'command' | 'response' = 'response'): TESTFrame {
        const c: TestFrameConstructor = this.baseConstructor as TestFrameConstructor
        c.payload = payload
        c.commandOrResponse = commandOrResponse
        return new TESTFrame(c)
    }

    public ua(): UAFrame {
        return new UAFrame(this.baseConstructor)
    }

    /**
     * 
     * @param payload 
     * @param pid 
     * @param commandOrResponse 
     * @param pollOrFinal 
     * @returns 
     */
    public ui(payload?: any, pid: number = 240, commandOrResponse: 'command' | 'response' = 'response', pollOrFinal: boolean = false,): UIFrame {
        const c: UIFrameConstructor = this.baseConstructor as UIFrameConstructor
        c.payload = payload
        c.pid = pid
        c.commandOrResponse = commandOrResponse
        c.pollOrFinal = pollOrFinal
        return new UIFrame(c)
    }

    public xid(commandOrResponse: 'command' | 'response' = 'command'): XIDFrame {
        const c: XIDFrameConstructor = this.baseConstructor as XIDFrameConstructor
        c.commandOrResponse = commandOrResponse
        return new XIDFrame(c)
    }

    public info(payload: any, receivedSequence: number, pollOrFinal: boolean, sendSequence: number, modulo: 8 | 128 = 8, pid: number = 240): IFrame {
        const c: IFrameConstructor = this.baseConstructor as IFrameConstructor
        c.payload = payload
        c.receivedSequence = receivedSequence
        c.pollOrFinal = pollOrFinal
        c.sendSequence = sendSequence
        c.modulo = modulo
        c.pid = pid
        return new IFrame(c)
    }

}