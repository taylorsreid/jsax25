import JSONB from 'json-buffer';
import { BaseAbstract } from "./baseabstract";
import type { FrameType as MainFrameType, Repeater, SFrameType, UFrameType, IFrameType, ControlFieldCombination } from "../types";
import { controlFieldCombinations } from './controlFieldCombinations';

export class IncomingFrame extends BaseAbstract {
    protected destinationCallsign: string | undefined;
    protected destinationSsid: number | undefined;
    protected destinationCommandBit: boolean | undefined;
    protected destinationReservedBitOne: boolean | undefined;
    protected destinationReservedBitTwo: boolean | undefined;
    protected sourceCallsign: string | undefined;
    protected sourceSsid: number | undefined;
    protected sourceCommandBit: boolean | undefined;
    protected sourceReservedBitOne: boolean | undefined;
    protected sourceReservedBitTwo: boolean | undefined;
    protected repeaters: Repeater[] | undefined;
    protected modulo: 8 | 128
    protected receivedSequence: number | undefined
    protected pollOrFinal: boolean | undefined;
    protected sendSequence: number | undefined;
    protected frameType: MainFrameType | undefined;
    protected framesubType: IFrameType | UFrameType | SFrameType | undefined;
    protected pid: number | undefined;
    protected payload: any | undefined;
    protected readonly encoded: number[]

    constructor(encodedKissFrame: number[], modulo: 8 | 128 = 8) {
        super()

        //
        this.encoded = Array.from(encodedKissFrame)

        // 
        this.setModulo(modulo)

        // 
        if (this.encoded[0] === 0xC0) {
            this.encoded.shift()
        }
    }

    protected static getBinaryString(byte: number): string {
        // get the ssid byte in binary form
        let binary: string = byte.toString(2)
        while (binary.length < 8) { // pad the SSID byte with zeros to a length of 8
            binary = '0' + binary
        }
        return binary
    }

    protected static decodeCallsign(bytes: number[]): string {
        // counter and empty string for later
        let i = 0
        let callsign: string = ''

        // decode callsign, stop decoding if the character is a space or the ASCII null symbol
        while (i < 6 && bytes[i] >> 1 !== 0x00 && bytes[i] >> 1 !== 0x20) {
            callsign += String.fromCharCode(bytes[i] >> 1); // AX.25 addresses are encoded with bit shifting to make room for a final bit on the final byte, yes it's dumb
            i++
        }

        return callsign
    }

    /** Get the destination amateur radio callsign. */
    public getDestinationCallsign(): string {
        if (typeof this.destinationCallsign === 'undefined') {
            this.destinationCallsign = IncomingFrame.decodeCallsign(this.encoded.slice(1, 7))
        }
        return this.destinationCallsign
    }

    public isDestinationCommandBit(): boolean {
        if (typeof this.destinationCommandBit === 'undefined') {
            this.destinationCommandBit = IncomingFrame.getBinaryString(this.encoded[7])[0] === '1'
        }
        return this.destinationCommandBit
    }

    // reserved by this library for future use
    public isDestinationReservedBitOne(): boolean {
        if (typeof this.destinationReservedBitOne === 'undefined') {
            this.destinationReservedBitOne = IncomingFrame.getBinaryString(this.encoded[7])[1] === '0'
        }
        return this.destinationReservedBitOne
    }

    // reserved by this library for future use
    public isDestinationReservedBitTwo(): boolean {
        if (typeof this.destinationReservedBitTwo === 'undefined') {
            this.destinationReservedBitTwo = IncomingFrame.getBinaryString(this.encoded[7])[2] === '0'
        }
        return this.destinationReservedBitTwo
    }

    /** Get the destination's SSID. */
    public getDestinationSsid(): number {
        if (typeof this.destinationSsid === 'undefined') {
            this.destinationSsid = parseInt(IncomingFrame.getBinaryString(this.encoded[7]).slice(3, 7), 2)
        }
        return this.destinationSsid
    }

