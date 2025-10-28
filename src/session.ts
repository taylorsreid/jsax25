// import { DISCFrame, DMFrame, IFrame, InboundFrame, UAFrame } from "../frames/index.js"
// import { resetRepeaters, validateCallsign, validatePid, validateSsid, type Repeater } from "../misc.js"
// import type { TNC } from "./tnc.js"

// export interface SessionConstructor {
//     tnc: TNC
//     destinationCallsign: string
//     destinationSsid: number
//     destinationReservedBitOne: boolean
//     destinationReservedBitTwo: boolean
//     repeaters: Repeater[]
//     modulo: 8 | 128
//     pid: number
//     t1?: number
// }
// export class OutboundSession {
//     protected tnc: TNC
//     protected _destinationCallsign: string
//     public get destinationCallsign(): string {
//         return this._destinationCallsign
//     }
//     public set destinationCallsign(value: string) {
//         validateCallsign(value)
//         this._destinationCallsign = value
//     }

//     protected _destinationSsid: number
//     public get destinationSsid(): number {
//         return this._destinationSsid
//     }
//     public set destinationSsid(value: number) {
//         validateSsid(value)
//         this._destinationSsid = value
//     }

//     public destinationReservedBitOne: boolean
//     public destinationReservedBitTwo: boolean

//     protected _repeaters: Repeater[]
//     public get repeaters(): Repeater[] {
//         return this._repeaters
//     }
//     public set repeaters(value: Repeater[]) {
//         this._repeaters = resetRepeaters(value)
//     }

//     public modulo: 8 | 128

//     protected _pid: number
//     public get pid(): number {
//         return this._pid
//     }
//     public set pid(value: number) {
//         validatePid(value)
//         this._pid = value
//     }
//     protected _ns: number = 0
//     public get ns(): number {
//         return this._ns
//     }
//     protected set ns(value: number) {
//         if (value >= this.modulo) {
//             throw new Error(`ns ${value} cannot be greater than or equal to modulo ${this.modulo}`)
//         }
//         this._ns = value
//     }
//     protected _nr: number = 0
//     public get nr(): number {
//         return this._nr
//     }
//     protected set nr(value: number) {
//         if (value >= this.modulo) {
//             throw new Error(`nr ${value} cannot be greater than or equal to modulo ${this.modulo}`)
//         }
//         this._nr = value
//     }

//     protected _t1: number
//     public get t1(): number {
//         return this._t1
//     }
//     public set t1(ms: number) {
//         validateT1(ms)
//         this._t1 = ms
//     }

//     constructor(args: SessionConstructor) {
//         this.tnc = args.tnc
//         this.destinationCallsign = args.destinationCallsign
//         this.destinationSsid = args.destinationSsid
//         this.destinationReservedBitOne = args.destinationReservedBitOne ?? false
//         this.destinationReservedBitTwo = args.destinationReservedBitTwo ?? false
//         this.repeaters = args.repeaters ?? []
//         this.modulo = args.modulo ?? 8
//         this.pid = args.pid ?? 0xF0
//         this.t1 = args.t1 ?? 10_000
//     } 

//     // private async handleRej(sequence: number, slice: IFrame[]): Promise<void> {
//     //     // for (let i = sequence; i < slice.length; i++) {
//     //     //     slice[i].sendSequence = sequence
//     //     //     slice[i].send()
//     //     // }
//     //     // const response = await this.getNextReceived()
//     //     // if (response.frameSubtype === 'REJ') {
//     //     //     this.handleRej(response.receivedSequence!, slice)
//     //     // }
//     // }

//     // private async handleSrej(sequence: number, slice: IFrame[]): Promise<void> {
//     //     slice[sequence].send()
//     //     const response = await this.getNextReceived()
//     //     if (response.frameSubtype === 'SREJ') {
//     //         this.handleSrej(response.receivedSequence!, slice)
//     //     }
//     //     else if (response.frameSubtype === 'REJ') {
//     //         this.handleRej(response.receivedSequence!, slice)
//     //     }
//     // }

//     /**
//      * An alias for TNCSession.disconnect()
//      */
//     public async end(): Promise<void> {
//         return this.disconnect()
//     }

//     public async disconnect(): Promise<void> {

//         const disc: DISCFrame = new DISCFrame({
//             kissConnection: this.tnc.kissConnection,
//             destinationCallsign: this.destinationCallsign,
//             destinationSsid: this.destinationSsid,
//             sourceCallsign: this.tnc.myCall,
//             sourceSsid: this.tnc.mySsid,
//             repeaters: this.repeaters
//         })

//         // retry
//         if ((await disc.send().getResponse()).subtype !== 'UA') {
//             disc.send()
//         }
//     }

//     public async send(payload: string): Promise<void> {

//         // const asString = JSONB.stringify(payload)
//         const frames: IFrame[][] = []
//         const totalFrames = Math.ceil(payload.length / 256)
//         const sets = Math.ceil(totalFrames / this.modulo)

//         for (let i = 0, strPosition = 0, framePosition = 0; i < sets; i++) {

//             if (typeof frames[i] === 'undefined') {
//                 frames[i] = []
//             }

