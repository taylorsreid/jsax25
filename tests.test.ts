import { test, describe, expect, beforeAll } from 'bun:test'
import { IFrame, InboundFrame, KissConnection, type SerialKissConstructor, type TcpKissConstructor, UIFrame } from './src/index.js'
import { Socket } from 'net'
import { SerialPort } from 'serialport'
import { setTimeout } from 'timers/promises'

const MY_CALL: string = 'KO4LCM'
const MY_SSID: number = 9
const THEIR_CALL: string = 'N0CALL'
const THEIR_SSID: number = 1
const MODEM_PATH: string = "C:\\Program Files\\soundmodem114\\soundmodem.exe"
const KISS_CONSTRUCTOR: TcpKissConstructor | SerialKissConstructor = {
    host: 'localhost',
    port: 8100
}

/********** DO NOT MODIFY BELOW THIS LINE **********/

let original1: UIFrame
let original2: IFrame

let encoded1: number[]
let encoded2: number[]
let encoded3: number[]

let decoded1: InboundFrame
let decoded2: InboundFrame
let decoded3: InboundFrame

let kissConnection: KissConnection

beforeAll(() => {

    original1 = new UIFrame({
        destinationCallsign: 'KO4LCM',
        destinationSsid: 15,
        sourceCallsign: 'N0CALL',
        sourceSsid: 12,
        repeaters: [
            {
                callsign: 'WH6CMO',
                ssid: 10,
                hasBeenRepeated: false
            }
        ],
        pollOrFinal: true,
        pid: 240,
        payload: 'HELLO WORLD!',
        commandOrResponse: 'response',
        sourceReservedBitOne: true
    })

    original2 = new IFrame({
        destinationCallsign: 'N0CALL',
        destinationSsid: 5,
        sourceCallsign: 'KO4LCM',
        sourceSsid: 7,
        pollOrFinal: true,
        pid: 240,
        payload: 'HELLO WORLD!',
        repeaters: [],
        sourceReservedBitOne: true,
        receivedSequence: 1,
        sendSequence: 2
    })

    encoded1 = original1.encoded
    encoded2 = original2.encoded
    encoded3 = [192, 0, 130, 160, 136, 174, 98, 112, 224, 150, 144, 108, 148, 170, 180, 248, 150, 144, 108, 154, 160, 64, 226, 174, 144, 108, 134, 154, 158, 229, 3, 240, 33, 50, 49, 51, 53, 46, 53, 48, 78, 84, 49, 53, 56, 48, 54, 46, 52, 52, 87, 38, 32, 72, 97, 108, 101, 105, 119, 97, 32, 47, 32, 78, 111, 114, 116, 104, 32, 83, 104, 111, 114, 101, 32, 79, 97, 104, 117, 32, 72, 97, 119, 97, 105, 105, 32, 85, 83, 65, 192]

    decoded1 = new InboundFrame(encoded1)
    decoded2 = new InboundFrame(encoded2)
    decoded3 = new InboundFrame(encoded3)
})

describe('encoded matches literals', () => {
    describe('.destinationCallsign', () => {
        test('KO4LCM: [0x96, 0x9E, 0x68, 0x98, 0x86, 0x9A]', () => {
            expect(encoded1.slice(2, 8)).toStrictEqual([0x96, 0x9E, 0x68, 0x98, 0x86, 0x9A])
        })
        test('N0CALL: [0x9C, 0x60, 0x86, 0x82, 0x98, 0x98]', () => {
            expect(encoded2.slice(2, 8)).toStrictEqual([0x9C, 0x60, 0x86, 0x82, 0x98, 0x98])
        })
    })
    
    describe('.destinationSsid', () => {
        test('response, reserved bits false, ssid 15, not final address', () => {
            expect(encoded1[8]).toBe(0b0_11_1111_0)
        })
        test('command, reserved bits false, ssid 5, not final address', () => {
            expect(encoded2[8]).toBe(0b1_11_0101_0)
        })
    })
    
    describe('.sourceCallsign', () => {
        test('N0CALL === [0x9C, 0x60, 0x86, 0x82, 0x98, 0x98]', () => {
            expect(encoded1.slice(9, 15)).toStrictEqual([0x9C, 0x60, 0x86, 0x82, 0x98, 0x98])
        })
        test('KO4LCM === [0x96, 0x9E, 0x68, 0x98, 0x86, 0x9A]', () => {
            expect(encoded2.slice(9, 15)).toStrictEqual([0x96, 0x9E, 0x68, 0x98, 0x86, 0x9A])
        })
    })
    
    describe('.sourceSsid', () => {
        test('response, reserved bits true & false respectively, ssid 12, not final address', () => {
            expect(encoded1[15]).toBe(0b1_01_1100_0)
        })
        test('command, reserved bits true & false respectively, ssid 7, final address', () => {
            expect(encoded2[15]).toBe(0b0_01_0111_1)
        })
    })
    
    test.todo('Write the rest of the encode tests, counting position in arrays by hand sucks.')
})

