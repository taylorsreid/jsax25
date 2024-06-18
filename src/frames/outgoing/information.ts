import type { IFrameConstructor, hasModulo, hasPayload, hasPid, hasReceivedSequence, hasSendSequence, } from "types";
import { OutgoingAbstract } from "./outgoingabstract"

export class IFrame extends OutgoingAbstract implements hasPid, hasPayload, hasReceivedSequence, hasSendSequence, hasModulo {
    protected receivedSequence: number;
    protected sendSequence: number;

    constructor(args: IFrameConstructor) {
        super(args, 'information')
        this.setModulo(args.modulo ?? 8)
            .setSendSequence(args.sendSequence)
            .setPollOrFinal(args.pollOrFinal)
            .setReceivedSequence(args.receivedSequence)
            .setPayload(args.payload)
            .setPid(args.pid ?? 240)
    }

    public getPid(): number {
        return super.getPid()!
    }

    public setPid(pid: number): this {
        return super.setPid(pid)
    }

    public getPayload(): any {
        return super.getPayload()
    }

    public setPayload(payload: any): this {
        this.payload = payload
        return this
    }

    public getReceivedSequence(): number {
        return super.getReceivedSequence()
    }

    public getSendSequence(): number {
        return super.getReceivedSequence() as number
    }

    public setReceivedSequence(receivedSequence: number): this {
        return super.setReceivedSequence(receivedSequence)
    }

    public setSendSequence(sendSequence: number): this {
        return super.setSendSequence(sendSequence)
    }

    public getModulo(): 8 | 128 {
        return super.getModulo()
    }

    public setModulo(modulo: 8 | 128): this {
        return super.setModulo(modulo)
    }

}