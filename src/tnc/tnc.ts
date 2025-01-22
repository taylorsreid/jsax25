import EventEmitter from "events"
import { InboundFrame, SABMEFrame, SABMFrame, type OutboundConstructor } from "../index.js"
import { KissConnection, type SerialKissConstructor, type TcpKissConstructor } from "../index.js"
import { resetRepeaters, validateCallsign, validateSsid, validateT1, type Repeater } from "../misc.js"
import { InboundSession, OutboundSession } from "./session.js"

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

    private _t1: number
    public get t1(): number {
        return this._t1
    }
    public set t1(ms: number) {
        validateT1(ms)
        this._t1 = ms
    }

    constructor(args: {
        kissConnection: KissConnection | TcpKissConstructor | SerialKissConstructor
        sourceCallsign: string,
        sourceSsid: number,
        sourceReservedBitOne?: boolean,
        sourceReservedBitTwo?: boolean,
        t1?: number
    }) {
        super()
        this.kissConnection = args.kissConnection
        this.sourceCallsign = args.sourceCallsign
        this.sourceSsid = args.sourceSsid
        this.sourceReservedBitOne = args.sourceReservedBitOne ?? false
        this.sourceReservedBitTwo = args.sourceReservedBitTwo ?? false
        this.t1 = args.t1 ?? 10_000

        this.kissConnection.on('data', (frame) => {
            if (
                frame.destinationCallsign === this.sourceCallsign &&
                frame.destinationSsid === this.sourceSsid &&
                ( frame.subtype === 'SABM' || frame.subtype === 'SABME' )
            ) {
                let modulo: 8 | 128 = (frame.subtype === 'SABM') ? 8 : 128
                this.emit('inbound', new InboundSession({
                    tnc: this,
                    destinationCallsign: frame.sourceCallsign,
                    destinationSsid: frame.sourceSsid,
                    destinationReservedBitOne: false,
                    destinationReservedBitTwo: false,
                    repeaters: frame.repeaters, // TNCSession automatically resets hasBeenRepeated on each repeater
                    modulo: modulo,
                    pid: 0xF0
                }))
            }
        })
    }

    public on<K>(eventName: 'inbound', listener: (session: InboundSession) => void): this
    public on<K>(eventName: 'outbound', listener: (session: OutboundSession) => void): this
    public on<K>(eventName: string, listener: (...args: any[]) => void): this {
        return super.on(eventName, listener)
    }

    public once<K>(eventName: 'inbound', listener: (session: InboundSession) => void): this
    public once<K>(eventName: 'outbound', listener: (session: OutboundSession) => void): this 
    public once<K>(eventName: string, listener: (...args: any[]) => void): this {
        return super.on(eventName, listener)
    }

    public emit<K>(eventName: 'inbound', session: InboundSession): boolean
    public emit<K>(eventName: 'outbound', session: OutboundSession): boolean
    public emit<K>(eventName: string | symbol, ...args: any[]): boolean {
        return super.emit(eventName, ...args)
    }

    public end(): void {
        this.kissConnection.end()
        this.removeAllListeners()
    }

    public async getNextReceived(): Promise<InboundFrame> {
        return new Promise((resolve) => {
            const handler = (frame: InboundFrame) => {
                if (frame.destinationCallsign === this.sourceCallsign && frame.destinationSsid === this.sourceSsid) {
                    resolve(frame)
                    this.kissConnection.removeListener('data', handler)
                }
            }
            this.kissConnection.on('data', (data) => {
                handler(data)
            })
        })
    }

    //

    public async connect(args: {
        destinationCallsign: string,
        destinationSsid?: number
        destinationReservedBitOne?: boolean
        destinationReservedBitTwo?: boolean
        repeaters?: Repeater[],
        modulo?: 8 | 128,
        pid?: number,
        t1?: number
    }): Promise<OutboundSession> {

        const frameConstructor: OutboundConstructor = {
            kissConnection: this.kissConnection,
            destinationCallsign: args.destinationCallsign,
            destinationSsid: args.destinationSsid,
            destinationReservedBitOne: args.destinationReservedBitOne,
            destinationReservedBitTwo: args.destinationReservedBitTwo,
            sourceCallsign: this.sourceCallsign,
            sourceSsid: this.sourceSsid,
            sourceReservedBitOne: this.sourceReservedBitOne,
            sourceReservedBitTwo: this.sourceReservedBitTwo,
            repeaters: resetRepeaters(args.repeaters)
        }

        let sabm_e: SABMFrame | SABMEFrame
        if (args.modulo === 128) {
            sabm_e = new SABMEFrame(frameConstructor)
        }
        else {
            sabm_e = new SABMFrame(frameConstructor)
        }

        const res: InboundFrame = await sabm_e.send().getResponse(args.t1 ?? this.t1)

        const sessionConstructor = {
            tnc: this,
            destinationCallsign: args.destinationCallsign,
            destinationSsid: args.destinationSsid ?? 0,
            destinationReservedBitOne: args.destinationReservedBitOne ?? false,
            destinationReservedBitTwo: args.destinationReservedBitTwo ?? false,
            repeaters: resetRepeaters(args.repeaters),
            modulo: args.modulo ?? 8,
            pid: args.pid ?? 0xF0,
            t1: args.t1 ?? this.t1
        }

        if (res.subtype === 'UA') {
            const session: OutboundSession = new OutboundSession(sessionConstructor)
            this.emit('outbound', session)
            return session
        }

        // the remote TNC probably doesn't support SABME and modulo 128, so try SABM and modulo 8
        else if (res.subtype === 'DM' && args.modulo === 128 && (await new SABMFrame(frameConstructor).send().getResponse(args.t1 ?? this.t1)).subtype === 'UA') {
            sessionConstructor.modulo = 8
            const session: OutboundSession = new OutboundSession(sessionConstructor)
            this.emit('outbound', session)
            return session
        }

        throw new Error(res.subtype)
    }

}