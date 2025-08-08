/** A repeater used in a sent or received packet's repeater path. */
export interface Repeater {
    callsign: string,
    ssid: number
    hasBeenRepeated?: boolean
    reservedBitOne?: boolean,
    reservedBitTwo?: boolean,
}

export interface hasPid {
    get pid(): number
    set pid(pid: number)
}

export interface hasPayload {
    get payload(): any
    set payload(payload: any)
}

export interface hasReceivedSequence {
    get receivedSequence(): number
    set receivedSequence(receivedSequence: number)
}

export interface hasSendSequence {
    get sendSequence(): number
    set sendSequence(sendSequence: number)
}

export interface mutableCommandOrResponse {
    set commandOrResponse(commandOrResponse: "command" | "response")
}

export interface mutablePollOrFinal {
    set pollOrFinal(pollOrFinal: boolean)
}

export interface mutableModulo {
    set modulo(modulo: 8 | 128)
}

export const DEFAULT_SERIAL_BAUD = 19200

export function validateCallsign(callsign: string) {
    if (callsign.length < 1 || callsign.length > 6) {
        throw new Error(`'${callsign}' is not a valid callsign. Callsigns must have a length from 1 to 6 characters inclusive.`)
    }
}

export function validateSsid(ssid: number) {
    if (ssid < 0 || ssid > 15) {
        throw new Error(`${ssid} is not a valid SSID. SSIDs must be between 0 and 15 inclusive.`)
    }
}

export function validatePid(pid: number) {
    if (pid < 0) {
        throw new Error(`${pid} is not a valid PID. PIDs must be greater than or equal to 0.`)
    }
}

export function validateBaudRate(bd: unknown): number {
    if ([null, undefined].includes(bd as null | undefined)) {
        return DEFAULT_SERIAL_BAUD
    }

    const bdNumber = Number(bd)

    // TODO: We could potentially check the baud rate against the list of standard ones,
    // but for now it's probably fine to must make sure it's a positive integer
    if (Number.isSafeInteger(bdNumber) && bdNumber > 0) {
        return bdNumber
    }

    throw new Error(`Invalid baud rate: ${bd}`);
}

export function resetRepeaters(repeaters: Repeater[] | undefined): Repeater[] {
    if (repeaters) {
        return repeaters.map((r) => {
            validateCallsign(r.callsign)
            validateSsid(r.ssid)
            r.hasBeenRepeated = false
            return r
        })
    }
    return []
}

export function validateT1(ms: number) {
    if (ms < 0) {
        throw new Error(`${ms} is not a valid t1 value. T1 must be an integer greater than or equal to 0 expressed in milliseconds.`)
    }
}
