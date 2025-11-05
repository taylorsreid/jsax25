// // TODO: finish and add in minor/feature version release

// import { Duplex, Readable } from "stream"
// import { setTimeout as setTimeoutPromise } from "timers/promises"
// import packageJson from '../package.json' with { type: "json" }
// import { DISCFrame, IFrame, IncomingFrame, KissConnection, RRFrame, SABMEFrame, SABMFrame, type OutgoingConstructor, type SerialKissConstructor, type TcpKissConstructor } from "./index"
// import { validatePid, type Repeater } from "./misc"

// export class TNC extends Duplex {

//     private _kissConnection!: KissConnection // set in constructor via setter
//     public get kissConnection(): KissConnection {
//         return this._kissConnection
//     }
//     public set kissConnection(value: KissConnection | TcpKissConstructor | SerialKissConstructor) {
//         if (value instanceof KissConnection) {
//             this._kissConnection = value
//         }
//         else {
//             this._kissConnection = new KissConnection(value)
//         }
//     }

//     private _theirCall: string | undefined
//     public get theirCall(): string | undefined {
//         return this._theirCall
//     }
//     private set theirCall(value: string | undefined) {
//         this._theirCall = value
//     }

//     public theirReservedBitOne: boolean
//     public theirReservedBitTwo: boolean

//     private _myCall: string | undefined
//     public get myCall(): string | undefined {
//         return this._myCall
//     }
//     private set myCall(value: string | undefined) {
//         this._myCall = value
//     }

//     // TODO: change privacy?
//     private listenCalls: string[]

//     // private _listening: string[]
//     // public get listening(): string[] {
//     //     return this._listening
//     // }
//     // public set listening(value: string | string[]) {
//     //     const check = (cv: string) => {
//     //         validateCallsign(cv.split('-')[0])
//     //         if (cv.includes('-')) {
//     //             validateSsid(parseInt(cv.split('-')[1]))
//     //         }
//     //     }
//     //     if (typeof value === 'string') {
//     //         value = value.toUpperCase().trim()
//     //         check(value)
//     //         this._listening = [value]
//     //     }
//     //     else {
//     //         this._listening = value.map((c) => {
//     //             c = c.toUpperCase().trim()
//     //             check(c)
//     //             return c
//     //         })
//     //     }
//     // }

//     // TODO:
//     // public get connected(): boolean {
//     //     return typeof this.activeMyCall === 'string'
//     // }

//     public myReservedBitOne: boolean
//     public myReservedBitTwo: boolean

//     private _modulo!: 8 | 128  // set in constructor via setter
//     public get modulo(): 8 | 128 {
//         return this._modulo
//     }
//     public set modulo(value: 8 | 128) {
//         this._modulo = value
//     }

//     private _repeaters!: string[]  // set in constructor via setter
//     public get repeaters(): string[] {
//         return this._repeaters
//     }
//     private set repeaters(value: string[]) {
//         // value.map((r) => {
//         //     validateCallsign(r.split('-')[0])
//         //     if (r.includes('-')) {
//         //         validateSsid(parseInt(r.split('-')[1]))
//         //     }
//         // })
//         this._repeaters = value
//     }

//     private _pid!: number  // set in constructor via setter
//     public get pid(): number{
//         return this._pid
//     }
//     public set pid(value: number) {
//         validatePid(value)
//         this._pid = value
//     }

//     private _t1!: number  // set in constructor via setter
//     public get t1(): number {
//         return this._t1
//     }
//     public set t1(ms: number) {
//         if (ms < 0) {
//             throw new Error(`${ms} is not a valid t1 value. T1 must be an integer greater than or equal to 0 expressed in milliseconds.`)
//         }
//         this._t1 = ms
//     }

//     private readonly t3: T3

//     private _retries!: number  // set in constructor via setter
//     public get retries(): number {
//         return this._retries
//     }
//     public set retries(value: number) {
//         if (value < 0) {
//             throw new Error('The value for the number of retries must be a positive number.')
//         }
//         this._retries = value
//     }

//     private _sendState!: number  // set in constructor via setter
//     private get sendState(): number {
//         return this._sendState
//     }
//     private set sendState(value: number) {
//         if (value > this.modulo) {
//             throw new Error(`Attempted to set sendState to ${value}. sendState cannot be larger than the modulo, which is currently ${this.modulo}.`)
//         }
//         else if (value === this.modulo) {
//             this._sendState = 0
//         }
//         else {
//             this._sendState = value
//         }
//     }

