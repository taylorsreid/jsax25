import { KissConnection } from "kissconnection";

/**
 *
 */
export interface CacheItem {
    supportsCompression: boolean;
    // modulo?: 8 | 128; TODO: implement in the future
}

/**
 *
 */
export interface ControlFieldCombination {
    internalFrameType: InternalFrameType
    frameType: SFrameType | UFrameType | IFrameType
    binaryOne?: string
    binaryTwo?: string
    commandResponse?: CommandResponse,
    pollFinal?: boolean
}

/**
 * @attribute serialPort?: string - The path to your TNC or software modem's serial port. If defined, it will override any TCP options that you include. Leave blank to use TCP. No default.
 * @attribute serialBaud?: number - A custom baud rate for your TNC or software modem's serial port. Default 1200 (most common) if not defined.
 * @attribute tcpHost?: string - The IP address or URL to your TNC or software mode. Default '127.0.0.1' (most common) if not defined.
 * @attribute tcpPort?: number - The TCP port to your TNC or software modem. Default 8100 (most common) if not defined.
 * @attribute compression?: boolean - Enable optional compression of the payload/body portion of the packet using the brotli algorithm. Callsigns and SSIDs are not compressed in the spirit of amateur radio. Note that regardless of setting, if for some reason the compressed version is larger than the uncompressed version, the uncompressed version is sent. Default false if not defined.
 * @attribute suppressConnectionErrors?: boolean - Mostly used for development and debugging. SerialPort and Socket will by default print errors to the console, set this to true to disable them. Default false if not defined.
 * @attribute nullModem?: boolean - A fake modem for running tests without a radio. Anything written to it will simply be printed to the console. Setting this to true overrides any and all serial and TCP options. Default to false if not defined.
 */
interface BaseKissConstructor {
    myCallsign: string,
    mySsid?: number,
    /** Enable optional compression of the payload/body portion of the packet using the brotli algorithm. Callsigns and SSIDs are not compressed in the spirit of amateur radio. Note that regardless of setting, if for some reason the compressed version is larger than the uncompressed version, the uncompressed version is sent. Default false if not defined. */
    useCompression?: boolean;
}

export interface TcpKissConstructor extends BaseKissConstructor {
    /** The IP address or URL to your TNC or software mode. No default. */
    tcpHost: string,
    /** The TCP port to your TNC or software modem. No default. */
    tcpPort: number
}

export interface SerialKissConstructor extends BaseKissConstructor {
    /** The path to your TNC or software modem's serial port. No default. */
    serialPort: string,
    /** A custom baud rate for your TNC or software modem's serial port. Default 1200 (most common) if not defined. */
    serialBaud?: number
}

export interface MockModemKissConstructor extends BaseKissConstructor {
    /** Use a fake modem for running tests without a radio. Anything written to it will simply be printed to the console. */
    useMockModem: boolean
}

/** A repeater used in a sent or received packet's repeater path. */
export interface Repeater {
    callsign: string,
    hasBeenRepeated?: boolean
    reservedBitOne?: boolean,
    reservedBitTwo?: boolean,
    ssid: number
}

export type CommandResponse = 'command' | 'response' | 'legacy'
export type InternalFrameType = 'information' | 'supervisory' | 'unnumbered'
export type SFrameType = 'RR' | 'RNR' | 'REJ' | 'SREJ'
export type UFrameType = 'SABM' | 'DISC' | 'DM' | 'UA' | 'UI' | 'FRMR' | 'XID' | 'TEST'
export type IFrameType = 'information'

export interface OutgoingFrameConstructor {
    destinationCallsign?: string
    destinationSsid?: number
    destinationReservedBitOne?: boolean
    destinationReservedBitTwo?: boolean
    sourceCallsign?: string
    sourceSsid?: number
    // source reserved bits are computed and not settable
    commandResponse?: CommandResponse
    repeaters?: Repeater[]
    frameType?: UFrameType | SFrameType | IFrameType
    receivedSequence?: number
    pollFinal?: boolean
    sendSequence?: number
    pid?: number
    payload?: any
    kissConnection?: KissConnection | TcpKissConstructor | SerialKissConstructor | MockModemKissConstructor
}