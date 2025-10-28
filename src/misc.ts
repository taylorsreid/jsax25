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

export function validateCallsign(callsign: string) {
    if (callsign.length < 1 || callsign.length > 6 || (callsign !== callsign.toUpperCase().trim())) {
        throw new Error(`'${callsign}' is not a valid callsign. Callsigns must have a length from 1 to 6 characters inclusive, be in all capitals, and contain no whitespace.`)
    }
}

export function validateSsid(ssid: number) {
    if (ssid < 0 || ssid > 15) {
        throw new Error(`${ssid} is not a valid SSID. SSIDs must be between 0 and 15 inclusive.`)
    }
}

export function validatePid(pid: number) {
    if (pid < 0 || pid > 255) {
        throw new Error(`${pid} is not a valid PID. PIDs must be greater than or equal to 0 and less than or equal to 255.`)
    }
}

export function resetRepeaters(repeaters: Repeater[]): Repeater[] {
    return structuredClone(repeaters).map((r) => {
        r.hasBeenRepeated = false
        return r
    })
}