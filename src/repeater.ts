/** A repeater used in a sent or received packet's repeater path. */
export interface Repeater {
    callsign: string,
    ssid: number,
    hasBeenRepeated?: boolean
}