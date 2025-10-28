import type { hasPayload, hasPid, hasReceivedSequence, hasSendSequence, mutableModulo, mutablePollOrFinal, } from "../../misc.js";
import { OutgoingFrame, type OutgoingConstructor } from "./outgoing.js";

export interface IFrameConstructor extends OutgoingConstructor {
    modulo?: 8 | 128
    receivedSequence: number
    pollOrFinal?: boolean
    sendSequence: number
    pid?: number
    payload: any
}

export class IFrame extends OutgoingFrame implements mutablePollOrFinal, hasPid, hasPayload, hasReceivedSequence, hasSendSequence, mutableModulo {

    constructor(args: IFrameConstructor) {
        super(args, 'I')
    }

    public override get pollOrFinal(): boolean {
        return super.pollOrFinal
    }
    public override set pollOrFinal(pollOrFinal: boolean) {
        super.pollOrFinal = pollOrFinal
    }

    public override get modulo(): 8 | 128 {
        return super.modulo
    }
    public override set modulo(modulo: 8 | 128) {
        super.modulo = modulo
    }

    public override get receivedSequence(): number {
        return super.receivedSequence!
    }
    public override set receivedSequence(receivedSequence: number) {
        super.receivedSequence = receivedSequence
    }

    public override get sendSequence(): number {
        return super.sendSequence!
    }
    public override set sendSequence(sendSequence: number) {
        super.sendSequence = sendSequence
    }

    public override get pid(): number {
        return super.pid!
    }
    public override set pid(pid: number) {
        super.pid = pid
    }

    public override get payload(): any {
        return super.payload
    }
    public override set payload(payload: any) {
        super.payload = payload
    }

}