    /** Get the sender's amateur radio callsign. */
    public getSourceCallsign(): string {
        if (typeof this.sourceCallsign === 'undefined') {
            this.sourceCallsign = IncomingFrame.decodeCallsign(this.encoded.slice(8, 14))
        }
        return this.sourceCallsign
    }

    public isSourceCommandBit(): boolean {
        if (typeof this.sourceCommandBit === 'undefined') {
            this.sourceCommandBit = IncomingFrame.getBinaryString(this.encoded[14])[0] === '1'
        }
        return this.sourceCommandBit
    }

    public isSourceReservedBitOne(): boolean {
        if (typeof this.sourceReservedBitOne === 'undefined') {
            this.sourceReservedBitOne = IncomingFrame.getBinaryString(this.encoded[14])[1] === '0'
        }
        return this.sourceReservedBitOne
    }
    public isSourceReservedBitTwo(): boolean {
        if (typeof this.sourceReservedBitTwo === 'undefined') {
            this.sourceReservedBitTwo = IncomingFrame.getBinaryString(this.encoded[14])[2] === '1'
        }
        return this.sourceReservedBitTwo
    }

    // TODO: compression moved to back burner
    // public isCompressionEnabled(): boolean {
    //     if (typeof this.compressionEnabled === 'undefined') {
    //         this.compressionEnabled = IncomingFrame.getBinaryString(this.encoded[14])[1] === '0'
    //         this.cacheManager.set(this.getSourceCallsign(), this.getSourceSsid(), { supportsCompression: this.compressionEnabled })
    //     }
    //     return this.compressionEnabled
    // }

    // /**
    //  * Source address field reserved bit two is used by this library to indicate whether the outgoing frame is compressed or not.
    //  * @returns A boolean representation of whether the bit is toggled on.
    //  */
    // public isPayloadCompressed(): boolean {
    //     if (typeof this.payloadCompressed === 'undefined') {
    //         this.payloadCompressed = IncomingFrame.getBinaryString(this.encoded[14])[2] === '0' && this.isCompressionEnabled() // double check both bits to prevent false positives
    //     }
    //     return this.payloadCompressed
    // }

    /** Get the sender's SSID. */
    public getSourceSsid(): number {
        if (typeof this.sourceSsid === 'undefined') {
            this.sourceSsid = parseInt(IncomingFrame.getBinaryString(this.encoded[14]).slice(3, 7), 2)
        }
        return this.sourceSsid
    }

    /**
     * Get whether the command is a command frame or a response frame if it is using the latest version of the AX.25 protocol. If not, then it is using the legacy protocol.
     * @returns string 'command', 'response', or 'legacy'
     */
    public getCommandOrResponse(): 'command' | 'response' | 'legacy' { // property is ephemeral and computed
        // 1 and 0 respectively indicates a command frame
        if (this.isDestinationCommandBit() && !this.isSourceCommandBit()) {
            return 'command'
        }
        // 0 and 1 respectively indicates a response frame
        else if (!this.isDestinationCommandBit() && this.isSourceCommandBit()) {
            return 'response'
        }
        // 00 or 11 are used by older versions of the protocol
        else {
            return 'legacy'
        }
    }
    public isCommand(): boolean {
        return this.isDestinationCommandBit() && !this.isSourceCommandBit()
    }
    public isResponse(): boolean {
        return !this.isDestinationCommandBit() && this.isDestinationCommandBit()
    }
    public isLegacy(): boolean {
        return !this.isCommand() && !this.isResponse()
    }

    public getRepeaters(): Repeater[] {
        if (typeof this.repeaters === 'undefined') {
            this.repeaters = [] // initialize
            let position: number = 14
            while (this.encoded[position].toString(2).endsWith('0')) {
                this.repeaters.push({
                    callsign: IncomingFrame.decodeCallsign(this.encoded.slice(position + 1, position + 7)),
                    ssid: parseInt(IncomingFrame.getBinaryString(this.encoded[position + 7]).slice(3, 7), 2),
                    hasBeenRepeated: IncomingFrame.getBinaryString(this.encoded[position + 7]).startsWith('1')
                })
                position += 7
            }
        }
        return this.repeaters
    }

