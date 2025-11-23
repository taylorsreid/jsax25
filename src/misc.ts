// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/** A repeater/digipeater used in a sent or received packet's repeater path. */
export interface Repeater {
    /** The amateur radio callsign of the repeater/digipeater. Valid callsigns are 1 to 6 characters (inclusive). */
    callsign: string,

    /** The SSID of the repeater/digipeater. Valid SSIDs are integers 0 to 15 (inclusive). */
    ssid: number

    /** 
     * A bit indicating whether this repeater/digipeater has already repeated this packet. The named repeater/digipeater should flip this bit prior to repeating packets addressed to them.
     * @default false
     */
    hasBeenRepeated?: boolean

    /**
     * Reserved bit that may be used in an agreed-upon manner in individual networks.
     * @default false
     */
    reservedBitOne?: boolean,

    /**
     * Reserved bit that may be used in an agreed-upon manner in individual networks.
     * @default false
     */
    reservedBitTwo?: boolean,
}

export function validateCallsign(callsign: string) {
    if (callsign.length < 1 || callsign.length > 6 || (callsign !== callsign.toUpperCase().trim())) {
        class InvalidCallsignError extends Error {}
        throw new InvalidCallsignError(`'${callsign}' is not a valid callsign. Callsigns must have a length from 1 to 6 characters inclusive and be in all capitals.`)
    }
}

export function validateSsid(ssid: number) {
    if (!Number.isInteger(ssid) || ssid < 0 || ssid > 15) {
        class InvalidSsidError extends Error {}
        throw new InvalidSsidError(`${ssid} is not a valid SSID. SSIDs must be integers between 0 and 15 inclusive.`)
    }
}

export function validatePid(pid: number) {
    if (!Number.isInteger(pid) || pid < 0 || pid > 255) {
        class InvalidPidError extends Error {}
        throw new InvalidPidError(`${pid} is not a valid PID. PIDs must be integers between 0 and 255 inclusive.`)
    }
}

export function resetRepeaters(repeaters: Repeater[]): Repeater[] {
    return structuredClone(repeaters).map((r) => {
        r.hasBeenRepeated = false
        return r
    })
}