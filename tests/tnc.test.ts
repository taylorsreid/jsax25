import { Subprocess } from 'bun'
import { beforeAll, expect, test } from 'bun:test'
import { setTimeout } from 'timers/promises'
import { KissConnection, TNC } from '../src'
import config from './config'

let tnc: TNC
let modem: Subprocess

beforeAll(async () => {
    modem = Bun.spawn([config.MODEM_PATH])
    await setTimeout(2000)
    tnc = new TNC({
        kissConnection: config.KISS_CONSTRUCTOR
    }).listenOn(config.MY_CALL, config.MY_SSID)
})

test(`properties initialized correctly`, () => {
    expect(tnc.kissConnection).toBeInstanceOf(KissConnection)
    expect(tnc.theirCall).toBeUndefined()
    expect(tnc.theirReservedBitOne).toBeFalse()
    expect(tnc.theirReservedBitTwo).toBeFalse()
    expect(tnc.theirSsid).toBeUndefined()
    expect(tnc.myCall).toBe(config.MY_CALL)
    expect(tnc.myReservedBitOne).toBeFalse()
    expect(tnc.myReservedBitTwo).toBeFalse()
    expect(tnc.mySsid).toBe(config.MY_SSID)
    expect(tnc.modulo).toBe(8)
    expect(tnc.repeaters).toEqual([])
    expect(tnc.pid).toBe(240)
    expect(tnc.t1).toBe(8000)
    expect(tnc.retries).toBe(1)
    expect(tnc.busy).toBeFalse()
})

test(`connect() and disconnect()`, async () => {
    expect(await tnc.connect({
        theirCall: config.THEIR_CALL,
        theirSsid: config.THEIR_SSID
    })).not.toThrowError()
    await setTimeout(2000)
    expect(await tnc.disconnect()).not.toThrowError()
})