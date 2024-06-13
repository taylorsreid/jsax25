import JSONB from 'json-buffer';
import { brotliDecompressSync } from "zlib";
import { BaseFrame } from "./baseframe";
import { controlFieldCombinations } from "./controlfieldcombinations";
import type { ControlFieldCombination, InternalFrameType, Repeater, SFrameType, UFrameType, IFrameType, TcpKissConstructor, SerialKissConstructor, MockModemKissConstructor } from "./types";
import { KissConnection } from 'kissconnection';

export class IncomingFrame extends BaseFrame {

    protected readonly encoded: number[]

    constructor(encodedKissFrame: number[], kissConnection?: KissConnection | TcpKissConstructor | SerialKissConstructor | MockModemKissConstructor) {
        super()

        //
        this.encoded = Array.from(encodedKissFrame)

        // 
        if (kissConnection) {
            if (kissConnection instanceof KissConnection) {
                this.kissConnection = kissConnection
            }
            else {
                this.kissConnection = new KissConnection(kissConnection)
            }
        }

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

    public getEncoded(): number[] {
        return this.encoded
    }

    /** Get the destination amateur radio callsign. */
    public getDestinationCallsign(): string {
        if (typeof this.destinationCallsign === 'undefined') {
            this.destinationCallsign = IncomingFrame.decodeCallsign(this.encoded.slice(1, 7))
        }
        return this.destinationCallsign
    }

    protected isDestinationCommandBit(): boolean {
        if (typeof this.destinationCommandBit === 'undefined') {
            this.destinationCommandBit = IncomingFrame.getBinaryString(this.encoded[7])[0] === '1'
        }
        return this.destinationCommandBit
    }

    // reserved by this library for future use
    protected isDestinationReservedBitOne(): boolean {
        if (typeof this.destinationReservedBitOne === 'undefined') {
            this.destinationReservedBitOne = IncomingFrame.getBinaryString(this.encoded[7])[1] === '0'
        }
        return this.destinationReservedBitOne
    }

    // reserved by this library for future use
    protected isDestinationReservedBitTwo(): boolean {
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

    protected isSourceCommandBit(): boolean {
        if (typeof this.sourceCommandBit === 'undefined') {
            this.sourceCommandBit = IncomingFrame.getBinaryString(this.encoded[14])[0] === '1'
        }
        return this.sourceCommandBit
    }

    public isCompressionEnabled(): boolean {
        if (typeof this.compressionEnabled === 'undefined') {
            this.compressionEnabled = IncomingFrame.getBinaryString(this.encoded[14])[1] === '0'
            this.cacheManager.set(this.getSourceCallsign(), this.getSourceSsid(), { supportsCompression: this.compressionEnabled })
        }
        return this.compressionEnabled
    }

    /**
     * Source address field reserved bit two is used by this library to indicate whether the outgoing frame is compressed or not.
     * @returns A boolean representation of whether the bit is toggled on.
     */
    public isPayloadCompressed(): boolean {
        if (typeof this.payloadCompressed === 'undefined') {
            this.payloadCompressed = IncomingFrame.getBinaryString(this.encoded[14])[2] === '0' && this.isCompressionEnabled() // double check both bits to prevent false positives
        }
        return this.payloadCompressed
    }

    /** Get the sender's SSID. */
    public getSourceSsid(): number {
        if (typeof this.sourceSsid === 'undefined') {
            this.sourceSsid = parseInt(IncomingFrame.getBinaryString(this.encoded[14]).slice(3, 7), 2)
        }
        return this.sourceSsid
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
                // console.log(IncomingFrame.getBinaryString(this.encoded[position + 7]))
                // console.log(IncomingFrame.getBinaryString(this.encoded[position + 7]).startsWith('1'))
                position += 7
            }
        }
        return this.repeaters
    }

    protected getControlFieldBits(): string {
        return IncomingFrame.getBinaryString(this.encoded[15 + (7 * this.getRepeaters().length)])
    }

