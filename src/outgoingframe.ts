import JSONB from 'json-buffer';
import { brotliCompressSync } from "zlib";
import { BaseFrame } from "./baseframe";
import { controlFieldCombinations } from "./controlfieldcombinations";
import { KissConnection } from "./kissconnection";
import type { ControlFieldCombination, MockModemKissConstructor, Repeater, SFrameType, SerialKissConstructor, TcpKissConstructor, UFrameType, IFrameType, OutgoingConstructor, InternalFrameType } from "./types";

export class OutgoingFrame extends BaseFrame {

    constructor(frameParams: OutgoingConstructor) {
        super()

        // responsible for the send() method and isCompressionEnabled()
        this.setKissConnection(frameParams.kissConnection)

        // destination subfield
        .setDestinationCallsign(frameParams.destinationCallsign) // required
        .setDestinationSsid(frameParams.destinationSsid) // required
        .setDestinationReservedBitOne(false) // reserved by this library for future use
        .setDestinationReservedBitTwo(false) // reserved by this library for future use

        // source subfield is base on KissConnection
        // source reserved bits are computed and not settable
        // command or response value is computed by setFrameType() and is not settable

        .setRepeaters(frameParams.repeaters ?? [])

        // sets frame type from control subfield and also sets internalFrameType, which is hidden from dev api for simplicity, also sets commandResponse appropriately
        .setFrameType(frameParams.frameType ?? 'UI')
        .setReceivedSequence(frameParams.receivedSequence ?? 0)
        .setSendSequence(frameParams.sendSequence ?? 0)

        .setPollOrFinal(frameParams.pollFinal ?? false)
        .setPayload(frameParams.payload)
        .setPid(frameParams.pid ?? 240)

    }

    public getDestinationCallsign(): string {
        return this.destinationCallsign
    }
    public getDestinationSsid(): number {
        return this.destinationSsid
    }
    protected isDestinationCommandBit(): boolean {
        return this.destinationCommandBit
    }

    // reserved by this library for future use
    protected isDestinationReservedBitOne(): boolean {
        return this.destinationReservedBitOne
    }

    // reserved by this library for future use
    protected isDestinationReservedBitTwo(): boolean {
        return this.destinationReservedBitTwo
    }
    public getSourceCallsign(): string {
        return this.getKissConnection().getMyCallsign()
    }
    public getSourceSsid(): number {
        return this.getKissConnection().getMySsid()
    }
    protected isSourceCommandBit(): boolean {
        return this.sourceCommandBit
    }
    public isCompressionEnabled(): boolean {
        return this.getKissConnection().isCompressionEnabled()
    }

    /**
     * Source address field reserved bit two is used by this library to indicate whether the outgoing frame will be compressed or not. 
     * Compression cannot be used on outgoing frames without an active KissConnection being set. Set a MockModem in the KissConnection constructor if you wish to use compression in testing.
     * @returns 
     */
    public isPayloadCompressed(): boolean {
        if (typeof this.getPayload !== 'undefined') {
            this.payloadCompressed = (JSONB.stringify(brotliCompressSync(this.getPayload())).length < JSONB.stringify(this.getPayload()).length) && this.isCompressionEnabled()
        }
        return this.payloadCompressed ??= false
    }

    //getCommandResponse is in base class because it's a computed value

    public getRepeaters(): Repeater[] {
        return this.repeaters
    }

    public getFrameType(): UFrameType | SFrameType | IFrameType {
        return this.frameType
    }

    public getReceivedSequence(): number | undefined {
        // hide set received sequence if frame type doesn't require it
        if (this.requiresReceivedSequence()) {
            return this.receivedSequence
        }
        return undefined
    }

    public isPollOrFinal(): boolean {
        return this.pollOrFinal
    }

    public getSendSequence(): number | undefined {
        // hide set send sequence if frame type doesn't require it
        if (this.requiresSendSequence()) {
            return this.sendSequence
        }
        return undefined
    }

    public getPid(): number | undefined {
        // hide set pid if frame type doesn't require it
        if (this.getFrameType() === 'UI' || this.getFrameType() === 'information') {
            return this.pid ??= 240
        }
        return undefined
    }