//     private _receiveState!: number  // set in constructor via setter
//     public get receiveState(): number {
//         return this._receiveState
//     }
//     private set receiveState(value: number) {
//         if (value > this.modulo) {
//             throw new Error(`Attempted to set receiveState to ${value}. receiveState cannot be larger than the modulo, which is currently ${this.modulo}.`)
//         }
//         else if (value === this.modulo) {
//             this._receiveState = 0
//         }
//         else {
//             this._receiveState = value
//         }
//     }

//     private _busy!: boolean  // set in constructor via setter
//     public get busy(): boolean {
//         return this._busy
//     }
//     private set busy(value: boolean) {
//         this._busy = value
//     }

//     private acknowledgeState: number

//     private sendBuffer: string[]
//     private sentBuffer: IFrame[]

//     constructor(args: {
//         kissConnection: KissConnection | TcpKissConstructor | SerialKissConstructor,
//         retries?: number
//         t1?: number,
//         modulo?: 8 | 128,
//         pid?: number
//         theirReservedBitOne?: boolean,
//         theirReservedBitTwo?: boolean
//         myReservedBitOne?: boolean,
//         myReservedBitTwo?: boolean,
//     }) {
//         super({ encoding: 'utf8' })

//         this.kissConnection = args.kissConnection
//         this.kissConnection.connection.on('end', () => this.end())

//         this.listenCalls = []

//         this.retries = args.retries ?? 2

//         this.t1 = args.t1 ?? 8000 // ~8000 is an I frame with a 256 byte payload and 2 repeaters, good default
//         this.t3 = new T3(this.t1, this)

//         this.modulo = args.modulo ?? 8
//         this.pid = args.pid ?? 240

//         this.myReservedBitOne = args.myReservedBitOne ?? false
//         this.myReservedBitTwo = args.myReservedBitTwo ?? false
//         this.theirReservedBitOne = args.theirReservedBitOne ?? false
//         this.theirReservedBitTwo = args.theirReservedBitTwo ?? false
        
//         this.repeaters = []
//         this.sendState = 0
//         this.receiveState = 0
//         this.acknowledgeState = 0
//         this.busy = false
//         this.sendBuffer = []
//         this.sentBuffer = []
//     }

//     private resetState(): void {
//         this.theirCall = undefined
//         this.modulo = 8
//         this.repeaters = []
//         this.sendState = 0
//         this.receiveState = 0
//         this.acknowledgeState = 0
//         this.busy = false
//         this.sendBuffer = []
//         this.sentBuffer = []
//         this.t3.stop()
//     }

//     public listenOn(listenCalls: string | string[]): this {
//         this.listenCalls = typeof listenCalls === 'string' ? [listenCalls] : listenCalls
//         this.kissConnection.on('data', this.handler)
//         return this
//     }

//     public listenOff(): this {
//         this.kissConnection.removeListener('data', this.handler)
//         this.listenCalls = []
//         return this
//     }

//     // TODO: finish this
//     private async handler(incoming: IncomingFrame): Promise<void> {

//         // if addressed to us
//         if (this.listenCalls.includes(incoming.destinationCallsign) || this.listenCalls.includes(incoming.destinationCallsign + '-' + incoming.destinationSsid)) {

//             // if already connected to this station
//             if (incoming.sourceCallsign + '-' + incoming.sourceSsid === this.theirCall) {
//                 //stop t3 timer since we've heard from the station
//                 this.t3.stop()

//                 // cache repeaters in case path has changed. not a behavior accounted for in AX.25 spec, but might as well
//                 this.repeaters = incoming.repeaters.map(r => r.callsign + '-' + r.ssid)

//                 if (this.busy) { // with modern computing speeds idk when we'd ever be too busy for slow packet radio
//                     incoming.newRNRFrame(this.receiveState, true, 'response').send()
//                 }
//                 else if (incoming.subtype === 'I') { // section 6.4.2
//                     if (incoming.sendSequence === this.receiveState) {
//                         // it's the information frame we were expecting
//                         this.receiveState++

