import { describe, test, expect, afterAll } from 'bun:test'
import { KissConnection } from '../src'
import { SerialKissConstructor, TcpKissConstructor } from '../src/types'
import { SerialPort } from 'serialport'
import { Socket } from 'net'
import { MockModem } from '../src/mockmodem'
import { OutgoingFrame } from '../src/outgoingframe'

const MY_CALLSIGN: string = 'K04LCM' // make sure that it's between 1 and 6 (inclusive) characters for the tests to run correctly
const MY_SSID: number = 0 // make sure that it's between 0 and 15 (inclusive) for the tests to run correctly
const COMPRESSION_ENABLED: boolean = false

// TODO: YOU MUST USE ONE OF THE FOLLOWING CONSTRUCTORS AND COMMENT OUT THE OTHER

const CONSTRUCTOR: TcpKissConstructor = {
    tcpHost: '127.0.0.1',
    tcpPort: 8100,
    myCallsign: MY_CALLSIGN,
    mySsid: MY_SSID,
    compressionEnabled: COMPRESSION_ENABLED // normally optional but leave it defined for testing
}

// const CONSTRUCTOR: SerialKissConstructor = {
//     serialPort: 'COM5',
//     myCallsign: MY_CALLSIGN,
//     mySsid: MY_SSID,
//     compressionEnabled: COMPRESSION_ENABLED // normally optional but leave it defined for testing
// }

if (typeof process.versions.bun !== 'undefined' && typeof CONSTRUCTOR['serialPort'] !== 'undefined') {
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
    test('isConnected() === true', () => {
        expect(kc.isConnected()).toBeTrue()
    });
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
        describe.if(typeof CONSTRUCTOR['tcpHost'] !== 'undefined')(`TCP`, () => {
            test('isTcp() === true', () => {
                expect(kc.isTcp()).toBeTrue()
            })
            test('isSerial() === false', () => {
                expect(kc.isSerial()).toBeFalse()
            })
            test('isMockModem() === false', () => {
                expect(kc.isMockModem()).toBeFalse()
            })
            test(`getTcpHost() === ${CONSTRUCTOR['tcpHost']}`, () => {
                expect(kc.getTcpHost()).toBe(CONSTRUCTOR['tcpHost'])
            })
            test(`getTcpPort() === ${CONSTRUCTOR['tcpPort']}`, () => {
                expect(kc.getTcpPort()).toBe(CONSTRUCTOR['tcpPort'])
            })
            test('getConnection() instance of Socket', () => {
                expect(kc.getConnection()).toBeInstanceOf(Socket)
            })
        })
        describe.if(typeof CONSTRUCTOR['serialPort'] !== 'undefined')(`Serial`, () => {
            test('isSerial() === true', () => {
                expect(kc.isSerial()).toBeTrue()
            })
            test('isTcp() === false', () => {
                expect(kc.isTcp()).toBeFalse()
            })
            test('isMockModem() === false', () => {
                expect(kc.isMockModem()).toBeFalse()
            })
            test(`getSerialPort() === ${CONSTRUCTOR['serialPort']}`, () => {
                expect(kc.getSerialPort()).toBe(CONSTRUCTOR['serialPort'])
            })
            test(`getSerialBaud() === ${CONSTRUCTOR['serialBaud']}`, () => {
                expect(kc.getSerialBaud()).toBe(CONSTRUCTOR['serialBaud'] ?? 1200)
            })
            test('getConnection() instance of SerialPort', () => {
                expect(kc.getConnection()).toBeInstanceOf(SerialPort)
            })
        })
        test(`getMyCallsign() === ${MY_CALLSIGN}`, () => {
            expect(kc.getMyCallsign()).toBe(MY_CALLSIGN)
        })
        test(`getMySsid() === ${MY_SSID}`, () => {
            kc.setMySsid(MY_SSID)
            expect(kc.getMySsid()).toBe(MY_SSID)
        })
        describe(`setMyCallsign()`, () => {
            test(`setMyCallsign('')`, () => {
                expect(() => kc.setMyCallsign('')).toThrowError(`'' is not a valid callsign. Callsigns must have a length from 1 to 6 characters, inclusive.`)
            })
            test(`setMyCallsign('${MY_CALLSIGN}')`, () => {
                expect(() => kc.setMyCallsign(MY_CALLSIGN)).not.toThrowError()
            })
            test(`setMyCallsign('${MY_CALLSIGN}_THIS_IS_TOO_LONG')`, () => {
                expect(() => kc.setMyCallsign(`${MY_CALLSIGN}_THIS_IS_TOO_LONG`)).toThrowError(`'${MY_CALLSIGN}_THIS_IS_TOO_LONG' is not a valid callsign. Callsigns must have a length from 1 to 6 characters, inclusive.`)
            })
            test(`setMyCallsign(${MY_CALLSIGN.toLowerCase()}) automatically uppercases passed argument`, () => {
                kc.setMyCallsign(MY_CALLSIGN.toLowerCase())
                expect(kc.getMyCallsign()).toBe(MY_CALLSIGN)
            })
        })
        describe(`setMySsid()`, () => {
            const numnum: number[][] = []
            for (let i = 0; i < 16; i++) {
                numnum.push([i])
            }
            test.each(numnum)(`getMySsid(0...15)`, (input) => {
                kc.setMySsid(input)
                expect(kc.getMySsid()).toBe(input)
            })
            test(`setMySsid(-1)`, () => {
                expect(() => kc.setMySsid(-1)).toThrowError(`-1 is not a valid SSID. SSIDs must be between 0 and 15, inclusive.`)
            })
            test(`setMySsid(16)`, () => {
                expect(() => kc.setMySsid(16)).toThrowError(`16 is not a valid SSID. SSIDs must be between 0 and 15, inclusive.`)
            })
        })
        describe(`setCompressionEnabled() and isCompressionEnabled()`, () => {
            test(`setCompressionEnabled(true)`, () => {
                kc.setCompressionEnabled(true)
                expect(kc.isCompressionEnabled()).toBeTrue()
            })
            test(`setCompressionEnabled(false)`, () => {
                kc.setCompressionEnabled(false)
                expect(kc.isCompressionEnabled()).toBeFalse()
            })
            afterAll(() => {
                kc.setCompressionEnabled(COMPRESSION_ENABLED) // reset to user settings
            })
        })
        test('createUI()', () => {
            expect(kc.createUI({
                kissConnection: kc,
                destinationCallsign: MY_CALLSIGN,
                destinationSsid: MY_SSID
            })).toBeInstanceOf(OutgoingFrame)
        });

        // test close at the end
    })
})