//             for (let j = 0; j < this.modulo && framePosition < totalFrames; j++, strPosition += 255, framePosition++) {
//                 frames[i][j] = new IFrame({
//                     destinationCallsign: this.destinationCallsign,
//                     destinationSsid: this.destinationSsid,
//                     destinationReservedBitOne: this.destinationReservedBitOne,
//                     destinationReservedBitTwo: this.destinationReservedBitTwo,
//                     sourceCallsign: this.tnc.myCall,
//                     sourceSsid: this.tnc.mySsid,
//                     repeaters: this.repeaters,
//                     receivedSequence: this.nr,
//                     pollOrFinal: this.ns === this.modulo - 1 || framePosition === totalFrames - 1,
//                     sendSequence: this.ns,
//                     pid: this.pid,
//                     payload: payload.substring(strPosition, strPosition + 255),
//                     modulo: this.modulo
//                 })
//                 if (this.ns < this.modulo - 1) {
//                     this.ns++
//                 }
//                 else {
//                     this.ns = 0
//                 }
//             }
//         }

//         for (let i = 0; i < frames.length; i++) {

//             for (let j = 0; j < frames[i].length; j++) {

//                 frames[i][j].send()

//                 if (frames[i][j].pollOrFinal) {

//                     const response = await frames[i][j].getResponse()

//                     const rejHandler = async (seq: number) => {
//                         for (let k = seq; k < frames[i].length; k++) {
//                             frames[i][k].send()
//                             if (frames[i][k].pollOrFinal) {
//                                 const response = await frames[i][j].getResponse()
//                                 if (response.subtype === 'REJ') {
//                                     rejHandler(response.sendSequence!)
//                                 }
//                             }

//                         }
//                     }

//                     const srejHandler = (seq: number, pollOrFinal: boolean) => {

//                     }

//                     if (response.subtype === 'REJ') {
//                         rejHandler(response.sendSequence!)
//                     }
//                     else if (response.subtype === 'SREJ') {
//                         srejHandler(response.sendSequence!, response.pollOrFinal)
//                     }
//                     else if (response.subtype === 'RR') {
//                         // check sequences
//                     }
//                     else {
//                         // panic, this shouldn't happen
//                     }
//                 }
//             }
//         }
//     }

//     // private async getNextReceived(): Promise<IncomingFrame> {
//         // return new Promise((resolve) => {
//         //     const handler = (data: IncomingFrame) => {
//         //         if (
//         //             data.destinationCallsign === this.tnc.sourceCallsign &&
//         //             data.destinationSsid === this.tnc.sourceSsid &&
//         //             data.sourceCallsign === this.destinationCallsign &&
//         //             data.sourceSsid === this.destinationSsid
//         //         ) {
//         //             resolve(data)
//         //             this.tnc.kissConnection.removeListener('data', handler)
//         //         }
//         //     }
//         //     this.tnc.kissConnection.on('data', (data) => {
//         //         handler(data)
//         //     })
//         // })
//     // } 

//     public async receive(): Promise<string>
//     public async receive(mode: 'concat'): Promise<string>
//     public async receive(mode: 'payloadArray'): Promise<string[]>
//     public async receive(mode: 'frameArray'): Promise<InboundFrame[]>
//     public async receive(mode: 'concat' | 'payloadArray' | 'frameArray' = 'concat'): Promise< string | string[] | InboundFrame[] > {
//         return new Promise< string | string[] | InboundFrame[] >((resolve) => {
//             const frameArray: InboundFrame[] = []
//             const handler = (frame: InboundFrame) => {
//                 if (
//                     frame.destinationCallsign === this.tnc.myCall &&
//                     frame.destinationSsid === this.tnc.mySsid &&
//                     frame.sourceCallsign === this.destinationCallsign &&
//                     frame.sourceSsid === this.destinationSsid
//                 ) {
//                     if (frame.subtype === 'I') {
//                         frameArray.push(frame)
//                         // increment sequence variables
//                     }
//                     if (frame.pollOrFinal) {
//                         // loop through and check for missing frames and send a REJ/SREJ if necessary

//                         this.tnc.kissConnection.removeListener('data', handler)
//                     }
//                 }
//             }
//             this.tnc.kissConnection.on('data', (data) => {
//                 handler(data)
//             })
//         })
//     }

// }

// export class InboundSession extends OutboundSession {
//     private sentResponse: boolean = false
//     private readonly responseConstructor = {
//         kissConnection: this.tnc.kissConnection,
//         destinationCallsign: this.destinationCallsign,
//         destinationSsid: this.destinationSsid,
//         sourceCallsign: this.tnc.myCall,
//         sourceSsid: this.tnc.mySsid,
//         repeaters: this.repeaters
//     }

//     public accept(): void {
//         if (!this.sentResponse) {
//             new UAFrame(this.responseConstructor).send()
//             this.sentResponse = true
//         }
//     }

//     public reject(): void {
//         if (!this.sentResponse) {
//             new DMFrame(this.responseConstructor).send()
//             this.sentResponse = true
//         }
//     }

// }