//                         if (this.sendBuffer.length > 0) {
//                             // 
//                             for (let i = 0; i < this.sendBuffer.length; i++) {
//                                 const iFrame: IFrame = incoming.newIFrame(
//                                     this.sendBuffer[i],
//                                     this.receiveState,
//                                     this.sendState,
//                                     // if we're at the end of the queue or the send sequence is maxed out, then it we need to poll the other station
//                                     i === this.sendBuffer.length - 1 || this.sendState === this.modulo - 1,
//                                     this.pid
//                                 )

//                                 iFrame.send()
//                                 this.sendState++

//                                 // TODO:
//                                 // if true then we need to wait for a response of the remote station's status
//                                 if (iFrame.pollOrFinal) {
//                                     // remove handler so we don't end up in a recursion
//                                     this.kissConnection.removeListener('data', this.handler)
//                                     const pollOrFinalHandler = (pfFrame: IncomingFrame) => {
                                        
//                                     }
//                                     this.kissConnection.on('data', pollOrFinalHandler)
//                                     // new Promise((resolve, reject) => {

//                                     // })
//                                     // don't forget to reattach handler
//                                     this.kissConnection.on('data', this.handler)
//                                 }
//                                 else {
                                    
//                                 }

//                                 // check sentBuffer for an already existing iFrame with the same sendSequence
//                                 const existingIndex: number = this.sentBuffer.findIndex((f) => {
//                                     return f.sendSequence === iFrame.sendSequence
//                                 })

//                                 // if found, remove it
//                                 if (existingIndex > -1) {
//                                     this.sentBuffer.splice(existingIndex, 1)
//                                 }

//                                 // then add the new iFrame
//                                 this.sentBuffer.push(iFrame)
                                
//                             }

//                             // empty buffer
//                             this.sendBuffer = []

//                         }
//                         else {
//                             incoming.newRRFrame(this.receiveState, true, 'response').send()
//                         }
//                     }
//                     else {
//                         // TODO: handle out of sequence frame
//                     }
//                 }
//                 else if (incoming.subtype === 'DISC') {
//                     incoming.newUAFrame().send()
//                     this.emit('disconnected')
//                     this.resetState()   
//                 }
//                 else if (incoming.subtype === 'SABM' || incoming.subtype === 'SABME') {
//                     // TODO: RESET CONNECTION
//                 }

//                 // restart t3
//                 this.t3.start()
//             }

//             // if not connected to any station
//             else if (typeof this.theirCall === 'undefined') {
                
//                 // TODO: HANDLE ERRORS MENTIONED IN 6.3.5

//                 if (incoming.subtype === 'SABM' || incoming.subtype === 'SABME') {
//                     incoming.newUAFrame().send()
//                     this.myCall = incoming.destinationCallsign + '-' + incoming.destinationSsid
//                     this.theirCall = incoming.sourceCallsign + '-' + incoming.sourceSsid
//                     this.modulo = incoming.subtype === 'SABME' ? 128 : 8
//                     this.repeaters = incoming.repeaters.map(r => r.callsign + '-' + r.ssid)
//                     this.emit('connected', this.theirCall, this.myCall, this.repeaters, this.modulo)
//                     this.t3.start()
//                 }
//                 else if (incoming.subtype === 'UI') {
//                     this.emit('ui', incoming)
//                 }
//                 else if (incoming.subtype === 'TEST') {
//                     const info: string = `JSAX25 v${packageJson.version} Copyright 2024-${new Date().getFullYear()} Taylor Reid (KO4LCM) https://github.com/taylorsreid/jsax25 `
//                     const payload: string = info + incoming.payload
//                     incoming.newTESTFrame(payload.length < 256 ? payload : info).send()
//                 }
//                 else {
//                     incoming.newDMFrame().send()
//                 }
//             }

//             // else we're already connected to a different station, and busy
//             else {
//                 incoming.newDMFrame().send()
//             }
//         }
//     }

//     public override _read(): void {
//         if (this.sendBuffer.length > 0) {
//             this.push(this.sendBuffer.shift())
//         }
//     }

//     // TODO:
//     public override _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {

//         // if ready to send, send. if not, put it in the txBuffer

//         throw new Error('write() not implemented yet.')
//     }

//     public override _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
//         this.kissConnection.destroy()
//         callback(error)
//     }