    /**
     * 
     * @returns 
     */
    public getPayload(): any {
        return this.payload
    }

    protected getInternalFrameType(): InternalFrameType {
        return this.internalFrameType
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

    public setDestinationCallsign(destinationCallsign: string): this {
        // pre flight check
        if (destinationCallsign.length < 1 || destinationCallsign.length > 6) {
            throw new Error(`'${destinationCallsign}' is not a valid destination callsign. Callsigns must have a length from 1 to 6 characters, inclusive.`)
        }
        // uppercase per AX.25 spec, trim for prettiness, will repad at encode time
        this.destinationCallsign = destinationCallsign.toUpperCase().trim()
        return this
    }

    protected setDestinationCommandBit(destinationCommandBit: boolean): this {
        this.destinationCommandBit = destinationCommandBit
        return this
    }

    public setDestinationSsid(destinationSsid: number): this {

        // pre flight check
        if (destinationSsid < 0 || destinationSsid > 15) {
            throw new Error(`${destinationSsid} is not a valid destination SSID. SSIDs must be between 0 and 15, inclusive.`)
        }

        this.destinationSsid = destinationSsid
        return this
    }

    // reserved by this library for future use
    protected setDestinationReservedBitOne(on: boolean): this {
        this.destinationReservedBitOne = on
        return this
    }

    // reserved by this library for future use
    protected setDestinationReservedBitTwo(on: boolean): this {
        this.destinationReservedBitTwo = on
        return this
    }

    // no setSourceCallsign because it's set in KissConnection

    protected setSourceCommandBit(sourceCommandBit: boolean): this {
        this.sourceCommandBit = sourceCommandBit
        return this
    }

    // no setSourceSsid because it's set in KissConnection

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

    protected setInternalFrameType(internalFrameType: InternalFrameType): this {
        this.internalFrameType = internalFrameType
        return this
    }

    public setFrameType(frameType: UFrameType | SFrameType | IFrameType): this {

        // find control field and corresponding frame type
        const found: ControlFieldCombination = controlFieldCombinations.find((cc) => {
            return cc.frameType === frameType
        })! // guaranteed to be found, all valid frameTypes aka control field types are listed in the db object

        this.frameType = found.frameType
        this.setInternalFrameType(found.internalFrameType)

        // set commandResponse toggle if it's included in the result
        switch (found.commandResponse) {
            case 'command':
                this.setDestinationCommandBit(true)
                this.setSourceCommandBit(false)
                break;
            case 'response':
                this.setDestinationCommandBit(false)
                this.setSourceCommandBit(true)
                break;
            case 'legacy':
                this.setDestinationCommandBit(false)
                this.setSourceCommandBit(false)
                break;
        }
        if (typeof found.pollFinal === 'boolean') { // test for presence of a boolean, not truthiness
            this.setPollOrFinal(found.pollFinal)
        }

        return this
    }

    public setReceivedSequence(receivedSequence: number): this {
        if (receivedSequence < 0 || receivedSequence > 7) {
            throw new Error(`Received sequence ${receivedSequence} must be between 0 and 7, inclusive.`)
        }
        this.receivedSequence = receivedSequence
        return this
    }

    public setPollOrFinal(pollOrFinal: boolean): this {
        this.pollOrFinal = pollOrFinal
        return this
    }

    public setSendSequence(sendSequence: number): this {
        if (sendSequence < 0 || sendSequence > 7) {
            throw new Error(`Send sequence ${sendSequence} must be between 0 and 7, inclusive.`)
        }
        this.sendSequence = sendSequence
        return this
    }

    public setPid(pid: number): this {
        if (pid < 0) {
            throw new Error(`PID ${pid} is invalid. PID must be a positive number.`)
        }
        return this
    }

    /** Set the payload/body of your packet frame. Can be anything serializable, ex. a string, number, JSON, etc */
    public setPayload(payload: any): this {
        this.payload = payload
        return this
    }

    protected isPayloadAllowed(): boolean {
        switch (this.getFrameType()) {
            case 'SABM':
            case 'DISC':
            case 'UA':
            case 'DM':
                return false
            default:
                return true
        }
    }

    public setKissConnection(kissConnection: KissConnection | TcpKissConstructor | SerialKissConstructor | MockModemKissConstructor): this {
        if (kissConnection instanceof KissConnection) {
            this.kissConnection = kissConnection
        }
        else {
            this.kissConnection = new KissConnection(kissConnection)
        }
        return this
    }

    public getEncoded(): number[] {

        /**
         * Check if the user changed the frame type using a setter but failed to set a received and/or send sequence and throw an error if so.
         * All other properties should have been validated or set to a default through the setter methods.
         */
        if (this.requiresReceivedSequence() && typeof this.getReceivedSequence() === 'undefined') {
            throw new Error(`No received sequence set. ${this.getFrameType()} frames must have a received sequence. Call OutgoingFrame.setReceivedSequence(number) or set one in the constructor.`)
        }
        if (this.requiresSendSequence() && typeof this.getSendSequence() === 'undefined') {
            throw new Error(`No send sequence set. ${this.getFrameType()} frames must have a send sequence.Call OutgoingFrame.setSendSequence(number) or set one in the constructor.`)
        }

        let encoded: number[] = []

        // encode and push destination address field
        encoded.push(...OutgoingFrame.encodeAddressField(
            this.getDestinationCallsign(), // already uppercased via this.setDestinationCallsign() and gets padded in OutgoingFrame.encodeAddressField
            this.isDestinationCommandBit(),
            this.isDestinationReservedBitOne(), // currently unused
            this.isDestinationReservedBitTwo(), // currently unused
            this.getDestinationSsid(),
            false // indicates that it's not the final address
        ))

        // encode and push source address field
        encoded.push(...OutgoingFrame.encodeAddressField(
            this.getSourceCallsign(), // already uppercased via KissConnection.setMyCallsign() and gets padded in OutgoingFrame.encodeAddressField
            this.isSourceCommandBit(),
            this.isCompressionEnabled(),
            this.isPayloadCompressed(), // if the payload is actually compressed or not
            this.getSourceSsid(),
            this.getRepeaters().length <= 0 // true if it's the last address aka no repeaters
        ))

        // encode repeaters, preflight checks already done via setter
        if (this.repeaters.length > 0) {
            for (let i = 0; i < this.repeaters.length; i++) {
                encoded.push(...
                    OutgoingFrame.encodeAddressField(
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

        const foundCombination = controlFieldCombinations.find((cc) => {
            return cc.frameType === this.getFrameType()
        })! // should definitely exist in some form

        // encode control field
        if (this.getInternalFrameType() === 'information') {
            encoded.push(OutgoingFrame.encodeControlField(this.getReceivedSequence()!, this.isPollOrFinal(), this.getSendSequence()!)) // ! ignore because already checked earlier and threw an exception if undefined
        }
        else if (this.getInternalFrameType() === 'unnumbered') {
                encoded.push(OutgoingFrame.encodeControlField(foundCombination.binaryOne!, this.isPollOrFinal(), foundCombination.binaryTwo!)) // ! ignore because it definitely exists on all unnumbered entries
            }
        else if (this.getInternalFrameType() === 'supervisory') {
            encoded.push(OutgoingFrame.encodeControlField(this.getReceivedSequence()!, this.isPollOrFinal(), foundCombination.binaryTwo!)) // ! ignore because already checked earlier and threw an exception if undefined
        }

        if (this.getFrameType() === 'information' || this.getFrameType() === 'UI') {
            encoded.push(this.getPid() ?? 240) // should return 240 if the above is true, but just in case and to make TS happy
        }
        
        //
        if (typeof this.getPayload() !== 'undefined' && this.isPayloadAllowed()) {

            let stringPayload: string = JSONB.stringify(this.getPayload())

            if (this.isPayloadCompressed()) {
                stringPayload = JSONB.stringify(brotliCompressSync(stringPayload))
            }
                
            stringPayload.split('').map((c) => {
                encoded.push(c.charCodeAt(0))
            })

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
        // this.kissConnection.getConnection().write(new Uint8Array(encoded))
        this.getKissConnection().getConnection().write(new Uint8Array(encoded))
    }

}