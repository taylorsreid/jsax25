import { KissConnection } from "kissconnection";

export interface ControlFieldCombination {
    frameType: FrameType ,
    frameSubtype: UFrameType | SFrameType | IFrameType,
    binaryOne?: string,
    binaryTwo?: string,
    commandOrResponse?: 'command' | 'response',
    pollOrFinal?: boolean,
    modulo: 8 | 128
}

interface BaseKissConstructor {
    txBaud: number
}

export interface TcpKissConstructor extends BaseKissConstructor {
    tcpHost: string
    tcpPort: number
}

export interface SerialKissConstructor extends BaseKissConstructor {
    /** The path to your TNC or software modem's serial port. No default. */
    serialPort: string,
    /** A custom baud rate for your TNC or software modem's serial port. Default 19200 if not defined. */
    serialBaud?: number
}

export interface MockKissConstructor extends BaseKissConstructor {
    /** Use a fake modem for running tests without a radio. Anything written to it will simply be printed to the console. */
    mock: boolean
}

/** A repeater used in a sent or received packet's repeater path. */
export interface Repeater {
    callsign: string,
    ssid: number
    hasBeenRepeated?: boolean
    reservedBitOne?: boolean,
    reservedBitTwo?: boolean,
}

export type FrameType = 'information' | 'supervisory' | 'unnumbered'
export type SFrameType = 'RR' | 'RNR' | 'REJ' | 'SREJ'
export type UFrameType = 'SABME' | 'SABM' | 'DISC' | 'DM' | 'UA' | 'UI' | 'FRMR' | 'XID' | 'TEST'
export type IFrameType = 'information'

export interface OutgoingConstructor {
    kissConnection: KissConnection
    destinationCallsign: string
    destinationSsid?: number
    destinationReservedBitOne?: boolean
    destinationReservedBitTwo?: boolean
    sourceCallsign: string
    sourceSsid?: number
    sourceReservedBitOne?: boolean
    sourceReservedBitTwo?: boolean
    repeaters?: Repeater[] // default []
}

export interface SFrameConstructor extends OutgoingConstructor {
    pollOrFinal: boolean
    modulo: 8 | 128
    receivedSequence: number
    commandOrResponse: 'command' | 'response'
}

export interface TestFrameConstructor extends OutgoingConstructor {
    commandOrResponse: 'command' | 'response'
    payload?: any
}

export interface XIDFrameConstructor extends OutgoingConstructor {
    commandOrResponse: 'command' | 'response'
}

export interface UIFrameConstructor extends OutgoingConstructor {
    commandOrResponse: 'command' | 'response'
    pollOrFinal: boolean
    payload: any
    pid: number
}

export interface IFrameConstructor extends OutgoingConstructor {
    modulo: 8 | 128
    receivedSequence: number
    pollOrFinal: boolean
    sendSequence: number
    pid: number
    payload: any
}

export interface hasPid {
    getPid(): number,
    setPid(pid: number): this
}

export interface hasPayload {
    getPayload(): any,
    setPayload(payload: any): this
}

export interface hasReceivedSequence {
    getReceivedSequence(): number
    setReceivedSequence(receivedSequence: number): this
}

export interface hasSendSequence {
    getSendSequence(): number
    setSendSequence(sendSequence: number): this
}

export interface mutableCommandOrResponse {
    getCommandOrResponse(): 'command' | 'response'
    setCommandOrResponse(commandOrResponse: "command" | "response"): this
}

export interface hasModulo {
    getModulo(): 8 | 128
    setModulo(modulo: 8 | 128): this
}