//     public async connect(source: string, destination: string, ...repeaters: string[]): Promise<void> {

//         // remove event listeners, all events during function execution will be handled by function
//         this.kissConnection.removeListener('data', this.handler)

//         const destinationCallsign: string = destination.split('-')[0]
//         const destinationSsid: number = parseInt(destination.split('-')[1] ?? '0')
//         const sourceCallsign: string = source.split('-')[0]
//         const sourceSsid: number = parseInt(source.split('-')[1] ?? '0')
//         const repeatersArr: Repeater[] = repeaters.map((r) => {
//             return {
//                 callsign: r.split('-')[0],
//                 ssid: parseInt(r.split('-')[1] ?? '0')
//             }
//         })

//         const frameConstructor: OutgoingConstructor = {
//             kissConnection: this.kissConnection,
//             destinationCallsign,
//             destinationSsid,
//             sourceCallsign,
//             sourceSsid,
//             sourceReservedBitOne: this.myReservedBitOne,
//             sourceReservedBitTwo: this.myReservedBitTwo,
//             repeaters: repeatersArr,
//         }

//         const sabm_e: SABMFrame | SABMEFrame = this.modulo === 128 ? new SABMEFrame(frameConstructor) : new SABMFrame(frameConstructor)

//         let result: IncomingFrame | TNCBusyError | TimeoutError | TypeError | undefined

//         for (let i = 0; i <= this.retries; i++) {

//             sabm_e.send()

//             // wait for UA frame or timeout
//             result = await Promise.race<IncomingFrame | TNCBusyError | TimeoutError | TypeError>([
//                 new Promise<IncomingFrame | TNCBusyError | TypeError>((resolve) => {
//                     const callback = (frame: IncomingFrame) => {
//                         if (
//                             frame.destinationCallsign + '-' + frame.destinationSsid === source
//                             && frame.sourceCallsign + '-' + frame.sourceSsid === destination
//                         ) {
//                             if (frame.subtype === 'UA') {
//                                 resolve(frame)
//                             }
//                             else if (frame.subtype === 'DM') {
//                                 resolve(new TNCBusyError(`${destination} responded with a DM frame. This usually means the remote TNC is currently busy.`))
//                             }
//                             else {
//                                 resolve(new TypeError(`${destination} responded with a ${frame.subtype} frame. A UA frame was expected.`))
//                             }
//                             // cleanup
//                             this.kissConnection.removeListener('data', callback)
//                             i = this.retries + 1 // end loop
//                         }
//                         // send a DM frame (busy) if the packet is addressed to us but from a different source
//                         else if (this.listenCalls.includes(frame.destinationCallsign + '-' + frame.destinationSsid)) {
//                             frame.newDMFrame().send()
//                         }
//                     }
//                     this.kissConnection.on('data', callback)
//                 }),
//                 setTimeoutPromise(this.t1).then(() => {
//                     return new TimeoutError(`Connection to ${destination} timed out after ${i + 1} attempts.`)
//                 })
//             ])
//         }

//         // reattach event handler
//         this.kissConnection.on('data', this.handler)

//         if (result instanceof IncomingFrame) {
//             this.myCall = source
//             this.theirCall = destination
//             this.repeaters = result.repeaters.map(r => r.callsign + '-' + r.ssid)
//             this.emit('connected', this.myCall, this.theirCall, this.repeaters, this.modulo)
//             // this.t3.start() // TODO: yes or no?
//         }
//         else if (result instanceof Error) {
//             return Promise.reject(result)
//         }
//         else {
//             return Promise.reject(new Error('unreachable code reached'))
//         }
//     }

//     public async disconnect(): Promise<void> {

//         // if (typeof this.myCall === 'undefined' || typeof this.mySsid === 'undefined') {
//         //     return Promise.reject(new Error(`No source callsign and/or SSID is set. You must call the listen() prior to calling the disconnect() method.`))
//         // }
//         if (typeof this.myCall === 'undefined' || typeof this.theirCall === 'undefined') {
//             return Promise.reject(new Error(`You are not currently connected to another station.`))
//         }
//         else {
//             // remove event listener, all events during function execution will be handled by function
//             this.kissConnection.removeListener('data', this.handler)

