import { beforeAll, describe, expect, test } from 'bun:test'
import { Socket } from 'net'
import { SerialPort } from 'serialport'
import { setTimeout } from 'timers/promises'
import { KissConnection } from '../src'
import config from './config'

let kissConnection: KissConnection

describe('KissConnection', () => {

    beforeAll(async () => {
        Bun.spawn([config.MODEM_PATH])
        await setTimeout(2000)
        kissConnection = new KissConnection(config.KISS_CONSTRUCTOR)
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