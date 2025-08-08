import EventEmitter from 'events';
import { Duplex, PassThrough } from 'stream';
import { Socket, createConnection } from 'net';
import { SerialPort } from 'serialport';
import { KISSReceiver } from 'kiss-tnc';
import { InboundFrame } from './index.js';
import { OutboundFrame } from 'frames/outbound/outbound.js';
import { DEFAULT_SERIAL_BAUD, validateBaudRate } from 'misc.js';

interface BaseKissConstructor {
    txBaud?: number
}

export interface TcpKissConstructor extends BaseKissConstructor {
    host: string
    port: number
}

export interface SerialKissConstructor extends BaseKissConstructor {
    /** The path to your TNC or software modem's serial port. No default. */
    path: string,
    /** A custom baud rate for your TNC or software modem's serial port. Default 19200 if not defined. */
    serialBaud?: number
}

/**
 * A SerialPort/Socket connection to a TNC or software modem that encodes, compresses (optional), sends, receives, decodes, decompresses (if necessary), and emits AX.25 packets for amateur radio use.
 * See exported interface KissConnectionConstructor for constructor options.
 *
 * Takes unencoded kiss frame(s) (see interface KissInput for format), runs them through the above mentioned processes, and sends them immediately.
 *
 * Call the listen(callback: (data: DecodedKissFrame) => { // do stuff }, filter?: ListenFilter) method to begin listening for packets. See method documentation for filtering specs.
 *
 * @example
 * send(frameOrFrames:KissFrameOptionalSource|KissFrameOptionalSource[])
 */
export class KissConnection extends EventEmitter {
    private _sendCx: Socket | SerialPort
    private _listenCx: KISSReceiver
    private _txBaud: number
    private _connection: PassThrough

    constructor(args: TcpKissConstructor | SerialKissConstructor) {

        super()

        this.txBaud = validateBaudRate(args.txBaud)

        this.setConnection(args)

        this._connection.on('data', data => this._sendCx.write(data))

        // attach event listener upon object instantiation
        this._listenCx.on('data', (data: Buffer) => {
            const frame = new InboundFrame(Array.from(data), this)

            this.emit('data', frame);
            this._connection.emit('data', frame)
        });
    }

    public on<K>(eventName: 'data', listener: (inboundFrame: InboundFrame) => void): this {
        return super.on(eventName, listener)
    }

    public once<K>(eventName: 'data', listener: (inboundFrame: InboundFrame) => void): this {
        return super.on(eventName, listener)
    }

    public get connection(): Duplex {
        return this._connection;
    }

    public setConnection(conn: Socket | SerialPort | TcpKissConstructor | SerialKissConstructor) {
        let baseConnection: Socket | SerialPort;

        if (conn instanceof Socket || conn instanceof SerialPort) {
            baseConnection = conn
        }
        else if ('host' in conn && 'port' in conn) {
            baseConnection = createConnection({
                host: conn.host,
                port: conn.port
            })
        }
        else if ('path' in conn) {
            // throw error if using SerialPort with Bun due to a bug in Bun
            if (process.versions.bun) {
                throw new Error('Serial connections with Bun are not supported yet due to a bug in Bun.\nRun in Node or rerun with Bun using a TCP connection.\nSee https://github.com/oven-sh/bun/issues/10704 and https://github.com/oven-sh/bun/issues/4622 for details.')
            }
            baseConnection = new SerialPort({
                path: conn.path,
                baudRate: ('serialBaud' in conn && typeof conn.serialBaud === 'number') ? conn.serialBaud : DEFAULT_SERIAL_BAUD,
                lock: false
            })
        }
        else {
            throw new Error('You must specify the connection details for a TCP or serial connection.')
        }

        this._listenCx = baseConnection.pipe(new KISSReceiver({ emitObject: false, emitCommandByte: false }))
        this._sendCx = baseConnection
    }

    public get txBaud(): number {
        return this._txBaud;
    }
    public set txBaud(value: number) {
        if (value <= 0) {
            throw new Error(`${value} is an invalid transmit baud rate. Transmit baud rates must be a positive number.`)
        }
        this._txBaud = value
    }

    /**
     * Check if the current connection is a serial connection.
     */
    public get isSerial(): boolean {
        return this.connection instanceof SerialPort
    }

    /**
     * Check if the current connection is a TCP socket connection.
     */
    public get isTcp(): boolean {
        return this.connection instanceof Socket
    }

    /**
     * Check to see if the connection is closed.
     */
    public get closed(): boolean {
        return this.connection.closed
    }

    /**
     * Close the current serial or TCP connection.
     */
    public end(): void {
        this.connection.end()
    }

    public async getNextReceived(): Promise<InboundFrame> {
        return new Promise((resolve) => {
            this.once('data', (f) => {
                resolve(f)
            })
        })
    }

    public send(frame: OutboundFrame | number[]): Promise<void> {
        if (frame instanceof OutboundFrame) {
            frame = frame.encoded
        }

        if (frame.length < 17) {
            return Promise.reject(new Error(`Encoded packet is below the AX.25 minimum of 136 bits. The current length is ${frame.length * 8} bits.`))
        }

        return new Promise((resolve, reject) => {
            this._sendCx.write(new Uint8Array(frame), (err: Error) => {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

}
