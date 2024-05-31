/**
 * A filter object to specify conditions. Anything set will be required to match exactly in the incoming packet in order to be fully decoded and emitted.
 * Anything left as undefined will be ignored.
 */

export interface ListenFilter {
    destination?: {
        callsign?: string;
        ssid?: number;
    };
    source?: {
        callsign?: string;
        ssid?: number;
    };
    repeaters?: {
        callsign?: string;
        ssid?: number;
        hasBeenRepeated?: boolean;
    }[];
}