//             const disconnect: DISCFrame = new DISCFrame({
//                 destinationCallsign: this.theirCall.split('-')[0],
//                 destinationSsid: parseInt(this.theirCall.split('-')[1] ?? '0'),
//                 destinationReservedBitOne: this.theirReservedBitOne,
//                 destinationReservedBitTwo: this.theirReservedBitTwo,
//                 sourceCallsign: this.myCall.split('-')[0],
//                 sourceSsid: parseInt(this.myCall.split('-')[1] ?? '0'),
//                 sourceReservedBitOne: this.myReservedBitOne,
//                 sourceReservedBitTwo: this.myReservedBitTwo,
//                 repeaters: this.repeaters.map((r) => {
//                     return {
//                         callsign: r.split('-')[0],
//                         ssid: parseInt(r.split('-')[1] ?? '0'),
//                     }
//                 }),
//                 kissConnection: this.kissConnection
//             })

//             // 
//             for (let i = 0; i <= this.retries; i++) {

//                 disconnect.send()

//                 // only race with t1 if this isn't the last attempt, otherwise just send it and forget it
//                 if (i < this.retries) {
//                     await Promise.race([
//                         new Promise<void>((resolve) => {
//                             const callback = (frame: IncomingFrame) => {
//                                 if (
//                                     frame.destinationCallsign + '-' + frame.destinationSsid === this.myCall
//                                     && frame.sourceCallsign + '-' + frame.sourceSsid === this.theirCall
//                                     && (frame.subtype === 'UA' || frame.subtype === 'DM')
//                                 ) {
//                                     resolve()
//                                     this.kissConnection.removeListener('data', callback)
//                                     i = this.retries + 1 // end loop
//                                 }
//                                 // send a DM frame (busy) if the packet is addressed to us but from a different source
//                                 else if (this.listenCalls.includes(frame.destinationCallsign + '-' + frame.destinationSsid)) {
//                                     frame.newDMFrame().send()
//                                 }
//                             }
//                             this.kissConnection.on('data', callback)
//                         }),
//                         setTimeoutPromise(this.t1)
//                     ])
//                 }
//             }
            
//             this.resetState()
//             this.kissConnection.on('data', this.handler)
//             this.emit('disconnected')
//         }
//     }

//     public override addListener(event: "close", listener: () => void): this;
//     public override addListener(event: "data", listener: (chunk: any) => void): this;
//     public override addListener(event: "drain", listener: () => void): this;
//     public override addListener(event: "end", listener: () => void): this;
//     public override addListener(event: "error", listener: (err: Error) => void): this;
//     public override addListener(event: "finish", listener: () => void): this;
//     public override addListener(event: "pause", listener: () => void): this;
//     public override addListener(event: "pipe", listener: (src: Readable) => void): this;
//     public override addListener(event: "readable", listener: () => void): this;
//     public override addListener(event: "resume", listener: () => void): this;
//     public override addListener(event: "unpipe", listener: (src: Readable) => void): this;
//     public override addListener(event: "connected", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override addListener(event: "disconnected", listener: () => void): this;
//     // public override addListener(event: "pending", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     // public override addListener(event: "cancel pending", listener: (error: Error, source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override addListener(event: "ready", listener: () => void): this;
//     public override addListener(event: "listening", listener: () => void): this;
//     public override addListener(event: "ui", listener: (uiFrame: IncomingFrame) => void): this;
//     public override addListener(event: string | symbol, listener: (...args: any[]) => void): this {
//         return super.addListener(event, listener)
//     }

//     public override on(event: "close", listener: () => void): this;
//     public override on(event: "data", listener: (chunk: any) => void): this;
//     public override on(event: "drain", listener: () => void): this;
//     public override on(event: "end", listener: () => void): this;
//     public override on(event: "error", listener: (err: Error) => void): this;
//     public override on(event: "finish", listener: () => void): this;
//     public override on(event: "pause", listener: () => void): this;
//     public override on(event: "pipe", listener: (src: Readable) => void): this;
//     public override on(event: "readable", listener: () => void): this;
//     public override on(event: "resume", listener: () => void): this;
//     public override on(event: "unpipe", listener: (src: Readable) => void): this;
//     public override on(event: "connected", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override on(event: "disconnected", listener: () => void): this;
//     // public override on(event: "pending", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     // public override on(event: "cancel pending", listener: (error: Error, source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override on(event: "ready", listener: () => void): this;
//     public override on(event: "listening", listener: () => void): this;
//     public override on(event: "ui", listener: (uiFrame: IncomingFrame) => void): this;
//     public override on(event: string | symbol, listener: (...args: any[]) => void): this {
//         return super.on(event, listener)
//     }