    private getControlFieldBits(): string {
        return IncomingFrame.getBinaryString(this.encoded[15 + (7 * this.getRepeaters().length)])
    }

    private getFrameType(): MainFrameType {
        if (typeof this.frameType === 'undefined') {
            const cfb: string = this.getControlFieldBits()
            if (cfb.endsWith('11')) {
                this.frameType = 'unnumbered'
            }
            else if (cfb.endsWith('01')) {
                this.frameType = 'supervisory'
            }
            else {
                this.frameType = 'information'
            }
        }
        return this.frameType
    }

    public getModulo(): 8 | 128 | undefined {
        if (this.getFrameType() === 'unnumbered') {
            return undefined
        }
        return this.modulo
    }

    public getFrameSubtype(): UFrameType | SFrameType | IFrameType {
        if (typeof this.framesubType === 'undefined') {
            const cfb: string = this.getControlFieldBits()
            this.pollOrFinal ??= cfb[3] === '1' // might as well while we're here
            if (this.getFrameType() === 'unnumbered') {
                const found: ControlFieldCombination = controlFieldCombinations.find((cc) => {
                    return cc.binaryOne === cfb.slice(0, 3) && cc.binaryTwo === cfb.slice(4)
                })! // all valid frame types are listed
                this.framesubType = found.framesubType
            }
            else if (this.getFrameType() === 'supervisory') {
                const found: ControlFieldCombination = controlFieldCombinations.find((cc) => {
                    return cc.binaryTwo === cfb.slice(4, 8)
                })! // all valid frame types are listed
                this.framesubType = found.framesubType
                this.receivedSequence ??= parseInt(cfb.slice(0, 3), 2) // while we're here
                // no send sequence on supervisory frames
            }
            else {
                this.framesubType = 'information'
                this.receivedSequence ??= parseInt(cfb.slice(0, 3), 2)  // while we're here
                this.sendSequence ??= parseInt(cfb.slice(4, 7), 2)  // while we're here
            }
        }
        return this.framesubType // it has to be one of the 3
    }

    public getReceivedSequence(): number | undefined {
        if (typeof this.receivedSequence === 'undefined' && this.getFrameType() !== 'unnumbered') { // received sequences only exist on the other 2 internal frame types
            this.receivedSequence = parseInt(this.getControlFieldBits().slice(0, 3), 2)
        }
        return this.receivedSequence
    }

    public isPollOrFinal(): boolean {
        if (typeof this.pollOrFinal === 'undefined') {
            this.pollOrFinal = this.getControlFieldBits()[3] === '1'
        }
        return this.pollOrFinal
    }

    public getSendSequence(): number | undefined {
        if (typeof this.sendSequence === 'undefined' && this.getFrameSubtype() === 'information') { // send sequences only exist on I frames
            this.sendSequence = parseInt(this.getControlFieldBits().slice(4, 7), 2)
        }
        return this.sendSequence
    }

    /**
     * Number indicating which layer 3 protocol is in use, default is 240 which is none.
     * @returns a number corresponding to the layer 3 protocol in use. See AX.25 documentation for a key: value table.
     */
    public getPid(): number | undefined {
        if (typeof this.pid === 'undefined' && (this.getFrameSubtype() === 'information' || this.getFrameSubtype() === 'UI')) { // only exist on I and UI frames
            this.pid = this.encoded[16 + (7 * this.getRepeaters().length)]
        }
        return this.pid
    }

