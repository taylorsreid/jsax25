// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { describe, expect, test } from '@jest/globals'
import { DISCFrame, DMFrame, IFrame, IncomingFrame, REJFrame, Repeater, RNRFrame, RRFrame, SABMEFrame, SABMFrame, SFrameConstructor, SREJFrame, TESTFrame, UAFrame, UIFrame, UIFrameConstructor, XIDFrame } from './src'
import { BaseAbstract, FrameSubtype, FrameType } from './src/frames/baseabstract'
import { OutgoingConstructor, OutgoingFrame } from './src/frames/outgoing/outgoing'
import { SupervisoryAbstract } from './src/frames/outgoing/supervisory/supervisoryabstract'
import { validatePid } from './src/misc'

// 
const destinationCallsign: string = 'WH6CMO'

// 
const destinationSsid: number = 10

// 
const sourceCallsign: string = 'KO4LCM'

// 
const sourceSsid: number = 7

//////////////////////////////////////////////////////////////////////////////////

describe('frames', () => {
    const outgoingConstructor: OutgoingConstructor = { destinationCallsign, destinationSsid, sourceCallsign, sourceSsid }
    const sFrameConstructor: SFrameConstructor = structuredClone(outgoingConstructor) as SFrameConstructor
    sFrameConstructor.receivedSequence = 0
    const uiFrameConstructor: UIFrameConstructor = structuredClone(outgoingConstructor) as UIFrameConstructor
    uiFrameConstructor.payload = 'hello world'

    const table: Array<[OutgoingFrame, FrameType, FrameSubtype, 'command' | 'response', 8 | 128]> = [
        [new REJFrame(sFrameConstructor), 'supervisory', 'REJ', 'response', 8],
        [new RNRFrame(sFrameConstructor), 'supervisory', 'RNR', 'response', 8],
        [new RRFrame(sFrameConstructor), 'supervisory', 'RR', 'response', 8],
        [new SREJFrame({ destinationCallsign, destinationSsid, sourceCallsign, sourceSsid, receivedSequence: 0, pollOrFinal: true, modulo: 128 }), 'supervisory', 'SREJ', 'response', 128],
        [new DISCFrame(outgoingConstructor), 'unnumbered', 'DISC', 'command', 8],
        [new DMFrame(outgoingConstructor), 'unnumbered', 'DM', 'response', 8],
        [new SABMFrame(outgoingConstructor), 'unnumbered', 'SABM', 'command', 8],
        [new SABMEFrame(outgoingConstructor), 'unnumbered', 'SABME', 'command', 8],
        [new TESTFrame(outgoingConstructor), 'unnumbered', 'TEST', 'command', 8],
        [new UAFrame(outgoingConstructor), 'unnumbered', 'UA', 'response', 8],
        [new UIFrame(uiFrameConstructor), 'unnumbered', 'UI', 'response', 8],
        [new XIDFrame(outgoingConstructor), 'unnumbered', 'XID', 'command', 8],
        [new IFrame({ destinationCallsign, destinationSsid, sourceCallsign, sourceSsid, receivedSequence: 0, sendSequence: 0, payload: 'hello world', modulo: 8 }), 'information', 'I', 'command', 8],
        [new IFrame({ destinationCallsign, destinationSsid, sourceCallsign, sourceSsid, receivedSequence: 0, sendSequence: 0, payload: 'hello world', modulo: 128 }), 'information', 'I', 'command', 128]
    ]

    test(BaseAbstract, () => {
        const frame = new UIFrame(uiFrameConstructor)
        expect(frame.toString()).toBe(JSON.stringify(frame.toJSON()))
    })

    describe.each(table)('common properties on all frame types', (outgoing, type, subtype, commandOrResponse, modulo) => {
        const incoming: IncomingFrame = new IncomingFrame(outgoing.encode(), modulo)
        test('.type', () => {
            expect(outgoing.type).toBe(type)
            expect(incoming.type).toBe(type)
        })
        test('.subtype', () => {
            expect(outgoing.subtype).toBe(subtype)
            expect(incoming.subtype).toBe(subtype)
        })
        test('.destinationCallsign', () => {
            expect(outgoing.destinationCallsign).toBe(destinationCallsign)
            expect(() => { outgoing.destinationCallsign = '' }).toThrow()
            expect(() => { outgoing.destinationCallsign = '1234567' }).toThrow()
            expect(() => { outgoing.destinationCallsign = '   ' }).toThrow()
            expect(incoming.destinationCallsign).toBe(destinationCallsign)
        })
        test('.destinationSsid', () => {
            expect(outgoing.destinationSsid).toBe(destinationSsid)
            expect(() => { outgoing.destinationSsid = -1 }).toThrow()
            expect(() => { outgoing.destinationSsid = 16 }).toThrow()
            expect(incoming.destinationSsid).toBe(destinationSsid)
        })
        test('.destinationCommandBit', () => {
            expect(outgoing.destinationCommandBit).toBeDefined()
            expect(incoming.destinationCommandBit).toBeDefined()
        })
        test('.destinationReservedBitOne', () => {
            expect(outgoing.destinationReservedBitOne).toBe(false)
            expect(incoming.destinationReservedBitOne).toBe(false)
        })
        test('.destinationReservedBitTwo', () => {
            expect(outgoing.destinationReservedBitTwo).toBe(false)
            expect(incoming.destinationReservedBitTwo).toBe(false)
        })
        test('.sourceCallsign', () => {
            expect(outgoing.sourceCallsign).toBe(sourceCallsign)
            expect(() => { outgoing.sourceCallsign = '' }).toThrow()
            expect(() => { outgoing.sourceCallsign = '1234567' }).toThrow()
            expect(() => { outgoing.sourceCallsign = '   ' }).toThrow()
            expect(incoming.sourceCallsign).toBe(sourceCallsign)
        })
        test('.sourceSsid', () => {
            expect(outgoing.sourceSsid).toBe(sourceSsid)
            expect(() => { outgoing.sourceSsid = -1 }).toThrow()
            expect(() => { outgoing.sourceSsid = 16 }).toThrow()
            expect(incoming.sourceSsid).toBe(sourceSsid)
        })
        test('.sourceCommandBit', () => {
            expect(outgoing.sourceCommandBit).toBeDefined()
            expect(incoming.sourceCommandBit).toBeDefined()
        })
        test('.sourceReservedBitOne', () => {
            expect(outgoing.sourceReservedBitOne).toBe(false)
            expect(incoming.sourceReservedBitOne).toBe(false)
        })
        test('.sourceReservedBitTwo', () => {
            expect(outgoing.sourceReservedBitTwo).toBe(false)
            expect(incoming.sourceReservedBitTwo).toBe(false)
        })
        test('.commandOrResponse', () => {
            expect(outgoing.commandOrResponse).toBe(commandOrResponse)
            expect(incoming.commandOrResponse).toBe(commandOrResponse)
        })
        test('.isCommand, .isResponse, .isLegacy', () => {
            if (outgoing.isCommand) {
                expect(outgoing.commandOrResponse).toBe('command')
                expect(outgoing.isResponse).toBe(false)
                expect(outgoing.isLegacy).toBe(false)
            }
            else if (outgoing.isResponse) {
                expect(outgoing.commandOrResponse).toBe('response')
                expect(outgoing.isCommand).toBe(false)
                expect(outgoing.isLegacy).toBe(false)
            }
            else if (outgoing.isLegacy) {
                throw new Error('OutgoingFrame.isLegacy should never be true.')
            }
            if (incoming.isCommand) {
                expect(incoming.commandOrResponse).toBe('command')
                expect(incoming.isResponse).toBe(false)
                expect(incoming.isLegacy).toBe(false)
            }
            else if (incoming.isResponse) {
                expect(incoming.commandOrResponse).toBe('response')
                expect(incoming.isCommand).toBe(false)
                expect(incoming.isLegacy).toBe(false)
            }
            else if (incoming.isLegacy) {
                expect(incoming.commandOrResponse).toBe('legacy')
                expect(incoming.isCommand).toBe(false)
                expect(incoming.isResponse).toBe(false)
            }
            else {
                throw new Error(`IncomingFrame.commandOrResponse must be of type 'command' | 'response' | 'legacy'`)
            }
        })
        // .repeaters doesn't always initialize correctly in describe.each, repeater test was moved to IFrame specific test
        test('.modulo', () => {
            if (outgoing.type === 'unnumbered') {
                expect(outgoing.modulo).toBe(8)
            }
            else {
                expect(outgoing.modulo).toBe(modulo)
            }
            if (incoming.type === 'unnumbered') {
                expect(incoming.modulo).toBe(8)
            }
            else {
                expect(incoming.modulo).toBe(modulo)
            }
        })
        test('.pollOrFinal', () => {
            expect(outgoing.pollOrFinal).toBeDefined()
            expect(incoming.pollOrFinal).toBeDefined()
        })
    })
    describe(OutgoingFrame, () => {
        describe(SupervisoryAbstract, () => {
            test('.modulo is mutable', () => {
                const frame = new RRFrame(sFrameConstructor)
                expect(frame.modulo).toBe(8)
                frame.modulo = 128
                expect(frame.modulo).toBe(128)
            })
        })
        describe('Unnumbered', () => {
            describe(TESTFrame, () => {
                test('.payload is mutable', () => {
                    const frame = new TESTFrame(outgoingConstructor)
                    expect(frame.payload).toBeUndefined()
                    frame.payload = 'hello world'
                    expect(frame.payload).toBe('hello world')
                })
            })
        })
        describe(IFrame, () => {
            const repeaters: Repeater[] = [
                {
                    callsign: 'N0CALL',
                    ssid: 0,
                    hasBeenRepeated: false
                }
            ]
            const outgoing = new IFrame({ destinationCallsign, destinationSsid, sourceCallsign, sourceSsid, receivedSequence: 0, sendSequence: 0, payload: 'hello world', repeaters })
            test('.modulo is mutable', () => {
                expect(outgoing.modulo).toBe(8)
                outgoing.modulo = 128
                expect(outgoing.modulo).toBe(128)
                outgoing.modulo = 8
            })
            test('.receivedSequence throws on invalid value', () => {
                expect(() => outgoing.receivedSequence = 1.2).toThrow()
                expect(() => outgoing.receivedSequence = -1).toThrow()
                expect(() => outgoing.receivedSequence = 8).toThrow()
                outgoing.modulo = 128
                expect(() => outgoing.receivedSequence = 8).not.toThrow()
                expect(() => outgoing.receivedSequence = 128).toThrow()
                outgoing.modulo = 8
            })
            test('.sendSequence throws on invalid value', () => {
                expect(() => outgoing.sendSequence = 1.2).toThrow()
                expect(() => outgoing.sendSequence = -1).toThrow()
                expect(() => outgoing.sendSequence = 8).toThrow()
                outgoing.modulo = 128
                expect(() => outgoing.sendSequence = 8).not.toThrow()
                expect(() => outgoing.sendSequence = 128).toThrow()
                outgoing.modulo = 8
            })
            test('.repeaters', () => { // Jest doesn't always initialize the .repeaters array in the describe.each above, causing it to fail. moved to a one off test
                const incoming: IncomingFrame = new IncomingFrame(outgoing.encode())
                expect(outgoing.repeaters).toEqual(repeaters)
                expect(() => {
                    outgoing.repeaters = [
                        {
                            callsign: '',
                            ssid: 0
                        }
                    ]
                }).toThrow()
                expect(() => {
                    outgoing.repeaters = [
                        {
                            callsign: '1234567',
                            ssid: 0
                        }
                    ]
                }).toThrow()
                expect(() => {
                    outgoing.repeaters = [
                        {
                            callsign: 'N0CALL',
                            ssid: -1
                        }
                    ]
                }).toThrow()
                expect(() => {
                    outgoing.repeaters = [
                        {
                            callsign: 'N0CALL',
                            ssid: 16
                        }
                    ]
                }).toThrow()
                expect(incoming.repeaters).toEqual(repeaters)
            })
            test('encodes object payloads', () => {
                outgoing.payload = Buffer.from('hello world')
                let incoming = new IncomingFrame(outgoing.encode())
                expect(incoming.payload?.toString()).toBe('hello world')
                const myObj = {
                    first: 'Taylor',
                    last: 'Reid',
                    age: 32
                }
                outgoing.payload = myObj
                incoming = new IncomingFrame(outgoing.encode())
                expect(incoming.payload?.toString()).toBe(JSON.stringify(myObj))
            })
            test('throws on invalid payload', () => {
                expect(() => outgoing.payload = Promise.resolve(42)).toThrow()
                expect(() => outgoing.payload = Symbol.for('foo')).toThrow()
            })
        })
    })
    describe(IncomingFrame, () => {
        const incoming: IncomingFrame = new IncomingFrame([192, 0, 130, 160, 136, 174, 98, 112, 224, 150, 144, 108, 148, 170, 180, 248, 150, 144, 108, 154, 160, 64, 226, 174, 144, 108, 134, 154, 158, 229, 3, 240, 33, 50, 49, 51, 53, 46, 53, 48, 78, 84, 49, 53, 56, 48, 54, 46, 52, 52, 87, 38, 32, 72, 97, 108, 101, 105, 119, 97, 32, 47, 32, 78, 111, 114, 116, 104, 32, 83, 104, 111, 114, 101, 32, 79, 97, 104, 117, 32, 72, 97, 119, 97, 105, 105, 32, 85, 83, 65, 192])
        test('.destinationCallsign', () => expect(incoming.destinationCallsign).toBe('APDW18'))
        test('.destinationCommandBit', () => expect((incoming.destinationCommandBit && incoming.sourceCommandBit) || (!incoming.destinationCommandBit && !incoming.sourceCommandBit)).toBe(true))
        test('.destinationReservedBitOne', () => expect(incoming.destinationReservedBitOne).toBe(false))
        test('.destinationReservedBitTwo', () => expect(incoming.destinationReservedBitTwo).toBe(false))
        test('.destinationSsid', () => expect(incoming.destinationSsid).toBe(0))
        test('.sourceCallsign', () => expect(incoming.sourceCallsign).toBe('KH6JUZ'))
        test(',sourceCommandBit', () => expect((incoming.destinationCommandBit && incoming.sourceCommandBit) || (!incoming.destinationCommandBit && !incoming.sourceCommandBit)).toBe(true))
        test('.sourceReservedBitOne', () => expect(incoming.sourceReservedBitOne).toBe(false))
        test('.sourceReservedBitTwo', () => expect(incoming.sourceReservedBitTwo).toBe(false))
        test('.sourceSsid', () => expect(incoming.sourceSsid).toBe(12))
        test('.commandOrResponse', () => expect(incoming.commandOrResponse).toBe('legacy'))
        test('.isCommand', () => expect(incoming.isCommand).toBe(false))
        test('.isResponse', () => expect(incoming.isResponse).toBe(false))
        test('.isLegacy', () => expect(incoming.isLegacy).toBe(true))
        test('.repeaters', () => expect(incoming.repeaters).toEqual(
            [
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
        )
        test('.type', () => expect(incoming.type).toBe('unnumbered'))
        test('.subtype', () => expect(incoming.subtype).toBe('UI'))
        test('.receivedSequence', () => expect(incoming.receivedSequence).toBeUndefined())
        test('.pollOrFinal',() => expect(incoming.pollOrFinal).toBe(false))
        test('.sendSequence', () => expect(incoming.sendSequence).toBeUndefined())
        test('.pid', () => expect(incoming.pid).toBe(240))
        test('.payload', () => expect(incoming.payload?.toString()).toBe('!2135.50NT15806.44W& Haleiwa / North Shore Oahu Hawaii USA'))
        test('.replyWith()', () => {
            expect(incoming.replyWith('RR', 0, false, 'command')).toBeInstanceOf(RRFrame)
            expect(incoming.replyWith('RNR', 0, false, 'command')).toBeInstanceOf(RNRFrame)
            expect(incoming.replyWith('REJ', 0, false, 'command')).toBeInstanceOf(REJFrame)
            expect(incoming.replyWith('SREJ', 0, false, 'command')).toBeInstanceOf(SREJFrame)
            expect(incoming.replyWith('SABME')).toBeInstanceOf(SABMEFrame)
            expect(incoming.replyWith('SABM')).toBeInstanceOf(SABMFrame)
            expect(incoming.replyWith('DISC')).toBeInstanceOf(DISCFrame)
            expect(incoming.replyWith('DM')).toBeInstanceOf(DMFrame)
            expect(incoming.replyWith('UA')).toBeInstanceOf(UAFrame)
            expect(incoming.replyWith('UI', 'hello world')).toBeInstanceOf(UIFrame)
            expect(incoming.replyWith('XID')).toBeInstanceOf(XIDFrame)
            expect(incoming.replyWith('TEST')).toBeInstanceOf(TESTFrame)
            expect(incoming.replyWith('I', 'hello world', 0, 0)).toBeInstanceOf(IFrame)
            
        })
    })
})

describe('misc', () => {
    test(validatePid, () => {
        expect(() => validatePid(-1)).toThrow()
        expect(() => validatePid(256)).toThrow()
    })
})

// describe('TNC', () => {
//     let tnc: TNC

//     beforeAll(async () => {
//         tnc = new TNC({ kissConnection }).listenOn(myCall, mySsid)
//     })

//     test(`properties initialized correctly`, () => {
//         expect(tnc.kissConnection).toBeInstanceOf(KissConnection)
//         expect(tnc.theirCall).toBeUndefined()
//         expect(tnc.theirReservedBitOne).toBe(false)
//         expect(tnc.theirReservedBitTwo).toBe(false)
//         expect(tnc.theirSsid).toBeUndefined()
//         expect(tnc.myCall).toBe(myCall)
//         expect(tnc.myReservedBitOne).toBe(false)
//         expect(tnc.myReservedBitTwo).toBe(false)
//         expect(tnc.mySsid).toBe(mySsid)
//         expect(tnc.modulo).toBe(8)
//         expect(tnc.repeaters).toEqual([])
//         expect(tnc.pid).toBe(240)
//         expect(tnc.t1).toBe(8000)
//         expect(tnc.retries).toBe(1)
//         expect(tnc.busy).toBe(false)
//     })

//     test(`connect() and disconnect()`, async () => {
//         expect(await tnc.connect({ theirCall, theirSsid })).not.toThrow()
//         // await setTimeout(2000)
//         expect(await tnc.disconnect()).not.toThrow()
//     })
// })