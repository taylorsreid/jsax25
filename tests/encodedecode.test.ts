// import { test, describe, expect } from 'bun:test'
// import { KissConnection } from '../src'
// import { IncomingFrame } from '../src/incomingframe'
// import { rmSync } from 'node:fs'

// // empty callSignCache prior to running tests as it can change results
// rmSync('tests/callsignCache', { recursive: true })

// const kissConnection = new KissConnection({ useMockModem: true, myCallsign: 'N0CALL', mySsid: 0, compressionEnabled: true })

// const encodedOne: number[] = kissConnection.createUI({
//     destinationCallsign: 'KO4LCM',
//     destinationSsid: 15,
//     repeaters: [
//         {
//             callsign: 'WH6CMO',
//             ssid: 10,
//         }
//     ],
//     receivedSequence: 0,
//     pollFinal: true,
//     pid: 240,
//     payload: 'HELLO WORLD!',

//     kissConnection: kissConnection,

// }).getEncoded()

// const encodedTwo: number[] = kissConnection.createUI({
//     destinationCallsign: 'N0CALL',
//     destinationSsid: 5,
//     pollFinal: true,
//     pid: 240,
//     payload: 'HELLO WORLD!',
//     kissConnection: kissConnection,
//     repeaters: []
// }).getEncoded()

// const decodedOne: IncomingFrame = new IncomingFrame(encodedOne, kissConnection)
// const decodedTwo: IncomingFrame = new IncomingFrame(encodedTwo, kissConnection)

// describe('Encode', () => {

//     describe('destinationCallsign', () => {
//         test('KO4LCM === [0x96, 0x9E, 0x68, 0x98, 0x86, 0x9A]', () => {
//             expect(encodedOne.slice(2, 8)).toStrictEqual([0x96, 0x9E, 0x68, 0x98, 0x86, 0x9A])
//         })
//         test('N0CALL === [0x9C, 0x60, 0x86, 0x82, 0x98, 0x98]', () => {
//             expect(encodedTwo.slice(2, 8)).toStrictEqual([0x9C, 0x60, 0x86, 0x82, 0x98, 0x98])
//         })
//     })

//     describe('destinationSsid', () => {
//         test('command, reserved bits false, ssid 15, not final address', () => {
//             expect(encodedOne[8]).toBe(0b11111110)
//         })
//         test('response, reserved bits false, ssid 5, not final address', () => {
//             expect(encodedTwo[8]).toBe(0b01101010)
//         })
//     })

//     describe('sourceCallsign', () => {
//         test('N0CALL === [0x9C, 0x60, 0x86, 0x82, 0x98, 0x98]', () => {
//             expect(encodedOne.slice(9, 15)).toStrictEqual([0x9C, 0x60, 0x86, 0x82, 0x98, 0x98])
//         })
//         test('KO4LCM === [0x96, 0x9E, 0x68, 0x98, 0x86, 0x9A]', () => {
//             expect(encodedTwo.slice(9, 15)).toStrictEqual([0x96, 0x9E, 0x68, 0x98, 0x86, 0x9A])
//         })
//     })

//     describe('sourceSsid', () => {
//         test('command, reserved bits true & false respectively, ssid 12, not final address', () => {
//             expect(encodedOne[15]).toBe(0b00111000)
//         })
//         test('response, reserved bits true & false respectively, ssid 7, final address', () => {
//             expect(encodedTwo[15]).toBe(0b10101111)
//         })
//     })

//     test.todo('Write the rest of the encode tests, counting position in arrays by hand sucks.')
    
// })

// describe('EncodeThenDecode', () => {

//     describe('getDestinationCallsign()', () => {
//         test('KO4LCM', () => {
//             expect(decodedOne.getDestinationCallsign()).toBe('KO4LCM')
//         })
//         test('N0CALL', () => {
//             expect(decodedTwo.getDestinationCallsign()).toBe('N0CALL')
//         })
//     })

//     describe('getDestinationSsid()', () => {
//         test('15', () => {
//             expect(decodedOne.getDestinationSsid()).toBe(15)
//         })
//         test('5', () => {
//             expect(decodedTwo.getDestinationSsid()).toBe(5)
//         })
//     })

//     describe('getSourceCallsign()', () => {
//         test('N0CALL', () => {
//             expect(decodedOne.getSourceCallsign()).toBe('N0CALL')
//         })
//         test('KO4LCM', () => {
//             expect(decodedTwo.getSourceCallsign()).toBe('KO4LCM')
//         })
//     })

//     describe('getSourceSsid()', () => {
//         test('12', () => {
//             expect(decodedOne.getSourceSsid()).toBe(12)
//         })
//         test('7', () => {
//             expect(decodedTwo.getSourceSsid()).toBe(7)
//         })
//     })

//     describe('getCommandResponse()', () => {
//         test('command', () => {
//             expect(decodedOne.getCommandResponse()).toBe('command')
//         })
//         test('response', () => {
//             expect(decodedTwo.getCommandResponse()).toBe('response')
//         })
//     })

//     describe('getRepeaters()', () => {

//         test('[{callsign: WH6CMO, ssid: 10, hasBeenRepeated: false}]', () => {
//             expect(decodedOne.getRepeaters()).toStrictEqual([
//                 {
//                     callsign: 'WH6CMO',
//                     ssid: 10,
//                     hasBeenRepeated: false
//                 }
//             ])
//         })

//         test('[]', () => {
//             expect(decodedTwo.getRepeaters()).toStrictEqual([])
//         })

//     })

//     describe('getFrameType()', () => {
//         // SABM
//         // UI
//     })

    
    
// })

// // test('', () => {
// //     expect().to
// // })