//     public override once(event: "close", listener: () => void): this;
//     public override once(event: "data", listener: (chunk: any) => void): this;
//     public override once(event: "drain", listener: () => void): this;
//     public override once(event: "end", listener: () => void): this;
//     public override once(event: "error", listener: (err: Error) => void): this;
//     public override once(event: "finish", listener: () => void): this;
//     public override once(event: "pause", listener: () => void): this;
//     public override once(event: "pipe", listener: (src: Readable) => void): this;
//     public override once(event: "readable", listener: () => void): this;
//     public override once(event: "resume", listener: () => void): this;
//     public override once(event: "unpipe", listener: (src: Readable) => void): this;
//     public override once(event: "connected", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override once(event: "disconnected", listener: () => void): this;
//     // public override once(event: "pending", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     // public override once(event: "cancel pending", listener: (error: Error, source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override once(event: "ready", listener: () => void): this;
//     public override once(event: "listening", listener: () => void): this;
//     public override once(event: "ui", listener: (uiFrame: IncomingFrame) => void): this;
//     public override once(event: string | symbol, listener: (...args: any[]) => void): this {
//         return super.once(event, listener)
//     }

//     public override prependListener(event: "close", listener: () => void): this;
//     public override prependListener(event: "data", listener: (chunk: any) => void): this;
//     public override prependListener(event: "drain", listener: () => void): this;
//     public override prependListener(event: "end", listener: () => void): this;
//     public override prependListener(event: "error", listener: (err: Error) => void): this;
//     public override prependListener(event: "finish", listener: () => void): this;
//     public override prependListener(event: "pause", listener: () => void): this;
//     public override prependListener(event: "pipe", listener: (src: Readable) => void): this;
//     public override prependListener(event: "readable", listener: () => void): this;
//     public override prependListener(event: "resume", listener: () => void): this;
//     public override prependListener(event: "unpipe", listener: (src: Readable) => void): this;
//     public override prependListener(event: "connected", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override prependListener(event: "disconnected", listener: () => void): this;
//     // public override prependListener(event: "pending", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     // public override prependListener(event: "cancel pending", listener: (error: Error, source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override prependListener(event: "ready", listener: () => void): this;
//     public override prependListener(event: "listening", listener: () => void): this;
//     public override prependListener(event: "ui", listener: (uiFrame: IncomingFrame) => void): this;
//     public override prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
//         return super.prependListener(event, listener)
//     }

//     public override prependOnceListener(event: "close", listener: () => void): this;
//     public override prependOnceListener(event: "data", listener: (chunk: any) => void): this;
//     public override prependOnceListener(event: "drain", listener: () => void): this;
//     public override prependOnceListener(event: "end", listener: () => void): this;
//     public override prependOnceListener(event: "error", listener: (err: Error) => void): this;
//     public override prependOnceListener(event: "finish", listener: () => void): this;
//     public override prependOnceListener(event: "pause", listener: () => void): this;
//     public override prependOnceListener(event: "pipe", listener: (src: Readable) => void): this;
//     public override prependOnceListener(event: "readable", listener: () => void): this;
//     public override prependOnceListener(event: "resume", listener: () => void): this;
//     public override prependOnceListener(event: "unpipe", listener: (src: Readable) => void): this;
//     public override prependOnceListener(event: "connected", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override prependOnceListener(event: "disconnected", listener: () => void): this;
//     // public override prependOnceListener(event: "pending", listener: (source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     // public override prependOnceListener(event: "cancel pending", listener: (error: Error, source: string, destination: string, repeaters: string[], modulo: 8 | 128) => void): this;
//     public override prependOnceListener(event: "ready", listener: () => void): this;
//     public override prependOnceListener(event: "listening", listener: () => void): this;
//     public override prependOnceListener(event: "ui", listener: (uiFrame: IncomingFrame) => void): this;
//     public override prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
//         return super.prependOnceListener(event, listener)
//     }

