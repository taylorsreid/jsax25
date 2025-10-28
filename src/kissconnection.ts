import { OutgoingFrame } from 'frames/outgoing/outgoing.js';
import { Socket, createConnection } from 'net';
import { SerialPort } from 'serialport';
import Stream from 'stream';
import { IncomingFrame } from './index.js';

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
 * 
 * See exported interface KissConnectionConstructor for constructor options.
 * 
 * send(frameOrFrames:KissFrameOptionalSource|KissFrameOptionalSource[]) takes unencoded kiss frame(s) (see interface KissInput for format), runs them through the above mentioned processes, and sends them immediately.
 * 
 * Call the listen(callback: (data: DecodedKissFrame) => { // do stuff }, filter?: ListenFilter) method to begin listening for packets. See method documentation for filtering specs.
 */
export class KissConnection extends Stream.Duplex {
    private _connection!: SerialPort | Socket;
    private _txBaud!: number;

    constructor(args: TcpKissConstructor | SerialKissConstructor) {
        super({ objectMode: true })

        this.txBaud = args.txBaud ?? 1200

        this.connection = args

        // TODO: test _read method
        // attach event listener upon object instantiation
        // this.connection.on('data', (data: Buffer) => {
        //     this.push(new IncomingFrame(data, this))
        // });
    }

    public get connection(): SerialPort | Socket {
        return this._connection;
    }
    public set connection(conn: Socket | SerialPort | TcpKissConstructor | SerialKissConstructor) {
        if (conn instanceof Socket || conn instanceof SerialPort) {
            this._connection = conn
        }
        else if ('host' in conn && 'port' in conn) {
            this._connection = createConnection({
                host: conn.host,
                port: conn.port
            })
        }
        else if ('path' in conn) {
            // throw error if using SerialPort with Bun due to a bug in Bun
            if (process.versions.bun) {
                throw new Error('Serial connections with Bun are not supported yet due to a bug in Bun.\nRun in Node or rerun with Bun using a TCP connection.\nSee https://github.com/oven-sh/bun/issues/10704 and https://github.com/oven-sh/bun/issues/4622 for details.')
            }
            this._connection = new SerialPort({
                path: conn.path,
                baudRate: ('serialBaud' in conn && typeof conn.serialBaud === 'number') ? conn.serialBaud : 19200,
                lock: false
            })
        }
        else {
            throw new Error('You must specify the connection details for a TCP or serial connection.')
        }
    }

    public get txBaud(): number {
        return this._txBaud;
    }
    public set txBaud(value: number) {
        if (value <= 0 || !Number.isInteger(value)) {
            throw new Error(`${value} is an invalid transmit baud rate. Transmit baud rates must be a positive integer.`)
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
     * Close the current serial or TCP connection.
     */
    public override _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
        this.connection.end()
        callback(error)
    }

    // TODO: does this work?
    public override _read(size: number): void {
        const data: Buffer | null = this.connection.read()
        this.push(data ? new IncomingFrame(data, this) : data)
    }

    public override write(frame: OutgoingFrame, callback?: (error: Error | null | undefined) => void): boolean
    public override write(frame: OutgoingFrame, encoding: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean
    public override write(frame: OutgoingFrame, arg1?: any, arg2?: any): boolean {
        return super.write(frame, arg1, arg2)
    }

    public override _write(frame: OutgoingFrame | number[], _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        if (frame instanceof OutgoingFrame) {
            frame = frame.encoded
        }
        
        let error: Error | null = null
        if (frame.length < 17) {
            error = new Error(`Encoded packet is below the AX.25 minimum of 136 bits. The current length is ${frame.length * 8} bits.`)
        }
        else {
            this.connection.write(new Uint8Array(frame), (err: Error | null) => error = err)
        }
        
        // if (error) {
        //     this.emit('error', error)
        // }
        callback(error)
    }

    public override addListener(event: 'close', listener: () => void): this
    public override addListener(event: 'data', listener: (incomingFrame: IncomingFrame) => void): this
    public override addListener(event: 'drain', listener: () => void): this
    public override addListener(event: 'end', listener: () => void): this
    public override addListener(event: 'error', listener: (err: Error) => void): this
    public override addListener(event: 'finish', listener: () => void): this
    public override addListener(event: 'pause', listener: () => void): this
    public override addListener(event: "pipe", listener: (src: Stream.Readable) => void): this
    public override addListener(event: 'readable', listener: () => void): this
    public override addListener(event: 'resume', listener: () => void): this
    public override addListener(event: "unpipe", listener: (src: Stream.Readable) => void): this
    public override addListener(event: string, listener: any): this {
        return super.addListener(event, listener)
    }

    public override on(event: 'close', listener: () => void): this
    public override on(event: 'data', listener: (incomingFrame: IncomingFrame) => void): this
    public override on(event: 'drain', listener: () => void): this
    public override on(event: 'end', listener: () => void): this
    public override on(event: 'error', listener: (err: Error) => void): this
    public override on(event: 'finish', listener: () => void): this
    public override on(event: 'pause', listener: () => void): this
    public override on(event: "pipe", listener: (src: Stream.Readable) => void): this
    public override on(event: 'readable', listener: () => void): this
    public override on(event: 'resume', listener: () => void): this
    public override on(event: "unpipe", listener: (src: Stream.Readable) => void): this
    public override on(event: string, listener: any): this {
        return super.on(event, listener)
    }

    public override once(event: 'close', listener: () => void): this
    public override once(event: 'data', listener: (incomingFrame: IncomingFrame) => void): this
    public override once(event: 'drain', listener: () => void): this
    public override once(event: 'end', listener: () => void): this
    public override once(event: 'error', listener: (err: Error) => void): this
    public override once(event: 'finish', listener: () => void): this
    public override once(event: 'pause', listener: () => void): this
    public override once(event: "pipe", listener: (src: Stream.Readable) => void): this
    public override once(event: 'readable', listener: () => void): this
    public override once(event: 'resume', listener: () => void): this
    public override once(event: "unpipe", listener: (src: Stream.Readable) => void): this
    public override once(event: string, listener: any): this {
        return super.once(event, listener)
    }

    public override prependListener(event: 'close', listener: () => void): this
    public override prependListener(event: 'data', listener: (incomingFrame: IncomingFrame) => void): this
    public override prependListener(event: 'drain', listener: () => void): this
    public override prependListener(event: 'end', listener: () => void): this
    public override prependListener(event: 'error', listener: (err: Error) => void): this
    public override prependListener(event: 'finish', listener: () => void): this
    public override prependListener(event: 'pause', listener: () => void): this
    public override prependListener(event: "pipe", listener: (src: Stream.Readable) => void): this
    public override prependListener(event: 'readable', listener: () => void): this
    public override prependListener(event: 'resume', listener: () => void): this
    public override prependListener(event: "unpipe", listener: (src: Stream.Readable) => void): this
    public override prependListener(event: string, listener: any): this {
        return super.prependListener(event, listener)
    }

    public override prependOnceListener(event: 'close', listener: () => void): this
    public override prependOnceListener(event: 'data', listener: (incomingFrame: IncomingFrame) => void): this
    public override prependOnceListener(event: 'drain', listener: () => void): this
    public override prependOnceListener(event: 'end', listener: () => void): this
    public override prependOnceListener(event: 'error', listener: (err: Error) => void): this
    public override prependOnceListener(event: 'finish', listener: () => void): this
    public override prependOnceListener(event: 'pause', listener: () => void): this
    public override prependOnceListener(event: "pipe", listener: (src: Stream.Readable) => void): this
    public override prependOnceListener(event: 'readable', listener: () => void): this
    public override prependOnceListener(event: 'resume', listener: () => void): this
    public override prependOnceListener(event: "unpipe", listener: (src: Stream.Readable) => void): this
    public override prependOnceListener(event: string, listener: any): this {
        return super.prependOnceListener(event, listener)
    }

    public override removeListener(event: 'close', listener: () => void): this
    public override removeListener(event: 'data', listener: (incomingFrame: IncomingFrame) => void): this
    public override removeListener(event: 'drain', listener: () => void): this
    public override removeListener(event: 'end', listener: () => void): this
    public override removeListener(event: 'error', listener: (err: Error) => void): this
    public override removeListener(event: 'finish', listener: () => void): this
    public override removeListener(event: 'pause', listener: () => void): this
    public override removeListener(event: "pipe", listener: (src: Stream.Readable) => void): this
    public override removeListener(event: 'readable', listener: () => void): this
    public override removeListener(event: 'resume', listener: () => void): this
    public override removeListener(event: "unpipe", listener: (src: Stream.Readable) => void): this
    public override removeListener(event: string, listener: any): this {
        return super.removeListener(event, listener)
    }

    // public override emit(event: 'close'): boolean
    // public override emit(event: 'data', chunk: any): boolean
    // public override emit(event: 'drain'): boolean
    // public override emit(event: 'end'): boolean
    // public override emit(event: 'error', err: Error): boolean
    // public override emit(event: 'finish'): boolean
    // public override emit(event: 'pause'): boolean
    // public override emit(event: "pipe", src: Stream.Readable): boolean
    // public override emit(event: 'readable'): boolean
    // public override emit(event: 'resume'): boolean
    // public override emit(event: "unpipe", src: Stream.Readable): boolean
    // public override emit(event: string, ...args: any[]): boolean {
    //     return super.emit(event, ...args)
    // }

}