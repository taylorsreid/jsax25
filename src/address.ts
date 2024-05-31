/**
 * The basic structure of every address field (destination, source, and repeater) in an AX.25 packet,
 * represented as an easier to use Javascript object vs the raw AX.25 bits.
 * See AX.25 spec for a more detailed explanation.
 * @attribute commandOrHasBeenRepeated: boolean - On destination and source fields, this boolean indicates whether or not the frame is a command / response frame. True indicates a command frame, false indicates a response frame. On repeater address fields, this boolean indicates whether or not a frame has already been repeated by the corresponding repeater. Repeaters should flip this boolean from false to true and reencode before repeating.
 * @attribute callsign: string - The amateur radio callsign of the address.
 * @attribute reservedBitOne: boolean - A bit whose purpose is not officially defined by the AX.25 spec. This library uses it in the source address field to indicate whether or not a sender accepts payloads compressed with the brotli alogorithm. The bit is set to 0 (true) when used and 1 (false) when unused.
 * @attribute reservedBitTwo: boolean - A bit whose purpose is not officially defined by the AX.25 spec. This library uses it in the source address field to indicate whether or not a payload is compressed using the brotli compression algorithm. The bit is set to 0 (true) when used and 1 (false) when unused.
 * @attribute ssid: number - The SSID of the amateur radio station. Acceptable values are 0 to 15 inclusive.
 * @attribute finalAddress: boolean - The final bit of an address field indicates whether an additional address follows. Set to true on the source address when no repeaters are used, or true on the final repeater when repeaters are used.
 */
export interface Address {
    commandOrHasBeenRepeated: boolean,
    callsign: string,
    reservedBitOne: boolean,
    reservedBitTwo: boolean,
    ssid: number,
    finalAddress: boolean,
}