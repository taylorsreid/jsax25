import { KissConnection } from "kissconnection";
import { NetConnectOpts } from "net";

export interface ControlFieldCombination {
    frameType: FrameType ,
    framesubType: UFrameType | SFrameType | IFrameType,
    binaryOne?: string,
    binaryTwo?: string,
    commandResponse: 'command' | 'response',
    pollOrFinal?: boolean
}

export interface SerialConstructor {
    /** The path to your TNC or software modem's serial port. No default. */
    path: string,
    /** A custom baud rate for your TNC or software modem's serial port. Default 1200 (most common) if not defined. */
    baudRate?: number
}

export interface MockModemConstructor {
    /** Use a fake modem for running tests without a radio. Anything written to it will simply be printed to the console. */
    mockModem: boolean
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
    kissConnection: KissConnection | NetConnectOpts | SerialConstructor | MockModemConstructor
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
    modulo?: 8 | 128
    receivedSequence: number
}

export interface TestFrameConstructor extends OutgoingConstructor {
    payload?: any
}

export interface UIFrameConstructor extends OutgoingConstructor {
    commandOrResponse?: 'command' | 'response'
    pollOrFinal?: boolean
    payload?: any
    pid?: number, // will default to 240 in class if not set
}

export interface IFrameConstructor extends OutgoingConstructor {
    modulo?: 8 | 128
    receivedSequence: number
    pollOrFinal: boolean
    sendSequence: number
    pid?: number // will default to 240 in class if not set
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