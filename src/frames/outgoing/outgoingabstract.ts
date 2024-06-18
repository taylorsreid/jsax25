import { BaseAbstract } from "../baseabstract";
import type { OutgoingConstructor, IFrameType, FrameType, MockModemConstructor, Repeater, SFrameType, SerialConstructor, UFrameType } from "../../types";
import JSONB from 'json-buffer'
import { KissConnection } from "../../kissconnection";
import { controlFieldCombinations } from "../../frames/controlFieldCombinations";
import { NetConnectOpts } from "net";

export abstract class OutgoingAbstract extends BaseAbstract {
    protected readonly framesubType: IFrameType | UFrameType | SFrameType
    protected readonly frameType: FrameType
    protected kissConnection: KissConnection
    protected destinationCallsign: string
    protected destinationSsid: number
    protected destinationCommandBit: boolean;
    protected destinationReservedBitOne: boolean;
    protected destinationReservedBitTwo: boolean;
    protected sourceCallsign: string
    protected sourceSsid: number
    protected sourceCommandBit: boolean;
    protected sourceReservedBitOne: boolean;
    protected sourceReservedBitTwo: boolean;
    protected repeaters: Repeater[];
    // protected modulo: 8 | 128;
    protected binaryOne: string | undefined
    protected receivedSequence: number | undefined
    protected pollOrFinal: boolean;
    protected binaryTwo: string | undefined
    protected sendSequence: number | undefined
    protected pid: number
    protected payload: any | undefined

    constructor(args: OutgoingConstructor, frameType: IFrameType | UFrameType | SFrameType) {
        
        super()

        const found = controlFieldCombinations.find((cc) => {
            return cc.framesubType === frameType
        })

        if (found) {
            this.framesubType = found.framesubType
            this.frameType = found.frameType
            this.setCommandOrResponse(found.commandResponse)
            if (found.binaryOne) {
                this.binaryOne = found.binaryOne
            }
            if (found.binaryTwo) {
                this.binaryTwo = found.binaryTwo
            }
            if (found.pollOrFinal) {
                this.setPollOrFinal(found.pollOrFinal)
            }
        }
        else {
            throw new Error(`Invalid frame type of ${frameType} was passed to the super constructor.`)
        }

        this.setKissConnection(args.kissConnection)
            .setDestinationCallsign(args.destinationCallsign)
            .setDestinationSsid(args.destinationSsid ?? 0)
            .setDestinationReservedBitOne(args?.destinationReservedBitOne ?? false)
            .setDestinationReservedBitTwo(args?.destinationReservedBitTwo ?? false)
            .setSourceCallsign(args.sourceCallsign)
            .setSourceSsid(args.sourceSsid ?? 0)
            .setSourceReservedBitOne(args.sourceReservedBitOne ?? false)
            .setSourceReservedBitTwo(args.sourceReservedBitTwo ?? false)
            .setRepeaters(args?.repeaters ?? [])
            // .pollOrFinal ??= false // default false to prevent undefined errors
    }

    protected static encodeAddressField(callsign: string, commandOrHasBeenRepeated: boolean, reservedBitOne: boolean, reservedBitTwo: boolean, ssid: number, finalAddress: boolean): number[] {

        // no need to do preflight checks in this protected method, already done via the setters

        callsign = callsign.padEnd(6, ' ')

        // empty array to hold our encoded results
        let bytes: number[] = []

        // get ascii code for each character in the callsign, bit shift it left by one, and push
        for (let i = 0; i < callsign.length; i++) {
            bytes.push(callsign.charCodeAt(i) << 1)
        }

        // get binary representation of the ssid and pad it with zeros to a length of 4
        let ssidBinary = ssid.toString(2)
        while (ssidBinary.length < 4) {
            ssidBinary = '0' + ssidBinary
        }

        // empty string to hold our 1s and 0s
        let bits: string = ''
        bits += commandOrHasBeenRepeated ? '1' : '0' // if command or has been repeated, push 1
        bits += reservedBitOne ? '0' : '1' // if reserved bit is being used, push 0, otherwise push 1 when not in use. very counterintuitive
        bits += reservedBitTwo ? '0' : '1' // if reserved bit is being used, push 0, otherwise push 1 when not in use. very counterintuitive
        bits += ssidBinary
        bits += finalAddress ? '1' : '0' // used to indicate whether this is the last address or not

        bytes.push(parseInt(bits, 2))

        return bytes
    }

