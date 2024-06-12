import JSONB from 'json-buffer';
import { brotliCompressSync } from "zlib";
import { BaseFrame } from "./baseframe";
import { controlFieldCombinations } from "./controlfieldcombinations";
import { KissConnection } from "./kissconnection";
import { type OutgoingFrameConstructor, type CommandResponse, type ControlFieldCombination, type MockModemKissConstructor, type Repeater, type SFrameType, type SerialKissConstructor, type TcpKissConstructor, type UFrameType, type IFrameType } from "./types";

export class OutgoingFrame extends BaseFrame {

    constructor(args: OutgoingFrameConstructor) {
        super()

        // destination subfield
        if (args?.destinationCallsign) {
            this.setDestinationCallsign(args.destinationCallsign) // NO DEFAULT
        }
        this.setDestinationSsid(args.destinationSsid ?? 0)
            .setDestinationReservedBitOne(args.destinationReservedBitOne ?? false) // currently unused
            .setDestinationReservedBitTwo(args.destinationReservedBitTwo ?? false) // currently unused

        // source subfield
        if (args.sourceCallsign) {
            this.setSourceCallsign(args.sourceCallsign) // NO DEFAULT
        }
        this.setSourceSsid(args.sourceSsid ?? 0)
        // source reserved bits are computed and not settable

        // computed from each address subfield's control bits
        .setCommandResponse(args.commandResponse ?? 'command')

        // default to empty array to avoid undefined errors
        .setRepeaters(args.repeaters ?? [])

        // control subfield, actual U, I, or S frame is hidden from user
        .setFrameType(args.frameType ?? 'UI')
        if (typeof args.receivedSequence === 'number') { // must check type, not truthiness because 0 evaluates to false
            this.setReceivedSequence(args.receivedSequence)
        }
        this.setPollOrFinal(args.pollFinal ?? true) // should always be true for a UI
        if (typeof args.sendSequence === 'number') { // must check type, not truthiness because 0 evaluates to false
            this.setSendSequence(args.sendSequence)
        }

        // set but will be ignored if not the right frame type
        this.setPid(args.pid ?? 240)

        this.setPayload(args.payload)

        // for calling the send method
        if (args.kissConnection) {
            this.setKissConnection(args.kissConnection)
        }

    }

    public getDestinationCallsign(): string | undefined {
        return this.destinationCallsign
    }
    public getDestinationSsid(): number {
        return this.destinationSsid
    }
    public getDestinationCommandBit(): boolean {
        return this.destinationCommandBit
    }
    public getDestinationReservedBitOne(): boolean {
        return this.destinationReservedBitOne
    }
    public getDestinationReservedBitTwo(): boolean {
        return this.destinationReservedBitTwo
    }
    public getSourceCallsign(): string | undefined {
        return this.sourceCallsign
    }
    public getSourceSsid(): number {
        return this.sourceSsid
    }
    public getSourceCommandBit(): boolean {
        return this.sourceCommandBit
    }
    public isSourceAcceptingCompression(): boolean {
        return this.getKissConnection().getUseCompression() ?? false
    }

    /**
     * Source address field reserved bit two is used by this library to indicate whether the outgoing frame will be compressed or not. 
     * Compression cannot be used on outgoing frames without an active KissConnection being set. Set a MockModem in the KissConnection constructor if you wish to use compression in testing.
     * @returns 
     */
    public isPayloadCompressed(): boolean {
        return this.payloadIsCompressed ?? false
    }

    //getCommandResponse is in base class because it's a computed value

    public hasRepeaters(): boolean {
        return this.getRepeaters().length > 1
    }

    public getRepeaters(): Repeater[] {
        return this.repeaters
    }

    public getFrameType(): UFrameType | SFrameType | IFrameType | undefined {
        return this.frameType
    }

    public getReceivedSequence(): number | undefined {
        return this.receivedSequence
    }

    public isPollOrFinal(): boolean {
        return this.pollOrFinal
    }

    public getSendSequence(): number | undefined {
        return this.sendSequence
    }

    public getPid(): number | undefined {
        return this.pid
    }

