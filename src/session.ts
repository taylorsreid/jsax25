import { DISCFrame, IFrame, IncomingFrame } from "frames/index.js"
import type { OutgoingAbstract } from "frames/outgoing/outgoingabstract.js"
import JSONB from 'json-buffer'
import { KissConnection, type SerialKissConstructor, type TcpKissConstructor } from "kissconnection.js"
import { resetRepeaters, validateCallsign, validatePid, validateSsid, type Repeater } from "misc.js"

export class PacketSession {
    private _kissConnection: KissConnection
    public get kissConnection(): KissConnection {
        return this._kissConnection
    }
    public set kissConnection(value: KissConnection | TcpKissConstructor | SerialKissConstructor) {
        if (value instanceof KissConnection) {
            this._kissConnection = value
        }
        else {
            this._kissConnection = new KissConnection(value)
        }
    }

    private _destinationCallsign: string
    public get destinationCallsign(): string {
        return this._destinationCallsign
    }
    public set destinationCallsign(value: string) {
        validateCallsign(value)
        this._destinationCallsign = value
    }

    private _destinationSsid: number
    public get destinationSsid(): number {
        return this._destinationSsid
    }
    public set destinationSsid(value: number) {
        validateSsid(value)
        this._destinationSsid = value
    }

    public destinationReservedBitOne: boolean
    public destinationReservedBitTwo: boolean

    private _sourceCallsign: string
    public get sourceCallsign(): string {
        return this._sourceCallsign
    }
    public set sourceCallsign(value: string) {
        validateCallsign(value)
        this._sourceCallsign = value
    }

    private _sourceSsid: number
    public get sourceSsid(): number {
        return this._sourceSsid
    }
    public set sourceSsid(value: number) {
        validateSsid(value)
        this._sourceSsid = value
    }

    public sourceReservedBitOne: boolean
    public sourceReservedBitTwo: boolean

    private _repeaters: Repeater[]
    public get repeaters(): Repeater[] {
        return this._repeaters
    }
    public set repeaters(value: Repeater[]) {
        this._repeaters = resetRepeaters(value)
    }

    public modulo: 8 | 128
    private _pid: number
    public get pid(): number {
        return this._pid
    }
    public set pid(value: number) {
        validatePid(value)
        this._pid = value
    }
    private _ns: number = 0
    public get ns(): number {
        return this._ns
    }
    public set ns(value: number) {
        if (value >= this.modulo) {
            throw new Error(`ns ${value} cannot be greater than or equal to modulo ${this.modulo}`)
        }
        this._ns = value
    }
    private _nr: number = 0
    public get nr(): number {
        return this._nr
    }
    public set nr(value: number) {
        if (value >= this.modulo) {
            throw new Error(`nr ${value} cannot be greater than or equal to modulo ${this.modulo}`)
        }
        this._nr = value
    }

    constructor(args: {
        kissConnection: KissConnection | TcpKissConstructor | SerialKissConstructor

        destinationCallsign: string,
        destinationSsid?: number,
        destinationReservedBitOne?: boolean
        destinationReservedBitTwo?: boolean

        sourceCallsign: string,
        sourceSsid?: number,
        sourceReservedBitOne?: boolean
        sourceReservedBitTwo?: boolean

        repeaters?: Repeater[]
        modulo?: 8 | 128
        pid?: number
    }){
        this.kissConnection = args.kissConnection

        this.destinationCallsign = args.destinationCallsign
        this.destinationSsid = args.destinationSsid ?? 0
        this.destinationReservedBitOne = args.destinationReservedBitOne ?? false
        this.destinationReservedBitTwo = args.destinationReservedBitTwo ?? false

        this.sourceCallsign = args.sourceCallsign
        this.sourceSsid = args.sourceSsid ?? 0
        this.sourceReservedBitOne = args.sourceReservedBitOne ?? false
        this.sourceReservedBitTwo = args.sourceReservedBitTwo ?? false

        this.repeaters = args.repeaters ?? []
        this.modulo = args.modulo ?? 8
        this.pid = args.pid ?? 0xF0
    }

    private async getNextReceived(): Promise<IncomingFrame> {
        return new Promise((resolve) => {
            const handler = (data: IncomingFrame) => {
                if (
                    data.destinationCallsign === this.sourceCallsign &&
                    data.destinationSsid === this.sourceSsid &&
                    data.sourceCallsign === this.destinationCallsign &&
                    data.sourceSsid === this.destinationSsid
                ) {
                    resolve(data)
                    this.kissConnection.removeListener('data', handler)
                }
            }
            this.kissConnection.on('data', (data) => {
                handler(data)
            })
        })
    }