    protected static encodeControlField(bitsOne: string | number, pollFinal: boolean, bitsTwo: string | number): number {

        // no need to do preflight checks in this protected method, these values are internally calculated

        // if a number is passed in, convert it to a binary string and pad it to a length of 3
        if (typeof bitsOne === 'number') {
            bitsOne = bitsOne.toString(2)
            while (bitsOne.length < 3) {
                bitsOne = '0' + bitsOne
            }
        }

        if (typeof bitsTwo === 'number') {
            bitsTwo = bitsTwo.toString(2)
            while (bitsTwo.length < 3) {
                bitsTwo = '0' + bitsTwo
            }
            bitsTwo += '0' // if a number was passed in then it's an information frame, which gets an extra 0 at the end
        }

        return parseInt(bitsOne + (pollFinal ? '1' : '0') + bitsTwo, 2)
    }

    public getKissConnection(): KissConnection {
        return this.kissConnection
    }
    public setKissConnection(kissConnection: KissConnection | NetConnectOpts | SerialConstructor | MockModemConstructor): this {
        if (kissConnection instanceof KissConnection) {
            this.kissConnection = kissConnection
        }
        else {
            this.kissConnection = new KissConnection(kissConnection)
        }
        return this
    }

    public getDestinationCallsign(): string {
        return this.destinationCallsign
    }
    public setDestinationCallsign(callsign: string): this {
        // pre flight check
        if (callsign.length < 1 || callsign.length > 6) {
            throw new Error(`'${callsign}' is not a valid destination callsign. Callsigns must have a length from 1 to 6 characters, inclusive.`)
        }
        // uppercase per AX.25 spec, trim for prettiness, will repad at encode time
        this.destinationCallsign = callsign.toUpperCase().trim()
        return this
    }

    public getDestinationSsid(): number {
        return this.destinationSsid
    }
    public setDestinationSsid(ssid: number): this {
        // pre flight check
        if (ssid < 0 || ssid > 15) {
            throw new Error(`${ssid} is not a valid destination SSID. SSIDs must be between 0 and 15, inclusive.`)
        }
        this.destinationSsid = ssid
        return this
    }

    public isDestinationReservedBitOne(): boolean {
        return this.destinationReservedBitOne
    }
    public setDestinationReservedBitOne(on: boolean): this {
        this.destinationReservedBitOne = on
        return this
    }

    public isDestinationReservedBitTwo(): boolean {
        return this.destinationReservedBitTwo
    }
    public setDestinationReservedBitTwo(on: boolean): this {
        this.destinationReservedBitTwo = on
        return this
    }

    public getSourceCallsign(): string {
        return this.sourceCallsign
    }
    public setSourceCallsign(callsign: string): this {
        // pre flight check
        if (callsign.length < 1 || callsign.length > 6) {
            throw new Error(`'${callsign}' is not a valid source callsign. Callsigns must have a length from 1 to 6 characters, inclusive.`)
        }
        // uppercase per AX.25 spec, trim for prettiness, will repad at encode time
        this.sourceCallsign = callsign.toUpperCase().trim()
        return this
    }

    public getSourceSsid(): number {
        return this.sourceSsid
    }
    public setSourceSsid(ssid: number): this {
        // pre flight check
        if (ssid < 0 || ssid > 15) {
            throw new Error(`${ssid} is not a valid destination SSID. SSIDs must be between 0 and 15, inclusive.`)
        }

        this.sourceSsid = ssid
        return this
    }

    public isSourceReservedBitOne(): boolean {
        return this.sourceReservedBitOne
    }
    public setSourceReservedBitOne(on: boolean): this {
        this.sourceReservedBitOne = on
        return this
    }