    public getPayload(): any | undefined {
        if (typeof this.payload === 'undefined' && (this.getFrameSubtype() === 'UI' || this.getFrameSubtype() === 'information' || this.getFrameSubtype() === 'TEST')) { // only exist on I and UI frames

            this.payload = ''

            // 
            let position: number = ((this.getFrameSubtype() === 'information' || this.getFrameSubtype() === 'UI') ? 17 : 16) + (7 * this.getRepeaters().length) // if no repeaters then position is 16, if 1 repeater then position is 23, if 2 repeaters then position is 30

            // 
            this.payload = String.fromCharCode(...this.encoded.slice(position, this.encoded.lastIndexOf(0xC0)))

            // TODO: compression moved to back burner
            // if (this.isPayloadCompressed()) { // getPayloadIsCompressed() actually double checks both bits to prevent false positives
            //     try {
            //         this.payload = brotliDecompressSync(JSONB.parse(this.payload)).toString()
            //         this.cacheManager.set(this.getDestinationCallsign(), this.getDestinationSsid(), { supportsCompression: true })
            //     }
            //     catch (error) { // if decompression fails then something else must be using the reserved bits, save that to the cache to prevent sending compressed data to a client that doesn't support it
            //         this.cacheManager.set(this.getDestinationCallsign(), this.getDestinationSsid(), { supportsCompression: false })
            //     }
            // }

            // if the decoded payload starts with JSONish characters, try parsing it. Do not parse information frames because multiple frame payloads need to be concatenated first
            if (((this.payload as string).startsWith('{') || (this.payload as string).startsWith('[')) && this.getFrameSubtype() !== 'information') {
                try {
                    this.payload = JSONB.parse(this.payload as string)
                } catch (error) {
                    // it was probably just a string that started with { or [, so we'll continue
                }
            }
            // if it's a number as a string, parse it to a number, again ignore it if it's an information frame because we need to concatenate the payloads first
            else if (!isNaN(this.payload as number) && this.getFrameSubtype() !== 'information') {
                if ((this.payload as string).includes('.')) {
                    this.payload = parseFloat(this.payload as string)
                }
                else {
                    this.payload = parseInt(this.payload as string)
                }
            }
        }
        return this.payload
    }

    public getEncoded(): number[] {
        return this.encoded
    }

    public toJSON() {
        return {
            destinationCallsign: this.getDestinationCallsign(),
            destinationSsid: this.getDestinationSsid(),
            destinationReservedBitOne: this.isDestinationReservedBitOne(),
            destinationReservedBitTwo: this.isDestinationReservedBitTwo(),
            sourceCallsign: this.getSourceCallsign(),
            sourceSsid: this.getSourceSsid(),
            sourceReservedBitOne: this.isSourceReservedBitOne(),
            sourceReservedBitTwo: this.isSourceReservedBitTwo(),
            commandOrResponse: this.getCommandOrResponse(),
            repeaters: this.getRepeaters(),
            modulo: this.getModulo(),
            receivedSequence: this.getReceivedSequence(),
            pollOrFinal: this.isPollOrFinal(),
            sendSequence: this.getSendSequence(),
            frameType: this.getFrameType(),
            frameSubtype: this.getFrameSubtype(),
            pid: this.getPid(),
            payload: this.getPayload()
        }
    }

    // public createResponse(args?: OutgoingParams): OutgoingFrame {

    //     if (typeof this.kissConnection === 'undefined') {
    //         throw new Error(`You must have a valid KissConnection set to call IncomingFrame.createResponse()`)
    //     }

    //     switch (this.getFrameType()) {
    //         case 'UI': // let's be real, most people just want APRS

    //             break;
    //         case 'SABM'

    //         // default RNR because it's probably modulo 128 which isn't supported yet
    //     }

    //     args ??= {}
    //     args.destinationCallsign ??= this.getSourceCallsign(),
    //     args.destinationSsid ??= this.getSourceSsid(),
    //     args.sourceCallsign ??= this.getKissConnection().getMyCallsign(),
    //     args.sourceSsid ??= this.getKissConnection().getMySsid(),
    //     args.repeaters ??= structuredClone(this.getRepeaters()).map((r) => { // if you don't use structured clone, it'll mutate the original and cause the tests to fail
    //         r.hasBeenRepeated = false
    //         return r
    //     })
    //     args.kissConnection ??= this.getKissConnection()
    //     return this.getKissConnection().createOutgoing(args)
    // }

}