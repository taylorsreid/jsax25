import { Repeater } from "./repeater";

/**
 * @attribute destination: object - An object containing the address of the intended recipient of the packet.
 * @attribute destination.callsign: string - The destination amateur radio callsign.
 * @attribute destination.ssid: number - The destination's SSID.
 * @attribute source: object - An object containing the address of the sender of the packet.
 * @attribute source.callsign: string - The sender's amateur radio callsign.
 * @attribute source.ssid: number - The sender's SSID.
 * @attribute commandResponse?: 'command' | 'response' | 'legacy' - Indicates whether the command is a command frame or a response frame if it is using the latest version of the AX.25 protocol. If not, then it is a legacy frame.
 * @attribute payload: any - The payload/body of your packet frame. Can be anything serializable, ex. a string, number, JSON, etc.
 * @attribute repeaters?: Repeater[] - The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined.
 * @attribute frametype?: 'information'|'supervisory'|'unnumbered' - The frame type being sent. Default and most common is 'unnumbered'.
 * @attribute pid?: number - The PID indicates which layer 3 protocol is in use, default is 240 which is none.
 */
export interface BaseKissFrame {
    destination: {
        /** The destination amateur radio callsign. */
        callsign: string,
        /** The destination's SSID. */
        ssid: number,
    },
    source: {
        /** The sender's amateur radio callsign. */
        callsign: string,
        /** The sender's SSID. */
        ssid: number,
    },
    /** Indicates whether the command is a command frame or a response frame if it is using the latest version of the AX.25 protocol. If not, then it is a legacy frame. */
    commandResponse?: 'command' | 'response' | 'legacy',
    /** The payload/body of your packet frame. Can be anything serializable, ex. a string, number, JSON, etc */
    payload?: any,
    /** The repeater path you wish to use in sending the packet, or the path that the packet was received on. Default none if not defined. */
    repeaters?: Repeater[],
    /** Which of the allowed frame types the frame is, unnumbered is the most common in APRS and is the default. */
    frameType?: 'information'|'supervisory'|'unnumbered',
    /** The PID indicates which layer 3 protocol is in use, default is 240 which is none. */
    pid?: number,
    /**  */
    modulo?: 8|128,
    /**  */
    // pollFinal: boolean
}

export interface UnnumberedKissFrame extends BaseKissFrame {
    //TODO: SABME / modulo 128
    controlFieldType: 'SABM' | 'DISC' | 'DM' | 'UA' | 'FRMR' | 'UI' | 'XID' | 'TEST'
}