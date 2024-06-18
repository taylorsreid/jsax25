import { test, describe, expect } from 'bun:test'
import { KissConnection } from '../src/kissconnection'
import { IncomingFrame } from '../src/frames/incoming'
import { rmSync } from 'node:fs'

// empty callSignCache prior to running tests as it can change results
rmSync('tests/callsignCache', { recursive: true })

const kissConnection = new KissConnection({ mockModem: true })

// Fm KH6JUZ-12 To APDW18 Via KH6MP-1*,WH6CMO-2* UI R Pid=F0
const incoming: IncomingFrame = new IncomingFrame([192, 0, 130, 160, 136, 174, 98, 112, 224, 150, 144, 108, 148, 170, 180, 248, 150, 144, 108, 154, 160, 64, 226, 174, 144, 108, 134, 154, 158, 229, 3, 240, 33, 50, 49, 51, 53, 46, 53, 48, 78, 84, 49, 53, 56, 48, 54, 46, 52, 52, 87, 38, 32, 72, 97, 108, 101, 105, 119, 97, 32, 47, 32, 78, 111, 114, 116, 104, 32, 83, 104, 111, 114, 101, 32, 79, 97, 104, 117, 32, 72, 97, 119, 97, 105, 105, 32, 85, 83, 65, 192])

// test.todo('Find non APRS frames to decode.')
describe('Decode', () => {

    test('getDestinationCallsign() === APDW18', () => {
        expect(incoming.getDestinationCallsign()).toBe('APDW18')
    })

    test('getDestinationSsid() === 0', () => {
        expect(incoming.getDestinationSsid()).toBe(0)
    })

    test('getSourceCallsign() === KH6JUZ', () => {
        expect(incoming.getSourceCallsign()).toBe('KH6JUZ')
    })

    test('getSourceSsid() === 12', () => {
        expect(incoming.getSourceSsid()).toBe(12)
    })

    test.todo('test source reserved / compression bits')

    test('getRepeaters() === KH6MP-1*,WH6CMO-2*', () => {
        expect(incoming.getRepeaters()).toStrictEqual([
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

    test.todo('test decode payload')

    test('getFrameType() === unnumbered', () => {
        expect(incoming.getFrameSubtype()).toBe('UI')
    })

    test.todo('test getSendSequence() after finding a suitable frame')
    test.todo('test isPollOrFinal() after finding a suitable frame')
    test.todo('test getReceivedSequence() after finding a suitable frame')

    test('getPid() === 0xF0', () => {
        expect(incoming.getPid()).toBe(0xF0)
    })

})

