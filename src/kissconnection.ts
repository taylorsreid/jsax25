import { Socket, createConnection } from 'net';
import { SerialPort } from 'serialport';
import { IncomingFrame } from './index.js';
import EventEmitter from 'events';

interface BaseKissConstructor {
    txBaud?: number
}

export interface TcpKissConstructor extends BaseKissConstructor {
    tcpHost: string
    tcpPort: number
}

export interface SerialKissConstructor extends BaseKissConstructor {
    /** The path to your TNC or software modem's serial port. No default. */
    serialPort: string,
    /** A custom baud rate for your TNC or software modem's serial port. Default 19200 if not defined. */
    serialBaud?: number
}

/**
 * A SerialPort/Socket connection to a TNC or software modem that encodes, compresses (optional), sends, receives, decodes, decompresses (if necessary), and emits AX.25 packets for amateur radio use.
 * 
 * See exported interface KissConnectionConstructor for constructor options.
 * 
 * send(frameOrFrames:KissFrameOptionalSource|KissFrameOptionalSource[]) takes unencoded kiss frame(s) (see interface KissInput for format), runs them through the above mentioned processes, and sends them immediately.
 * 
 * Call the listen(callback: (data: DecodedKissFrame) => { // do stuff }, filter?: ListenFilter) method to begin listening for packets. See method documentation for filtering specs.
 */
export class KissConnection extends EventEmitter {
    private _connection: SerialPort | Socket;
    private _tcpHost: string | undefined;
    private _tcpPort: number | undefined;
    private _serialPort: string | undefined;
    private _serialBaud: number | undefined;
    private _txBaud: number;

    constructor(args: TcpKissConstructor | SerialKissConstructor) {

        super()

        this.txBaud = args.txBaud ?? 1200

        this.connection = args

        // attach event listener upon object instantiation
        this.connection.on('data', (data: number[]) => {
            this.emit('data', new IncomingFrame(data, this));
        });
    }

    public on<K>(eventName: 'data', listener: (incomingFrame: IncomingFrame) => void): this {
        return super.on(eventName, listener)
    }

    public once<K>(eventName: 'data', listener: (incomingFrame: IncomingFrame) => void): this {
        return super.on(eventName, listener)
    }

    public get connection(): SerialPort | Socket {
        return this._connection;
    }
    public set connection(conn: Socket | SerialPort | TcpKissConstructor | SerialKissConstructor) {
        if (conn instanceof Socket || conn instanceof SerialPort) {
            this._connection = conn
        }
        else if ('tcpHost' in conn && 'tcpPort' in conn) {
            this._connection = createConnection({
                host: this.tcpHost ??= conn.tcpHost, // assigning and passing as argument in one statement
                port: this.tcpPort ??= conn.tcpPort
            })
        }
        else if ('serialPort' in conn) {
            // throw error if using SerialPort with Bun due to a bug in Bun
            if (process.versions.bun) {
                throw new Error('Serial connections with Bun are not supported yet due to a bug in Bun.\nRun in Node or rerun with Bun using a TCP connection.\nSee https://github.com/oven-sh/bun/issues/10704 and https://github.com/oven-sh/bun/issues/4622 for details.')
            }
            this._connection = new SerialPort({
                path: this.serialPort ??= conn.serialPort,
                baudRate: this.serialBaud ??= ('serialBaud' in conn && typeof conn.serialBaud === 'number') ? conn.serialBaud : 19200,
                lock: false
            })
        }
    }

    public get tcpHost(): string | undefined {
        return this._tcpHost;
    }
    private set tcpHost(value: string | undefined) {
        this._tcpHost = value;
    }

    public get tcpPort(): number | undefined {
        return this._tcpPort;
    }
    private set tcpPort(value: number | undefined) {
        this._tcpPort = value;
    }

    public get serialPort(): string | undefined {
        return this._serialPort;
    }
    private set serialPort(value: string | undefined) {
        this._serialPort = value;
    }

    public get serialBaud(): number | undefined {
        return this._serialBaud;
    }
    private set serialBaud(value: number | undefined) {
        this._serialBaud = value;
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
        return this._connection.closed
    }

    /**
     * Close the current serial or TCP connection.
     */
    public end(): void {
        this._connection.end()
    }

    public async getNextReceived(): Promise<IncomingFrame> {
        return new Promise((resolve) => {
            this.once('data', (f) => {
                resolve(f)
            })
        })
    }

}