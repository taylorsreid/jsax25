import { LocalStorage } from "node-localstorage"
import { CacheItem } from "types"

export class CacheManager {

    private localStorage = new LocalStorage('./callsignCache')

    /**
     * Updates the localstorage cache whether or not a callsign + SSID combo supports compression.
     * @param callsign the callsign to store.
     * @param ssid the callsign's SSID to store, an operator may have devices that do not support the custom compression of this class, so it's important to store them with SSID.
     * @param supportsCompression boolean value whether the callsign + SSID combo supports this class' custom Brotli compression algorithm.
     */
    public set(callsign: string, ssid: number, details: CacheItem): void {
        this.localStorage.setItem(callsign + '-' + ssid, JSON.stringify(details))
    }

    /**
     * Check the localstorage whether or not a callsign + SSID combo supports compression.
     * @param callsign the callsign to check.
     * @param ssid the callsign's SSID to check, an operator may have devices that do not support the custom compression of this class, so it's important to check the SSID as well.
     * @returns boolean value whether the callsign + SSID combo supports this class' custom Brotli compression algorithm.
     */
    public get(callsign: string, ssid: number): CacheItem | null { // null to match LocalStorage's return type
        const result = this.localStorage.getItem(callsign + '-' + ssid)
        if (result) {
            return JSON.parse(result)
        }
        return null
    }
}