    protected getInternalFrameType(): InternalFrameType {
        if (typeof this.internalFrameType === 'undefined') {
            switch (this.getControlFieldBits().slice(6)) {
                case '11':
                    this.internalFrameType = 'unnumbered'
                    break;
                case '01':
                    this.internalFrameType = 'supervisory'
                    break
                default:
                    this.internalFrameType = 'information'
                    break;
            }
        }
        return this.internalFrameType
    }

    public getFrameType(): UFrameType | SFrameType | IFrameType  {
        if (typeof this.frameType === 'undefined') {
            const controlFieldBits: string = this.getControlFieldBits()
            if (this.getInternalFrameType() === 'unnumbered') {
                const found: ControlFieldCombination | undefined = controlFieldCombinations.find((cc) => {
                    return cc.binaryOne === controlFieldBits.slice(0, 3) && cc.binaryTwo === controlFieldBits.slice(4)
                })! // all valid frame types are listed
                this.frameType = found.frameType
            }
            else if (this.getInternalFrameType() === 'supervisory') {
                const found: ControlFieldCombination | undefined = controlFieldCombinations.find((cc) => {
                    return cc.binaryTwo === controlFieldBits.slice(4)
                })! // all valid frame types are listed
                this.frameType = found.frameType
                this.receivedSequence = parseInt(controlFieldBits.slice(0, 3), 2)
            }
            else if (this.getInternalFrameType() === 'information') {
                this.frameType = 'information'
            }
        }
        return this.frameType! // it has to be one of the 3
    }

    public getReceivedSequence(): number | undefined {
        // if (typeof this.pollOrFinal === 'undefined' && this.internalFrameType !== 'unnumbered') {
        if (this.getInternalFrameType() !== 'unnumbered') {
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
        if (typeof this.sendSequence === 'undefined' && this.getFrameType() === 'information') {
            this.sendSequence = parseInt(this.getControlFieldBits().slice(4, 7), 2)
        }
        return this.sendSequence
    }

    /**
     * Number indicating which layer 3 protocol is in use, default is 240 which is none.
     * @returns a number corresponding to the layer 3 protocol in use. See AX.25 documentation for a key: value table.
     */
    public getPid(): number | undefined {
        if (typeof this.pid === 'undefined' && (this.getFrameType() === 'information' || this.getFrameType() === 'UI')) {
            this.pid = this.encoded[16 + (7 * this.getRepeaters().length)]
        }
        return this.pid
    }

    public getPayload(): any {
        if (typeof this.payload === 'undefined') {

            this.payload = ''

            // 
            let position: number = ((this.getFrameType() === 'information' || this.getFrameType() === 'UI') ? 17 : 16) + (7 * this.getRepeaters().length) // if no repeaters then position is 16, if 1 repeater then position is 23, if 2 repeaters then position is 30

            // 
            this.payload = String.fromCharCode(...this.encoded.slice(position, this.encoded.lastIndexOf(0xC0)))

            // 
            if (this.isPayloadCompressed()) { // getPayloadIsCompressed() actually double checks both bits to prevent false positives
                try {
                    this.payload = brotliDecompressSync(JSONB.parse(this.payload)).toString()
                    this.cacheManager.set(this.getDestinationCallsign(), this.getDestinationSsid(), { supportsCompression: true })
                }
                catch (error) { // if decompression fails then something else must be using the reserved bits, save that to the cache to prevent sending compressed data to a client that doesn't support it
                    this.cacheManager.set(this.getDestinationCallsign(), this.getDestinationSsid(), { supportsCompression: false })
                }
            }

            // if the decoded payload starts with JSONish characters, try parsing it. Do not parse information frames because multiple frame payloads need to be concatenated first
            if (((this.payload as string).startsWith('{') || (this.payload as string).startsWith('[')) && this.getFrameType() !== 'information') {
                try {
                    this.payload = JSONB.parse(this.payload as string)
                } catch (error) {
                    // it was probably just a string that started with { or [, so we'll continue
                }
            }
            // if it's a number as a string, parse it to a number, again ignore it if it's an information frame because we need to concatenate the payloads first
            else if (!isNaN(this.payload as number) && this.getFrameType() !== 'information') {
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