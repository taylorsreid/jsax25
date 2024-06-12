import { type Repeater } from "./types"

// decode functions

// export function getBinaryString(byte: number): string {
//     // get the ssid byte in binary form
//     let binary: string = byte.toString(2)
//     while (binary.length < 8) { // pad the SSID byte with zeros to a length of 8
//         binary = '0' + binary
//     }
//     return binary
// }

// export function decodeCallsign(bytes: number[]): string {
//     // counter and empty string for later
//     let i = 0
//     let callsign: string = ''

//     // decode callsign, stop decoding if the character is a space or the ASCII null symbol
//     while (i < 6 && bytes[i] >> 1 !== 0x00 && bytes[i] >> 1 !== 0x20) {
//         callsign += String.fromCharCode(bytes[i] >> 1); // AX.25 addresses are encoded with bit shifting to make room for a final bit on the final byte, yes it's dumb
//         i++
//     }

//     return callsign
// }

// export function decodeCommandOrHasBeenRepeated(byte: number): boolean {
//     return getBinaryString(byte)[0] === '1'
// }

/**
 * Specifically decodes only the repeaters field of an encoded packet. Very useful if you are looking to write repeater software,
 * as this will save you some CPU cycles versus decoding the entire packet.
 * @param entireFrame a kiss frame represented by a number array
 * @returns a populated array of Repeater objects OR and empty array if the packet doesn't have any repeaters.
 */
// export function decodeRepeaters(entireFrame: number[]): Repeater[] {

//     if (entireFrame[0] === 0xC0) {
//         entireFrame.shift()
//     }

//     let position: number = 14
//     let repeaters: Repeater[] = []
//     while (entireFrame[position].toString(2).endsWith('0')) {
//         repeaters.push({
//             callsign: decodeCallsign(entireFrame.slice(position + 1, position + 7)),
//             ssid: parseInt(getBinaryString(entireFrame[position + 7]).slice(3, 7), 2),
//             hasBeenRepeated: getBinaryString(entireFrame[position + 7])[0] === '1'
//         })
//         position += 7
//     }
//     return repeaters       
// }

// encode functions

// export function encodeCallsign(callsign: string): number[] {

//     // check for non correctable issues
//     if (callsign.length < 1 || callsign.length > 6) {
//         throw new Error(`'${callsign}' is not a valid callsign. Callsigns must have a length from 1 to 6 characters, inclusive.`)
//     }

//     // fix correctable issues
//     callsign = callsign.toUpperCase() // convert to upper case
//     while (callsign.length < 6) { // pad with spaces to a length of 6 per AX.25 spec
//         callsign += ' '
//     }

//     // empty array to hold our encoded results
//     let bytes: number[] = []

//     // get ascii code for each character in the callsign, bit shift it left by one, and push
//     for (let i = 0; i < callsign.length; i++) {
//         bytes.push(callsign.charCodeAt(i) << 1)
//     }

//     return bytes
// }

/**
* Encode a callsign in ASCII code format, bit shifted to the left by 1.
* @param callsign the string representation of the callsign to encode.
* @returns an array of ASCII codes, bit shifted to the left by 1.
*/
// export function encodeSsidField(commandOrHasBeenRepeated: boolean, reservedBitOne: boolean, reservedBitTwo: boolean, ssid: number, finalAddress: boolean): number {

//     if (ssid < 0 || ssid > 15) {
//         throw new Error(`${ssid} is not a valid SSID. SSIDs must be between 0 and 15, inclusive.`)
//     }

//     // get binary representation of the ssid and pad it with zeros to a length of 4
//     let ssidBinary = ssid.toString(2)
//     while (ssidBinary.length < 4) {
//         ssidBinary = '0' + ssidBinary
//     }

//     // empty string to hold our 1s and 0s
//     let bits: string = ''
//     bits += commandOrHasBeenRepeated ? '1' : '0' // if command or has been repeated, push 1
//     bits += reservedBitOne ? '0' : '1' // if reserved bit is being used, push 0, otherwise push 1 when not in use. very counterintuitive
//     bits += reservedBitTwo ? '0' : '1' // if reserved bit is being used, push 0, otherwise push 1 when not in use. very counterintuitive
//     bits += ssidBinary
//     bits += finalAddress ? '1' : '0' // used to indicate whether this is the last address or not

//     return parseInt(bits, 2)
// }

// export function encodeRepeaters(repeaters: Repeater[]): number[] {
//     if (repeaters.length > 0) {
//         let encoded: number[] = []
//         if (repeaters.length > 2) {
//             repeaters = repeaters.slice(0, 2) // truncate if necessary, AX.25 standard states no more than 2 repeaters
//         }
//         for (let i = 0; i < repeaters.length; i++) {
//             encoded.push(...
//                 encodeCallsign(repeaters[i].callsign),
//                 encodeSsidField(
//                     repeaters[i].hasBeenRepeated ?? false, // indicates whether this repeater has already repeated the packet, this bit is flipped by the repeater
//                     repeaters[i].reservedBitOne ?? false, // currently unused
//                     repeaters[i].reservedBitTwo ?? false, // currently unused
//                     repeaters[i].ssid,
//                     i === repeaters.length - 1 // whether we are on the last repeater in the array or not
//                 )
//             )
//         }
//         return encoded
//     }
//     return []
// }

// export function encodeControlField(bitsOne: string | number, pollFinal: boolean, bitsTwo: string | number): number {

//     // if a number is passed in, convert it to a binary string and pad it to a length of 3
//     if (typeof bitsOne === 'number') {
//         bitsOne = bitsOne.toString(2)
//         while (bitsOne.length < 3) {
//             bitsOne = '0' + bitsOne
//         }
//     }

//     if (typeof bitsTwo === 'number') {
//         bitsTwo = bitsTwo.toString(2)
//         while (bitsTwo.length < 3) {
//             bitsTwo = '0' + bitsTwo
//         }
//         bitsTwo += '0' // if a number was passed in then it's an information frame, which gets an extra 0 at the end
//     }

//     return parseInt(bitsOne + (pollFinal ? '1' : '0') + bitsTwo, 2)
// }