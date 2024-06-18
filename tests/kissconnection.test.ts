import { describe, test, expect, afterAll } from 'bun:test'
import { KissConnection } from '../src/kissconnection'
import { SerialConstructor} from '../src/types'
import type { NetConnectOpts } from 'net'
import { SerialPort } from 'serialport'
import { Socket } from 'net'
import { MockModem } from '../src/mockmodem'
import { UIFrame } from '../src/frames/outgoing/unnumbered/ui'

const MY_CALLSIGN: string = 'N0CALL' // make sure that it's between 1 and 6 (inclusive) characters for the tests to run correctly
const MY_SSID: number = 5 // make sure that it's between 0 and 15 (inclusive) for the tests to run correctly
const THEIR_CALLSIGN: string = 'KO4LCM'
const THEIR_SSID: number = 12
const COMPRESSION_ENABLED: boolean = false

// TODO: YOU MUST USE ONE OF THE FOLLOWING CONSTRUCTORS AND COMMENT OUT THE OTHER

const CONSTRUCTOR: NetConnectOpts = {
    host: '127.0.0.1',
    port: 8100,
}

// const CONSTRUCTOR: SerialKissConstructor = {
//     serialPort: 'COM5'
// }

if (typeof process.versions.bun !== 'undefined' && typeof CONSTRUCTOR['path'] !== 'undefined') {
    throw new Error(`Serial connections are not currently supported with Bun due to an upstream bug in Bun. Aborting tests. Please switch to a TCP KISS connection or install dev Jest and import it to this file to be compatible with Node.`)
}

if (MY_CALLSIGN.length < 1 || MY_CALLSIGN.length > 6) {
    throw new Error(`${MY_CALLSIGN} is not a valid callsign. Please see the instructions. A valid callsign must be set to run the tests. Tests have been aborted.`)
}

if (MY_SSID < 0 || MY_SSID > 15) {
    throw new Error(`${MY_SSID} is not a valid SSID. Please see the instructions. A valid SSID must be set to run the tests. Tests have been aborted.`)
}

describe('KissConnection', () => {
    const kc: KissConnection = new KissConnection(CONSTRUCTOR)
    const success: boolean = kc instanceof KissConnection
    test(`new KissConnection() doesn't throw`, () => {
        expect(() => new KissConnection(CONSTRUCTOR)).not.toThrowError()
    })
    describe.if(success)('connection type specific tests', () => {
        describe.if(typeof CONSTRUCTOR['useMockmodem'] !== 'undefined')('MockModem', () => {
            test('isMockModem() === true', () => {
                expect(kc.isMockModem()).toBeTrue()
            })
            test('isTcp() === false', () => {
                expect(kc.isTcp()).toBeFalse()
            })
            test('isSerial() === false', () => {
                expect(kc.isSerial()).toBeFalse()
            })
            test('getConnection() instance of MockModem', () => {
                expect(kc.getConnection()).toBeInstanceOf(MockModem)
            })
        })
        describe.if(typeof CONSTRUCTOR['host'] !== 'undefined')(`TCP`, () => {
            test('isTcp() === true', () => {
                expect(kc.isTcp()).toBeTrue()
            })
            test('isSerial() === false', () => {
                expect(kc.isSerial()).toBeFalse()
            })
            test('isMockModem() === false', () => {
                expect(kc.isMockModem()).toBeFalse()
            })
            test(`getTcpHost() === ${CONSTRUCTOR['host']}`, () => {
                expect(kc.getTcpHost()).toBe(CONSTRUCTOR['host']!)
            })
            test(`getTcpPort() === ${CONSTRUCTOR['port']}`, () => {
                expect(kc.getTcpPort()).toBe(CONSTRUCTOR['port'])
            })
            test('getConnection() instance of Socket', () => {
                expect(kc.getConnection()).toBeInstanceOf(Socket)
            })
        })
        describe.if(typeof CONSTRUCTOR['path'] !== 'undefined')(`Serial`, () => {
            test('isSerial() === true', () => {
                expect(kc.isSerial()).toBeTrue()
            })
            test('isTcp() === false', () => {
                expect(kc.isTcp()).toBeFalse()
            })
            test('isMockModem() === false', () => {
                expect(kc.isMockModem()).toBeFalse()
            })
            test(`getSerialPath() === ${CONSTRUCTOR['path']}`, () => {
                expect(kc.getSerialPath()).toBe(CONSTRUCTOR['path'])
            })
            test(`getSerialBaudRate() === ${CONSTRUCTOR['path']}`, () => {
                expect(kc.getSerialBaudRate()).toBe(CONSTRUCTOR['baudRate'] ?? 1200)
            })
            test('getConnection() instance of SerialPort', () => {
                expect(kc.getConnection()).toBeInstanceOf(SerialPort)
            })
        })
    })
})