    /**
     * 
     * @returns 
     */
    public getPayload(): any {
        return this.payload
    }

    private static encodeAddressField(callsign: string, commandOrHasBeenRepeated: boolean, reservedBitOne: boolean, reservedBitTwo: boolean, ssid: number, finalAddress: boolean): number[] {

        // no need to do preflight checks in this private method, already done via the setters

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

    private static encodeControlField(bitsOne: string | number, pollFinal: boolean, bitsTwo: string | number): number {

        // no need to do preflight checks in this private method, already done via the setters

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

        // uppercase per AX.25 spec, trim for prettiness for now even though we're going to pad it later
        this.destinationCallsign = destinationCallsign.toUpperCase().trim()
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

    public setDestinationReservedBitOne(on: boolean): this {
        this.destinationReservedBitOne = on
        return this
    }

    public setDestinationReservedBitTwo(on: boolean): this {
        this.destinationReservedBitTwo = on
        return this
    }

    public setSourceCallsign(sourceCallsign: string): this {

        // pre flight check
        if (sourceCallsign.length < 1 || sourceCallsign.length > 6) {
            throw new Error(`'${sourceCallsign}' is not a valid source callsign. Callsigns must have a length from 1 to 6 characters, inclusive.`) // TODO:
        }

        // uppercase per AX.25 spec, trim for prettiness for now even though we're going to pad it later
        this.sourceCallsign = sourceCallsign.toUpperCase().trim()
        return this
    }

    public setSourceSsid(sourceSsid: number): this {

        // pre flight check
        if (sourceSsid < 0 || sourceSsid > 15) {
            throw new Error(`${sourceSsid} is not a valid source SSID. SSIDs must be between 0 and 15, inclusive.`)
        }

        this.sourceSsid = sourceSsid
        return this
    }

    public setCommandResponse(commandResponse: CommandResponse): this {

        switch (commandResponse) {
            case 'command':
                this.destinationCommandBit = true
                this.sourceCommandBit = false
                break;
            case 'response':
                this.destinationCommandBit = false
                this.sourceCommandBit = true
                break;
            case 'legacy':
                this.destinationCommandBit = false
                this.sourceCommandBit = false
                break;
        }

        return this
    }

    /** The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined. */
    public setRepeaters(repeaters: Repeater[]): this {
        // decided not to truncate since some people are still doing more than 2 repeaters hops even though it's against AX.25 spec, plus it's a stupid rule
        this.repeaters = repeaters
        return this
    }

    public addRepeater(repeater: Repeater): this {
        // decided not to truncate since some people are still doing more than 2 repeaters hops even though it's against AX.25 spec, plus it's a stupid rule
        this.repeaters.push(repeater)
        return this
    }

    public setFrameType(frameType: UFrameType | SFrameType | IFrameType): this {

        // find control field and corresponding frame type
        const found: ControlFieldCombination = controlFieldCombinations.find((cc) => {
            return cc.frameType === frameType
        })! // guaranteed to be found, all valid control field types are listed in the db object

        this.frameType = found.frameType // bypass setter to avoid unnecessary additional call to the db object
        this.internalFrameType = found.internalFrameType // set corresponding frame type

        // set commandResponse toggle if it's included in the result
        if (found.commandResponse) {
            this.setCommandResponse(found.commandResponse) // make sure to call setter because it toggles the bits
        }
        if (found.pollFinal) {
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
        this.pid = pid
        return this
    }

    /** Set the payload/body of your packet frame. Can be anything serializable, ex. a string, number, JSON, etc */
    public setPayload(payload: any): this {
        this.payload = payload
        return this
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

        // check for undefined properties, all other properties should have been set in the constructor or by setter methods, setter methods validate input
        if (typeof this.destinationCallsign === 'undefined' || this.destinationCallsign.length < 1) {
            throw new Error('No destination callsign set. All frames must have a destination callsign.')
        }
        if (typeof this.sourceCallsign === 'undefined' || this.sourceCallsign.length < 1) {
            throw new Error('No source callsign set. All frames must have a source callsign.')
        }
        if (this.hasReceivedSequence() && typeof this.receivedSequence === 'undefined') {
            throw new Error(`No received sequence set. ${this.getFrameType()} frames must have a received sequence.`)
        }
        if (this.hasSendSequence() && typeof this.sendSequence === 'undefined') {
            throw new Error(`No send sequence set. ${this.getFrameType()} frames must have a send sequence.`)
        }

        // once again check that the user didn't set incompatible properties by calling the setter and using its side effects to make corrections
        this.setFrameType(this.frameType!) // should never be undefined since the constructor gives it a default

        // pad callsigns with spaces to a length of 6 per AX.25 spec, already uppercased via setters
        while (this.destinationCallsign.length < 6) {
            this.destinationCallsign += ' '
        }
        while (this.sourceCallsign.length < 6) {
            this.sourceCallsign += ' '
        }

        // stringify payload if it isn't a string already, wait until encode time so that type is maintained until now
        if (typeof this.getPayload() !== 'string') {
            this.payload = JSONB.stringify(this.getPayload())
        }

        // if compression is enabled and the destination supports it, compress the payload if it's shorter than the original
        if (
            typeof this.getPayload() !== 'undefined' &&
            this.isSourceAcceptingCompression() &&
            this.cacheManager.get(this.destinationCallsign, this.destinationSsid)?.supportsCompression
        ) {
            const compressedPayload: string = JSONB.stringify(brotliCompressSync(this.payload as string))
            if (compressedPayload.length < (this.payload as string).length) {
                this.setPayload(compressedPayload)
                this.payloadIsCompressed = true
            }
            else {
                this.payloadIsCompressed = false
            }
        }

        let encoded: number[] = []

        // encode and push destination address field
        encoded.push(...OutgoingFrame.encodeAddressField(
            this.getDestinationCallsign()!, // already checked for undefined earlier
            this.getDestinationCommandBit(),
            this.getDestinationReservedBitOne(), // currently unused
            this.getDestinationReservedBitTwo(), // currently unused
            this.getDestinationSsid(),
            false // indicates that it's not the final address
        ))

        // encode and push source address field
        encoded.push(...OutgoingFrame.encodeAddressField(
            this.getSourceCallsign()!, // already checked for undefined earlier
            this.getSourceCommandBit(),
            this.isSourceAcceptingCompression(), // 
            this.isPayloadCompressed(), // 
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
        if (this.internalFrameType === 'information') {
            encoded.push(OutgoingFrame.encodeControlField(this.getReceivedSequence()!, this.isPollOrFinal(), this.getSendSequence()!)) // ! ignore because already checked earlier
        }
        else if (this.internalFrameType === 'unnumbered') {
                encoded.push(OutgoingFrame.encodeControlField(foundCombination.binaryOne!, this.isPollOrFinal(), foundCombination.binaryTwo!)) // ! ignore because it definitely exists on all unnumbered entries
            }
        else if (this.internalFrameType === 'supervisory') {
            encoded.push(OutgoingFrame.encodeControlField(this.getReceivedSequence()!, this.isPollOrFinal(), foundCombination.binaryTwo!)) // ! ignore because it definitely exists on all supervisory entries
        }

        if (this.frameType === 'information' || this.frameType === 'UI') {
            encoded.push(this.getPid() ?? 240)
        }

        // encode payload
        if (
            typeof this.getPayload() !== 'undefined' &&
            this.getFrameType() !== 'SABM'
            //TODO: FIGURE OUT WHAT TYPES CAN'T HAVE PAYLOADS
        ) {
            (this.payload as string).split('').map((c) => {
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
        if (typeof this.kissConnection === 'undefined') {
            throw new Error('No valid KISS connection set to send frame with.')
        }

        // 
        const encoded: number[] = this.getEncoded()
        if (encoded.length < 17) {
            throw new Error(`Encoded packet is below the AX.25 minimum of 136 bits. The current length is ${encoded.length * 8} bits.`)
        }

        // 
        this.kissConnection.getConnection().write(new Uint8Array(encoded))
        // this.getKissConnection().getConnection().write(new Uint8Array(encoded))
    }

}