// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import util from "node:util"
import type { Repeater } from "../misc"

/** A union of strings representing the different subtypes of supervisory frames. */
export type SFrameType = 'RR' | 'RNR' | 'REJ' | 'SREJ'

/** A union of strings representing the different subtypes of unnumbered frames. */
export type UFrameType = 'SABME' | 'SABM' | 'DISC' | 'DM' | 'UA' | 'UI' | 'FRMR' | 'XID' | 'TEST'

/** A string representing the subtype of information frames. */
export type IFrameType = 'I'

/** A union of SFrameType, UFrameType, and IFrameType representing all of the different subtypes of frames. */
export type FrameSubtype = SFrameType | UFrameType | IFrameType

export abstract class BaseAbstract {

    /** Whether the frame is an unnumbered, supervisory, or information frame. */
    public abstract type: 'information' | 'supervisory' | 'unnumbered'

    /**
     * The specific type of frame being represented (UI, I, SABM, etc.)
     * @see {@link FrameSubtype FrameSubtype}
     * @returns the string name of the frame type.
     */
    public abstract subtype: FrameSubtype

    /**
     * The destination station's amateur radio callsign. Valid callsigns are 1 to 6 characters (inclusive), all uppercase.
     * @throws InvalidCallsignError on frames where this is mutable and an attempt was made to set an invalid callsign.
     */
    public abstract destinationCallsign: string

    /**
     * The destination station's SSID. Valid SSIDs are integers 0 to 15 (inclusive).
     * @throws InvalidSsidError on frames where this is mutable and an attempt was made to set an invalid SSID.
     */
    public abstract destinationSsid: number

    /** Determines in conjunction with the sourceCommandBit if the frame is a command, response, or legacy type frame. */
    public abstract destinationCommandBit: boolean

    /** Reserved bit that may be used in an agreed-upon manner in individual networks. */
    public abstract destinationReservedBitOne: boolean

    /** Reserved bit that may be used in an agreed-upon manner in individual networks. */
    public abstract destinationReservedBitTwo: boolean

    /**
     * The sending station's amateur radio callsign. Valid callsigns are 1 to 6 characters (inclusive), all uppercase.
     * @throws InvalidCallsignError on frames where this is mutable and an attempt was made to set an invalid callsign.
     */
    public abstract sourceCallsign: string

    /**
     * The sending station's SSID. Valid SSIDs are integers 0 to 15 (inclusive).
     * @throws InvalidSsidError on frames where this is mutable and an attempt was made to set an invalid SSID.
     */
    public abstract sourceSsid: number

    /** Determines in conjunction with the destinationCommandBit if the frame is a command, response, or legacy type frame. */
    public abstract sourceCommandBit: boolean

    /** Reserved bit that may be used in an agreed-upon manner in individual networks. */
    public abstract sourceReservedBitOne: boolean

    /** Reserved bit that may be used in an agreed-upon manner in individual networks. */
    public abstract sourceReservedBitTwo: boolean

    /**
     * Whether the frame is a command frame or a response frame if it is using the latest version of the AX.25 protocol. If not, then it is using the legacy protocol.
     * @returns string 'command', 'response', or 'legacy'
     */
    public abstract commandOrResponse: 'command' | 'response' | 'legacy'

    /** Whether the frame is a command frame. */
    public abstract isCommand: boolean

    /** Whether the frame is a response frame. */
    public abstract isResponse: boolean

    /** Whether the frame is a legacy frame. */
    public abstract isLegacy: boolean

    /**
     * The repeaters/digipeaters that the frame is addressed to travel through.
     * @see {@link Repeater Repeater}
     * @throws InvalidCallsignError and/or InvalidSsidError on frames where this is mutable and an attempt was made to set a repeater with an invalid callsign or SSID.
     * @returns an array of Repeater objects
     */
    public abstract repeaters: Repeater[]

    /**
     * Determines the number of outstanding information frames allowed per layer 2 connection at one time.
     * 
     * Only change this to 128 on supervisory and information frames when you are sure that you are using modulo 128, as setting it incorrectly will cause frames not to decode.
     * @default 8
     */
    public abstract modulo: 8 | 128

    /**
     * Exists on information and supervisory frames. Otherwise undefined. Prior to sending an information or supervisory frame,
     * this variable is updated to equal that of the received state variable, thus implicitly acknowledging the proper reception of all frames
     * up to and including receivedSequence - 1.
     * 
     * Valid values are integers 0 to 7 inclusive when using modulo 8, or integers 0 to 127 inclusive when using modulo 127.
     * 
     * @throws RangeError on frames where this is mutable and an attempt was made to set the number to a non-integer, a negative integer,
     * an integer greater than 7 when set to modulo 8, or an integer greater than 127 when set to modulo 128.
     */
    protected abstract receivedSequence: number | undefined

    /**
     * Used in all types of frames. The P/F bit is also used in a command (poll) mode to request an immediate reply to a frame.
     * The reply to this poll is indicated by setting the response (final) bit in the appropriate frame.
     */
    public abstract pollOrFinal: boolean

    /**
     * Found in the control field of all information frames. Otherwise undefined. It contains the sequence number of the information frame being sent.
     * Just prior to the transmission of the information frame, it is updated to equal the send state variable.
     * 
     * Valid values are integers 0 to 7 inclusive when using modulo 8, or integers 0 to 127 inclusive when using modulo 127.
     * 
     * @throws RangeError on frames where this is mutable and an attempt was made to set the number to a non-integer, a negative integer,
     * an integer greater than 7 when set to modulo 8, or an integer greater than 127 when set to modulo 128.
     */
    protected abstract sendSequence: number | undefined

    /**
     * A number indicating which layer 3 protocol is in use according to the AX25 spec. Found on information (I) and unnumbered information (UI) frames. Otherwise undefined.
     * 
     * Valid values are integers 0 to 255 inclusive.
     * 
     * @throws InvalidPidError on frames where this is mutable and an attempt was made to set the number to a non-integer or an integer that is less than 0 or greater than 255.
     * @returns a number corresponding to the layer 3 protocol in use. See AX.25 documentation for a key/value table.
     */
    protected abstract pid: number | undefined

    protected abstract payload: any

    /** Returns a JSON representation of the frame. */
    public toJSON() {
        return {
            type: this.type,
            subtype: this.subtype,
            destinationCallsign: this.destinationCallsign,
            destinationSsid: this.destinationSsid,
            destinationCommandBit: this.destinationCommandBit,
            destinationReservedBitOne: this.destinationReservedBitOne,
            destinationReservedBitTwo: this.destinationReservedBitTwo,
            sourceCallsign: this.sourceCallsign,
            sourceSsid: this.sourceSsid,
            sourceCommandBit: this.sourceCommandBit,
            sourceReservedBitOne: this.sourceReservedBitOne,
            sourceReservedBitTwo: this.sourceReservedBitTwo,
            commandOrResponse: this.commandOrResponse,
            isCommand: this.isCommand,
            isResponse: this.isResponse,
            isLegacy: this.isLegacy,
            repeaters: this.repeaters,
            modulo: this.modulo,
            receivedSequence: this.receivedSequence,
            pollOrFinal: this.pollOrFinal,
            sendSequence: this.sendSequence,
            pid: this.pid,
            payload: this.payload
        }
    }

    /** Returns a string representation of the frame. */
    public toString(): string {
        return JSON.stringify(this.toJSON())
    }

    /** @ignore */
    [util.inspect.custom] = () => {
        return this.toJSON()
    }

}