describe('decoded matches original', () => {
    test('.destinationCallsign', () => {
        expect(decoded1.destinationCallsign).toBe(original1.destinationCallsign)
        expect(decoded2.destinationCallsign).toBe(original2.destinationCallsign)
        expect(decoded3.destinationCallsign).toBe('APDW18')
    })
    
    describe('.destinationSsid', () => {
        test(original1.destinationSsid.toString(), () => {
            expect(decoded1.destinationReservedBitOne).toBe(original1.destinationReservedBitOne)
            expect(decoded1.destinationReservedBitTwo).toBe(original1.destinationReservedBitTwo)
            expect(decoded1.destinationSsid).toBe(original1.destinationSsid)
        })
        test(original2.destinationSsid.toString(), () => {
            expect(decoded2.destinationReservedBitOne).toBe(original2.destinationReservedBitOne)
            expect(decoded2.destinationReservedBitTwo).toBe(original2.destinationReservedBitTwo)
            expect(decoded2.destinationSsid).toBe(original2.destinationSsid)
        })
        test('0', () => {
            expect(decoded3.destinationReservedBitOne).toBeFalse()
            expect(decoded3.destinationReservedBitTwo).toBeFalse()
            expect(decoded3.destinationSsid).toBe(0)
        })
    })
    
    test('.sourceCallsign', () => {
        expect(decoded1.sourceCallsign).toBe(original1.sourceCallsign)
        expect(decoded2.sourceCallsign).toBe(original2.sourceCallsign)
        expect(decoded3.sourceCallsign).toBe('KH6JUZ')
    })
    
    describe('.sourceSsid', () => {
        test(original1.sourceSsid.toString(), () => {
            expect(decoded1.sourceReservedBitOne).toBe(original1.sourceReservedBitOne)
            expect(decoded1.sourceReservedBitTwo).toBe(original1.sourceReservedBitTwo)
            expect(decoded1.sourceSsid).toBe(original1.sourceSsid)
        })
        test(original2.sourceSsid.toString(), () => {
            expect(decoded2.sourceReservedBitOne).toBe(original2.sourceReservedBitOne)
            expect(decoded2.sourceReservedBitTwo).toBe(original2.sourceReservedBitTwo)
            expect(decoded2.sourceSsid).toBe(original2.sourceSsid)
        })
        test('12', () => {
            expect(decoded3.sourceReservedBitOne).toBeFalse()
            expect(decoded3.sourceReservedBitTwo).toBeFalse()
            expect(decoded3.sourceSsid).toBe(12)
        })
        
    })
    
    describe('.commandOrResponse', () => {
        test(original1.commandOrResponse, () => {
            expect(decoded1.commandOrResponse).toBe(original1.commandOrResponse)
            expect(decoded1.isCommand).toBe(original1.isCommand)
            expect(decoded1.isResponse).toBe(original1.isResponse)
            expect(decoded1.isLegacy).toBe(original1.isLegacy)
        })
        test(original2.commandOrResponse, () => {
            expect(decoded2.commandOrResponse).toBe(original2.commandOrResponse)
            expect(decoded2.isCommand).toBe(original2.isCommand)
            expect(decoded2.isResponse).toBe(original2.isResponse)
            expect(decoded2.isLegacy).toBe(original2.isLegacy)
        })
        test('response', () => {
            expect(decoded3.commandOrResponse).toBe('legacy')
            expect(decoded3.isCommand).toBeFalse()
            expect(decoded3.isResponse).toBeFalse()
            expect(decoded3.isLegacy).toBeTrue()
        })
    })
    
    test('.repeaters', () => {
        expect(decoded1.repeaters).toStrictEqual(original1.repeaters)
        expect(decoded2.repeaters).toStrictEqual(original2.repeaters)
        expect(decoded3.repeaters).toStrictEqual([
            {
                callsign: 'KH6MP',
                ssid: 1,
                hasBeenRepeated: true
            },
            {
                callsign: 'WH6CMO',
                ssid: 2,
                hasBeenRepeated: true
            }
        ])
    })

    test('.type', () => {
        expect(decoded1.type).toBe(original1.type)
        expect(decoded2.type).toBe(original2.type)
        expect(decoded3.type).toBe('unnumbered')
    })

    test('.subtype', () => {
        expect(decoded1.subtype).toBe(original1.subtype)
        expect(decoded2.subtype).toBe(original2.subtype)
        expect(decoded3.subtype).toBe('UI')
    })

    test('.receivedSequence', () => {
        expect(decoded1.receivedSequence).toBeUndefined()
        expect(decoded2.receivedSequence).toBe(original2.receivedSequence)
        expect(decoded3.receivedSequence).toBeUndefined()
    })

    test('.pollOrFinal', () => {
        expect(decoded1.pollOrFinal).toBe(original1.pollOrFinal)
        expect(decoded2.pollOrFinal).toBe(original2.pollOrFinal)
        expect(decoded3.pollOrFinal).toBeFalse()
    })

    test('.sendSequence', () => {
        expect(decoded1.sendSequence).toBeUndefined()
        expect(decoded2.sendSequence).toBe(original2.sendSequence)
        expect(decoded3.sendSequence).toBeUndefined()
    })

    test('.pid', () => {
        expect(decoded1.pid).toBe(original1.pid)
        expect(decoded2.pid).toBe(original2.pid)
        expect(decoded3.pid).toBe(240)
    })

    test('.payload', () => {
        expect(decoded1.payload).toBe(original1.payload)
        expect(decoded2.payload).toBe(original2.payload)
        expect(decoded3.payload).toBe('!2135.50NT15806.44W& Haleiwa / North Shore Oahu Hawaii USA')
    })
})

describe('KissConnection', () => {

    beforeAll(async () => {
        Bun.spawn([MODEM_PATH])
        await setTimeout(2000)
        kissConnection = new KissConnection(KISS_CONSTRUCTOR)
    })

    test('instanceof and isTcp and isSerial', () => {
        expect(kissConnection.connection instanceof Socket || kissConnection.connection instanceof SerialPort).toBeTrue()
        expect(kissConnection.connection instanceof Socket).toBe(kissConnection.isTcp)
        expect(kissConnection.connection instanceof SerialPort).toBe(kissConnection.isSerial)
        expect(kissConnection.isTcp).toBe(!kissConnection.isSerial)
        expect(kissConnection.isSerial).toBe(!kissConnection.isTcp)
    })

    test('.txBaud', () => {
        expect(kissConnection.txBaud).toBe(1200)
    })
})