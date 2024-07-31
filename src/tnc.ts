import EventEmitter from "events"
import type { OutgoingAbstract } from "frames/outgoing/outgoingabstract.js"
import { IncomingFrame, SABMFrame } from "./frames/index.js"
import { KissConnection, type SerialKissConstructor, type TcpKissConstructor } from "./kissconnection.js"
import { resetRepeaters, validateCallsign, validatePid, validateSsid, type Repeater } from "./misc.js"
import { PacketSession } from "./packetsession.js"

export class TNC extends EventEmitter {

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

    private _sourceCallsign: string
    public get sourceCallsign(): string {
        return this._sourceCallsign
    }
    public set sourceCallsign(value: string) {
        validateCallsign(value)
        this._sourceCallsign = value.toUpperCase().trim()
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

    private _pid: number
    public get pid(): number {
        return this._pid
    }
    public set pid(value: number) {
        validatePid
        this._pid = value
    }

    public modulo: 8 | 128

    constructor(args: {
        kissConnection: KissConnection | TcpKissConstructor | SerialKissConstructor
        sourceCallsign: string,
        sourceSsid: number,
        sourceReservedBitOne?: boolean,
        sourceReservedBitTwo?: boolean,
        pid?: number
        modulo?: 8 | 128
    }) {
        super()
        this.kissConnection = args.kissConnection
        this.sourceCallsign = args.sourceCallsign
        this.sourceSsid = args.sourceSsid
        this.sourceReservedBitOne = args.sourceReservedBitOne ?? false
        this.sourceReservedBitTwo = args.sourceReservedBitTwo ?? false
        this.pid = args.pid ?? 0xF0
        this.modulo = args.modulo ?? 8
    }

    private isAddressedToMe(frame: IncomingFrame): boolean {
        return frame.destinationCallsign === this.sourceCallsign && frame.destinationSsid === this.sourceSsid
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

    // public on<K>(eventName: 'connection', listener: (session: PacketSession) => void): this {
    //     return super.on('connection', )
    // }

    public async getNextReceived(): Promise<IncomingFrame> {
        return new Promise((resolve) => {
            const handler = (data: IncomingFrame) => {
                if (this.isAddressedToMe(data)) {
                    resolve(data)
                    this.kissConnection.removeListener('data', handler)
                }
            }
            this.kissConnection.on('data', (data) => {
                handler(data)
            })
        })
    }

    public async connect(args: {
        destinationCallsign: string,
        destinationSsid?: number
        destinationReservedBitOne?: boolean
        destinationReservedBitTwo?: boolean
        repeaters?: Repeater[]
    }): Promise<PacketSession> {

        const construct = {
            kissConnection: this.kissConnection,
            destinationCallsign: args.destinationCallsign,
            destinationSsid: args.destinationSsid,
            destinationReservedBitOne: args.destinationReservedBitOne,
            destinationReservedBitTwo: args.destinationReservedBitTwo,
            sourceCallsign: this.sourceCallsign,
            sourceSsid: this.sourceSsid,
            sourceReservedBitOne: this.sourceReservedBitOne,
            sourceReservedBitTwo: this.sourceReservedBitTwo,
            repeaters: resetRepeaters(args.repeaters),
            modulo: this.modulo,
            pid: this.pid
        }
        
        const sabm: SABMFrame = new SABMFrame(construct)
        sabm.send()

        return this.getResponseWithT1(sabm).then((response) => {
            if (response.frameSubtype === 'UA') {
                return new PacketSession(construct)
            }
            throw new Error(response.frameSubtype)
        })
    }

    public async listen(): Promise<void> {
        return new Promise((resolve) => {
            const handler = (incoming: IncomingFrame) => {
                if (this.isAddressedToMe(incoming)) {
                    if (incoming.frameSubtype === 'SABM') {
                        incoming.UAFrame().send()
                        this.kissConnection.removeListener('data', handler)
                        resolve()
                    }
                    else {
                        incoming.DMFrame().send()
                    }
                }
            }
            this.kissConnection.on('data', (incoming) => {
                handler(incoming)
            })
        })
    }

}