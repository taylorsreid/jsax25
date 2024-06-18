import { describe, expect, test } from 'bun:test'
import { NetConnectOpts } from 'net'
import { KissConnection, RRFrame, SerialConstructor, UIFrame, SFrameConstructor, XIDFrame } from '../src'

const MY_CALLSIGN: string = 'N0CALL' // make sure that it's between 1 and 6 (inclusive) characters for the tests to run correctly
const MY_SSID: number = 6 // make sure that it's between 0 and 15 (inclusive) for the tests to run correctly
const THEIR_CALLSIGN: string = 'N1CALL'
const THEIR_SSID: number = 12

// TODO: YOU MUST USE ONE OF THE FOLLOWING CONSTRUCTORS AND COMMENT OUT THE OTHER

const CONSTRUCTOR: NetConnectOpts = {
    host: '127.0.0.1',
    port: 8100
}

// const CONSTRUCTOR: SerialConstructor = {
//     path: 'COM5',
//     baudRate: 19200
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

describe('Frames', () => {

    const kc: KissConnection = new KissConnection(CONSTRUCTOR)

    describe('supervisory', () => {

        const sfc: SFrameConstructor = {
            receivedSequence: 0,
            kissConnection: kc,
            destinationCallsign: THEIR_CALLSIGN,
            destinationSsid: THEIR_SSID,
            sourceCallsign: MY_CALLSIGN,
            sourceSsid: MY_SSID
        }

        // only testing one because they're all nearly identical and inherit the same methods
        test(`new RRFrame() does not throw on valid constructor`, () => {
            expect(() => new RRFrame(sfc)).not.toThrowError()
        })

        test(`getters / setters`, () => {
            const rr: RRFrame = new RRFrame(sfc)
            expect(rr.getReceivedSequence()).toBe(sfc.receivedSequence)
            rr.setReceivedSequence(5)
            expect(rr.getReceivedSequence()).toBe(5)
            rr.setReceivedSequence(sfc.receivedSequence)
        })

    })


    describe('unnumbered', () => {
        describe('UIFrame', () => {
            test(`new UIFrame() does not throw on a valid constructor`, () => {
                expect(() => new UIFrame({
                    destinationCallsign: THEIR_CALLSIGN,
                    destinationSsid: THEIR_SSID,
                    sourceCallsign: MY_CALLSIGN,
                    sourceSsid: MY_SSID,
                    kissConnection: kc
                })).not.toThrowError()
            })
        
            describe('getters', () => {
                const ui = new UIFrame({
                    destinationCallsign: THEIR_CALLSIGN,
                    destinationSsid: THEIR_SSID,
                    sourceCallsign: MY_CALLSIGN,
                    sourceSsid: MY_SSID,
                    kissConnection: kc
                })
        
                test('getKissConnection() instanceof KissConnection === true', () => {
                    expect(ui.getKissConnection()).toBeInstanceOf(KissConnection)
                })
        
                describe('source fields', () => {
                    test(`manual.getSourceCallsign() === ${MY_CALLSIGN}`, () => {
                        expect(ui.getSourceCallsign()).toBe(MY_CALLSIGN)
                    })
                    test(`manual.getSourceSsid() === ${MY_SSID}`, () => {
                        expect(ui.getSourceSsid()).toBe(MY_SSID)
                    })
                })
        
                describe('destination fields', () => {
                    test(`manual.getDestinationCallsign() === ${THEIR_CALLSIGN}`, () => {
                        expect(ui.getDestinationCallsign()).toBe(THEIR_CALLSIGN)
                    })
                    test(`manual.getSourceSsid() === ${THEIR_SSID}`, () => {
                        expect(ui.getDestinationSsid()).toBe(THEIR_SSID)
                    })
                })
            })
            
        })

        describe(`XIDFrame`, () => {

            test(`new XIDFrame() does not throw on a valid constructor`, () => {
                expect(() => new XIDFrame({
                    destinationCallsign: THEIR_CALLSIGN,
                    destinationSsid: THEIR_SSID,
                    sourceCallsign: MY_CALLSIGN,
                    sourceSsid: MY_SSID,
                    kissConnection: kc
                })).not.toThrowError()
            })

            const xid = new XIDFrame({
                destinationCallsign: THEIR_CALLSIGN,
                destinationSsid: THEIR_SSID,
                sourceCallsign: MY_CALLSIGN,
                sourceSsid: MY_SSID,
                kissConnection: kc
            })

            test('instanceof XIDFrame', () => {
                expect(xid).toBeInstanceOf(XIDFrame)
            })

            test(`getPayload() to be array`, () => {
                expect(xid.getPayload()).toBeArray()
            })
        })

    })
})

