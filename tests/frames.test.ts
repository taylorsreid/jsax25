import { describe, expect, test } from 'bun:test'
import { KissConnection, RRFrame, XIDFrame, FrameFactory } from '../src'
import { SupervisoryAbstract } from '../src/frames/outgoing/supervisory/supervisoryabstract'
import { OutgoingAbstract } from '../src/frames/outgoing/outgoingabstract'

const kc: KissConnection = new KissConnection({
    txBaud: 1200,
	tcpHost: '127.0.0.1',
    tcpPort: 8100
})

const ff: FrameFactory = new FrameFactory({
    kissConnection: kc,
    destinationCallsign: 'N1CALL',
    destinationSsid: 12,
    sourceCallsign: 'N0CALL',
    sourceSsid: 6
})


if (typeof process.versions.bun !== 'undefined' && typeof kc.getSerialPort() !== 'undefined') {
    throw new Error(`Serial connections are not currently supported with Bun due to an upstream bug in Bun. Aborting tests. Please switch to a TCP KISS connection or install dev Jest and import it to this file to be compatible with Node.`)
}

describe('Frames', () => {

    describe('outgoing abstract', () => {
        const frame = ff.ui()
        
        test('frame.getKissConnection() instanceof KissConnection === true', () => {
            expect(frame.getKissConnection()).toBeInstanceOf(KissConnection)
        })

        describe('source fields', () => {
            test(`ui.getSourceCallsign() === ff.getSourceCallsign()`, () => {
                expect(frame.getSourceCallsign()).toBe(ff.getSourceCallsign())
            })
            test(`ui.getSourceSsid() === ff.getSourceSsid()`, () => {
                expect(frame.getSourceSsid()).toBe(ff.getSourceSsid())
            })
        })

        describe('destination fields', () => {
            test(`ui.getDestinationCallsign() === ff.getDestinationCallsign()`, () => {
                expect(frame.getDestinationCallsign()).toBe(ff.getDestinationCallsign())
            })
            test(`ui.getSourceSsid() === ff.getSourceSsid()`, () => {
                expect(frame.getDestinationSsid()).toBe(ff.getDestinationSsid())
            })
        })
    })

    describe('supervisory', () => {
        const rr = ff.rr(0, 'command', false, 8)

        test('instanceof OutgoingAbstract', () => {
            expect(rr).toBeInstanceOf(OutgoingAbstract)
        })

        test('instanceof SupervisoryAbstract', () => {
            expect(rr).toBeInstanceOf(SupervisoryAbstract)
        })

        test('instanceof RRFrame', () => {
            expect(rr).toBeInstanceOf(RRFrame)
        })

        test(`set/get received sequence`, () => {
            rr.setReceivedSequence(5)
            expect(rr.getReceivedSequence()).toBe(5)
            rr.setReceivedSequence(0)
        })

        test('set/get modulo', () => {
            rr.setModulo(128)
            expect(rr.getModulo()).toBe(128)
            rr.setModulo(8)
        })

        test('set/get command or response', () => {
            rr.setCommandOrResponse('response')
            expect(rr.getCommandOrResponse()).toBe('response')
            rr.setCommandOrResponse('command')
        })

    })


    describe('unnumbered', () => {
        describe('UIFrame', () => {
        
            describe('getters', () => {
                const ui = ff.ui('HELLO WORLD')
        
                
            })
            
        })

        describe(`XIDFrame`, () => {
            const xid = ff.xid()

            test('instanceof XIDFrame', () => {
                expect(xid).toBeInstanceOf(XIDFrame)
            })

            test(`getPayload() to be array`, () => {
                expect(xid.getPayload()).toBeArray()
            })
        })

    })
})