    private async getResponseWithT1(frame: OutgoingAbstract): Promise<IncomingFrame> {
        const BUFFER: number = 10_000
        const rptrCount = (frame.repeaters.length < 1) ? 1 : frame.repeaters.length
        const received: Promise<IncomingFrame> = this.getNextReceived()

        const timer: Promise<void> = new Promise((_resolve, reject) => {
            setTimeout(() => {
                reject(`T1 timer for ${frame.frameSubtype} timed out.`)
            }, ((frame.encoded.length * 8) / this.kissConnection.txBaud) * rptrCount * 1000 * 2 + BUFFER) // (bits / baud) = seconds, seconds * 1000 = milliseconds, double it per ax.25 spec, add 10s some buffer time
        })

        return Promise.race([received, timer]).then((result) => {
            if (result) {
                return result
            }
            throw new Error(`T1 timer for ${frame.frameSubtype} timed out.`);
        })
    }

    // listen for incoming sabm
    

    // private async handleRej(sequence: number, slice: IFrame[]): Promise<void> {
    //     // for (let i = sequence; i < slice.length; i++) {
    //     //     slice[i].sendSequence = sequence
    //     //     slice[i].send()
    //     // }
    //     // const response = await this.getNextReceived()
    //     // if (response.frameSubtype === 'REJ') {
    //     //     this.handleRej(response.receivedSequence!, slice)
    //     // }
    // }

    // private async handleSrej(sequence: number, slice: IFrame[]): Promise<void> {
    //     slice[sequence].send()
    //     const response = await this.getNextReceived()
    //     if (response.frameSubtype === 'SREJ') {
    //         this.handleSrej(response.receivedSequence!, slice)
    //     }
    //     else if (response.frameSubtype === 'REJ') {
    //         this.handleRej(response.receivedSequence!, slice)
    //     }
    // }

    public async disconnect(): Promise<void> {

        const disc: DISCFrame = new DISCFrame({
            kissConnection: this.kissConnection,
            destinationCallsign: this.destinationCallsign,
            destinationSsid: this.destinationSsid,
            sourceCallsign: this.sourceCallsign,
            sourceSsid: this.sourceSsid,
            repeaters: this.repeaters
        })
        disc.send()

        if ((await this.getResponseWithT1(disc)).frameSubtype !== 'UA') {
            disc.send()
        }
    }

    public async send(payload: any): Promise<void> {

        const asString = JSONB.stringify(payload)
        const frames: IFrame[][] = []
        const totalFrames = Math.ceil(asString.length / 256)
        const sets = Math.ceil(totalFrames / this.modulo)

        for (let i = 0, strPosition = 0, framePosition = 0; i < sets; i++) {

            if (typeof frames[i] === 'undefined') {
                frames[i] = []
            }

            for (let j = 0; j < this.modulo && framePosition < totalFrames; j++, strPosition += 255, framePosition++) {
                frames[i][j] = new IFrame({
                    destinationCallsign: this.destinationCallsign,
                    destinationSsid: this.destinationSsid,
                    destinationReservedBitOne: this.destinationReservedBitOne,
                    destinationReservedBitTwo: this.destinationReservedBitTwo,
                    sourceCallsign: this.sourceCallsign,
                    sourceSsid: this.sourceSsid,
                    repeaters: this.repeaters,
                    receivedSequence: this.nr,
                    pollOrFinal: this.ns === this.modulo - 1 || framePosition === totalFrames - 1,
                    sendSequence: this.ns,
                    pid: this.pid,
                    payload: asString.substring(strPosition, strPosition + 255),
                    
                })
                if (this.ns < this.modulo - 1) {
                    this.ns++
                }
                else {
                    this.ns = 0
                }
            }
        }

        for (let i = 0; i < frames.length; i++) {

            for (let j = 0; j < frames[i].length; j++) {

                frames[i][j].send()

                if (frames[i][j].pollOrFinal) {

                    const response = await this.getNextReceived()

                    const rejHandler = async (seq: number) => {
                        for (let k = seq; k < frames[i].length; k++) {
                            frames[i][k].send()
                            const response = await this.getNextReceived()
                            if (response.frameSubtype === 'REJ') {
                                rejHandler(response.sendSequence!)
                            }
                        }
                    }

                    const srejHandler = (seq: number, pollOrFinal: boolean) => {
                         
                    }

                    if (response.frameSubtype === 'REJ') {
                        rejHandler(response.sendSequence!)
                    }
                    else if (response.frameSubtype === 'SREJ') {
                        srejHandler(response.sendSequence!, response.pollOrFinal)
                    }
                    
                }
            }
        }
    }

    public async receive(mode: 'concat' | 'payloadArray' | 'frameArray'): Promise<any> {

    }

}