    public isSourceReservedBitTwo(): boolean {
        return this.sourceReservedBitTwo
    }
    public setSourceReservedBitTwo(on: boolean): this {
        this.sourceReservedBitTwo = on
        return this
    }

    public getCommandOrResponse(): 'command' | 'response' { // property is ephemeral and computed
        // 1 and 0 respectively indicates a command frame
        if (this.destinationCommandBit && !this.sourceCommandBit) {
            return 'command'
        }
        // 0 and 1 respectively indicates a response frame
        else {
            return 'response'
        }
    }
    protected setCommandOrResponse(commandOrResponse: 'command' | 'response'): this {
        switch (commandOrResponse) {
            case 'command':
                this.destinationCommandBit = true // command bits are on the main abstract
                this.sourceCommandBit = false
                return this
            case 'response':
                this.destinationCommandBit = false
                this.sourceCommandBit = true
                return this
        }
    }
    public isCommand(): boolean {
        return this.getCommandOrResponse() === 'command'
    }
    public isResponse(): boolean {
        return this.getCommandOrResponse() === 'response'
    }

    public getRepeaters(): Repeater[] {
        return this.repeaters
    }
    /** The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined. */
    public setRepeaters(repeaters: Repeater[]): this {
        // decided not to truncate since some people are still doing more than 2 repeaters hops even though it's against AX.25 spec, plus it's a stupid rule

        // uppercase everything
        this.repeaters = repeaters.map((r) => {
            r.callsign = r.callsign.toUpperCase() // only repair this, others can be defaulted at encode time because they're not critical
            return r
        })
        return this
    }
    // convenience method to push a repeater
    public addRepeater(repeater: Repeater): this {
        // decided not to truncate since some people are still doing more than 2 repeaters hops even though it's against AX.25 spec, plus it's a stupid rule
        this.repeaters.push(repeater)
        return this
    }

    protected getModulo(): 8 | 128 {
        // if (this.internalFrameType === 'unnumbered') {
        //     return 8
        // }
        return this.modulo
    }

    protected getReceivedSequence(): number { // Doesn't exist on some frames. Only string to satisfy TS but in practice will only be exposed publicly returning number.
        return this.receivedSequence!
    }
    // protected abstract getReceivedSequence(): number
    protected setReceivedSequence(receivedSequence: number): this {
        if (receivedSequence < 0 || receivedSequence > 7) {
            throw new Error(`Received sequence ${receivedSequence} must be between 0 and 7, inclusive.`)
        }
        this.receivedSequence = receivedSequence
        return this
    }

    public isPollOrFinal(): boolean {
        return this.pollOrFinal
    }
    public setPollOrFinal(pollOrFinal: boolean): this { // not mutable on some frames
        this.pollOrFinal = pollOrFinal
        return this
    }

    protected getSendSequence(): number { // Doesn't exist on some frames. Only string to satisfy TS but in practice will only be exposed publicly returning number.
        return this.sendSequence!
    }
    protected setSendSequence(sendSequence: number): this {
        if (sendSequence < 0 || sendSequence > 7) {
            throw new Error(`Send sequence ${sendSequence} must be between 0 and 7, inclusive.`)
        }
        this.sendSequence = sendSequence
        return this
    }

    protected getPid(): number | undefined { // Doesn't exist on some frames.
        return this.pid
    }
    protected setPid(pid: number): this { // Doesn't exist on some frames.
        if (pid < 0) {
            throw new Error(`PID ${pid} is invalid. PID must be a positive number.`)
        }
        this.pid = pid
        return this
    }

    protected getPayload(): any { // Doesn't exist on some frames.
        return this.payload
    }
    /** Set the payload/body of your packet frame. Can be anything serializable, ex. a string, number, JSON, etc */
    protected setPayload(payload: any): this { // Doesn't exist on some frames.
        this.payload = payload
        return this
    }

