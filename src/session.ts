import { DISCFrame, FrameFactory, IFrame, IncomingFrame, SABMFrame } from "frames"
import { OutgoingAbstract } from "frames/outgoing/outgoingabstract"
import type { OutgoingConstructor } from "types"
import JSONB from 'json-buffer'

export class PacketSession {

    private ff: FrameFactory
    private isConnected: boolean
    // private ls: LocalStorage = new LocalStorage('./modulo128Cache')
    private readonly modulo = 8 // TODO: modulo 128

    constructor(args: OutgoingConstructor) {
        this.ff = new FrameFactory(args)
        this.isConnected = false
    }

    private async getNextReceived(): Promise<IncomingFrame> {
        return new Promise((resolve) => {
            this.ff.getKissConnection().once('data', (data: IncomingFrame) => {
                if (this.isAddressedToMe(data)) {
                    resolve(data)
                }
                else {
                    this.getNextReceived()
                }
            })
        })
    }

    private async getResponseWithT1(frame: OutgoingAbstract): Promise<IncomingFrame> {

        const BUFFER: number = 10_000

        const rptrCount = (frame.getRepeaters().length < 1) ? 1 : frame.getRepeaters().length

        const received: Promise<IncomingFrame> = this.getNextReceived()

        const timer: Promise<void> = new Promise((_resolve, reject) => {
            setTimeout(() => {
                reject(`T1 timer for ${frame.getFrameSubtype()} timed out.`)
            }, ((frame.getEncoded().length * 8) / this.ff.getKissConnection().getTxBaud()) * rptrCount * 1000 * 2 + BUFFER) // (bits / baud) = seconds, seconds * 1000 = milliseconds, double it per ax.25 spec, add 10s some buffer time
        })

        const response = await Promise.race([received, timer])

        if (response instanceof IncomingFrame) {
            return response
        }
        throw new Error(`T1 timer for ${frame.getFrameSubtype()} timed out.`);
        
    }

    private isAddressedToMe(data: IncomingFrame): boolean {
        return data.getDestinationCallsign() === this.ff.getSourceCallsign() && data.getDestinationSsid() === this.ff.getSourceSsid()
    }


    public async connect(): Promise<this> { 
        const sabm: SABMFrame = this.ff.sabm()
        sabm.send()

        const response = await this.getResponseWithT1(sabm)

        if (response.getFrameSubtype() !== 'UA') {
            throw new Error(`Failed to connect, received a ${response.getFrameSubtype()} frame. A UA frame was expected.`)
        }

        this.isConnected = true
        return this
    }

    public async disconnect(): Promise<this> {
        const disc: DISCFrame = this.ff.disc()
        disc.send()
        
        const response = await this.getResponseWithT1(disc)

        if (response.getFrameSubtype() !== 'UA') {
            disc.send()
        }

        this.isConnected = false
        return this
    }

    private async handleRej(sequence: number, slice: IFrame[]): Promise<void> {
        for (let i = sequence; i < slice.length; i++) {
            slice[i].setSendSequence(sequence).send()
        }
        const response = await this.getNextReceived()
        if (response.getFrameSubtype() === 'REJ') {
            this.handleRej(response.getReceivedSequence()!, slice)
        }
    }

    private async handleSrej(sequence: number, slice: IFrame[]): Promise<void> {
        slice[sequence].send()
        const response = await this.getNextReceived()
        if (response.getFrameSubtype() === 'SREJ') {
            this.handleSrej(response.getReceivedSequence()!, slice)
        }
        else if (response.getFrameSubtype() === 'REJ') {
            this.handleRej(response.getReceivedSequence()!, slice)
        }
    }

    public async send(payload: any): Promise<void> {
        const asString = JSONB.stringify(payload)
        const qFrames = Math.ceil(asString.length / 256)
        const frames: IFrame[][] = []
        
        // create two dimensional frame array
        for (let i = 0, j = 0, o = 0, ss = 0; i < qFrames; i++, o += 255) {

            if (typeof frames[j] === 'undefined') {
                frames[j] = []
            }

            frames[j].push(this.ff.info(asString.substring(o, o + 255), 0, (ss === this.modulo - 1 || i === qFrames - 1), ss))

            if (ss !== this.modulo - 1) {
                ss++
            }
            else {
                ss = 0
                j++
            }
        }

        for (let i = 0; i < frames.length; i++) {
            for (let j = 0; j < frames[i].length; j++) {
                frames[i][j].send()

                if (frames[i][j].isPollOrFinal()) {
                    const response = await this.getNextReceived()
                    if (response.getFrameSubtype() === 'REJ') {
                        await this.handleRej(response.getReceivedSequence()!, frames[i])
                    }
                    else if (response.getFrameSubtype() === 'SREJ') {
                        await this.handleSrej(response.getReceivedSequence()!, frames[i])
                    }
                }
            }
        }
    }

    public async receive(mode: 'concat' | 'payloadArray' | 'frameArray'): Promise<any> {

    }

}