//     public override removeListener(event: "close", listener: () => void): this;
//     public override removeListener(event: "data", listener: (chunk: any) => void): this;
//     public override removeListener(event: "drain", listener: () => void): this;
//     public override removeListener(event: "end", listener: () => void): this;
//     public override removeListener(event: "error", listener: (err: Error) => void): this;
//     public override removeListener(event: "finish", listener: () => void): this;
//     public override removeListener(event: "pause", listener: () => void): this;
//     public override removeListener(event: "pipe", listener: (src: Readable) => void): this;
//     public override removeListener(event: "readable", listener: () => void): this;
//     public override removeListener(event: "resume", listener: () => void): this;
//     public override removeListener(event: "unpipe", listener: (src: Readable) => void): this;
//     public override removeListener(event: "connected", listener: () => void): this;
//     public override removeListener(event: "disconnected", listener: () => void): this;
//     // public override removeListener(event: "pending", listener: () => void): this;
//     // public override removeListener(event: "cancel pending", listener: () => void): this;
//     public override removeListener(event: "ready", listener: () => void): this;
//     public override removeListener(event: "listening", listener: () => void): this;
//     public override removeListener(event: "ui", listener: () => void): this;
//     public override removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
//         return super.removeListener(event, listener)
//     }

//     public override emit(event: "close"): boolean;
//     public override emit(event: "data", chunk: any): boolean;
//     public override emit(event: "drain"): boolean;
//     public override emit(event: "end"): boolean;
//     public override emit(event: "error", err: Error): boolean;
//     public override emit(event: "finish"): boolean;
//     public override emit(event: "pause"): boolean;
//     public override emit(event: "pipe", src: Readable): boolean;
//     public override emit(event: "readable"): boolean;
//     public override emit(event: "resume"): boolean;
//     public override emit(event: "unpipe", src: Readable): boolean;
//     public override emit(event: "connected", source: string, destination: string, repeaters: string[], modulo: 8 | 128): boolean
//     public override emit(event: "disconnected"): boolean;
//     // public override emit(event: "pending", source: string, destination: string, repeaters: string[], modulo: 8 | 128): boolean;
//     // public override emit(event: "cancel pending", error: Error, source: string, destination: string, repeaters: string[], modulo: 8 | 128): boolean;
//     public override emit(event: "ready"): boolean;
//     public override emit(event: "listening"): boolean;
//     public override emit(event: "ui", uiFrame: IncomingFrame): boolean;
//     public override emit(event: string | symbol, ...args: any[]): boolean {
//         return super.emit(event, ...args)
//     }

// }

// export class TNCBusyError extends Error {
//     constructor(message?: string, options?: ErrorOptions) {
//         super(message, options)
//     }
// }

// export class TimeoutError extends Error {
//     constructor(message?: string, options?: ErrorOptions) {
//         super(message, options)
//     }
// }

// class T3 {
//     private t1: number
//     private tnc: TNC
//     private timeout: NodeJS.Timeout | undefined

//     constructor(t1: number, tnc: TNC) {
//         this.t1 = t1
//         this.tnc = tnc
//     }

//     public start(): void {
//         if (typeof this.tnc.theirCall !== 'undefined') {
//             this.timeout = setTimeout(() => {
//                 new RRFrame({
//                     destinationCallsign: this.tnc.theirCall!,
//                     destinationSsid: parseInt(this.tnc.theirCall!.split('-')[1] ?? '0'),
//                     destinationReservedBitOne: this.tnc.theirReservedBitOne,
//                     destinationReservedBitTwo: this.tnc.theirReservedBitTwo,
//                     sourceCallsign: this.tnc.myCall!.split('-')[0],
//                     sourceSsid: parseInt(this.tnc.myCall!.split('-')[1] ?? '0'),
//                     sourceReservedBitOne: this.tnc.myReservedBitOne,
//                     sourceReservedBitTwo: this.tnc.myReservedBitTwo,
//                     receivedSequence: this.tnc.receiveState
//                 }).send()
//             }, this.t1 * 2)
//         }
//         else {
//             throw new Error(`Cannot set T3 timer, TNC is not currently connected to a remote station.`);
//         }
//     }

//     public stop(): void {
//         clearTimeout(this.timeout)
//     }
// }