    public getEncoded(): number[] {

        /**
         * Check if the user changed the frame type using a setter but failed to set a received and/or send sequence and throw an error if so.
         * All other properties should have been validated or set to a default through the setter methods.
         */
        // if ((this.frameType === 'information' || this.mainFrameType === 'supervisory') && typeof this.receivedSequence === 'undefined') {
        //     throw new Error(`No received sequence set. ${this.frameType} frames must have a received sequence. Call setReceivedSequence(number) or set one in the constructor.`)
        // }
        // if (this.frameType === 'information' && typeof this.sendSequence === 'undefined') {
        //     throw new Error(`No send sequence set. ${this.frameType} frames must have a send sequence. Call setSendSequence(number) or set one in the constructor.`)
        // }

        let encoded: number[] = []

        // encode and push destination address field
        encoded.push(...OutgoingAbstract.encodeAddressField(
            this.getDestinationCallsign(), // already uppercased via this.setDestinationCallsign() and gets padded in OutgoingFrame.encodeAddressField
            this.destinationCommandBit,
            this.isDestinationReservedBitOne(), // currently unused
            this.isDestinationReservedBitTwo(), // currently unused
            this.getDestinationSsid(),
            false // indicates that it's not the final address
        ))

        // encode and push source address field
        encoded.push(...OutgoingAbstract.encodeAddressField(
            this.getSourceCallsign(), // already uppercased via KissConnection.setMyCallsign() and gets padded in OutgoingFrame.encodeAddressField
            this.sourceCommandBit,
            this.isSourceReservedBitOne(),
            this.isSourceReservedBitTwo(), // if the payload is actually compressed or not
            this.getSourceSsid(),
            this.getRepeaters().length <= 0 // true if it's the last address aka no repeaters
        ))

        // encode repeaters, preflight checks already done via setter
        if (this.repeaters.length > 0) {
            for (let i = 0; i < this.repeaters.length; i++) {
                encoded.push(...
                    OutgoingAbstract.encodeAddressField(
                        this.repeaters[i].callsign,
                        this.repeaters[i].hasBeenRepeated ?? false, // indicates whether this repeater has already repeated the packet, this bit is flipped by the repeater
                        this.repeaters[i].reservedBitOne ?? false, // currently unused
                        this.repeaters[i].reservedBitTwo ?? false, // currently unused
                        this.repeaters[i].ssid,
                        i === this.repeaters.length - 1 // whether we are on the last repeater in the array or not
                    )
                )
            }
        }

        // encode control field
        if (this.frameType === 'information') {
            encoded.push(OutgoingAbstract.encodeControlField(this.getReceivedSequence(), this.isPollOrFinal(), this.getSendSequence()))
        }
        else if (this.frameType === 'unnumbered') {
            encoded.push(OutgoingAbstract.encodeControlField(this.binaryOne!, this.isPollOrFinal(), this.binaryTwo!))
        }
        else if (this.frameType === 'supervisory') {
            encoded.push(OutgoingAbstract.encodeControlField(this.getReceivedSequence(), this.isPollOrFinal(), this.binaryTwo!))
        }

        if (typeof this.pid !== 'undefined' && (this.framesubType === 'information' || this.framesubType === 'UI')) {
            encoded.push(this.pid)
        }

        //
        if (typeof this.payload !== 'undefined' && this.framesubType !== 'XID') {

            let stringPayload: string
            if (typeof this.payload !== 'string') {
                stringPayload = JSONB.stringify(this.payload)
            }
            else {
                stringPayload = this.payload
            }

            stringPayload.split('').map((c) => {
                encoded.push(c.charCodeAt(0))
            })

        }
        else if (this.framesubType === 'XID') {
            encoded.push(...this.payload)
        }

        // add header and footer to make AX.25 frame a KISS frame
        encoded.unshift(0x00) // indicates to TNC or software modem that this is a data frame
        encoded.unshift(0xC0) // FEND flag
        encoded.push(0xC0) // FEND flag

        return encoded
    }

    public send(): void {

        // 
        const encoded: number[] = this.getEncoded()

        // 
        if (encoded.length < 17) {
            throw new Error(`Encoded packet is below the AX.25 minimum of 136 bits. The current length is ${encoded.length * 8} bits.`)
        }

        // 
        this.kissConnection.getConnection().write(new Uint8Array(encoded))
    }

}