import type { mutableModulo, hasPayload, hasPid, hasReceivedSequence, hasSendSequence, mutablePollOrFinal, } from "../../misc.js";
import { OutgoingAbstract, type OutgoingConstructor } from "./outgoingabstract.js";

export interface IFrameConstructor extends OutgoingConstructor {
    modulo?: 8 | 128
    receivedSequence: number
    pollOrFinal?: boolean
    sendSequence: number
    pid?: number
    payload: any
}

export class IFrame extends OutgoingAbstract implements mutablePollOrFinal, hasPid, hasPayload, hasReceivedSequence, hasSendSequence, mutableModulo {

    constructor(args: IFrameConstructor) {
        super(args, 'I')
    }

    public get pollOrFinal(): boolean {
        return super.pollOrFinal
    }
    public set pollOrFinal(pollOrFinal: boolean) {
        super.pollOrFinal = pollOrFinal
    }

    public get modulo(): 8 | 128 {
        return super.modulo
    }
    public set modulo(modulo: 8 | 128) {
        super.modulo = modulo
    }

    public get receivedSequence(): number {
        return super.receivedSequence!
    }
    public set receivedSequence(receivedSequence: number) {
        super.receivedSequence = receivedSequence
    }

    public get sendSequence(): number {
        return super.sendSequence!
    }
    public set sendSequence(sendSequence: number) {
        super.sendSequence = sendSequence
    }

    public get pid(): number {
        return super.pid!
    }
    public set pid(pid: number) {
        super.pid = pid
    }

    public get payload(): any {
        return super.payload
    }
    public set payload(payload: any) {
        super.payload = payload
    }

}