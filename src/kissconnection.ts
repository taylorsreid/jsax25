import { Socket, createConnection } from 'net';
import { SerialPort } from 'serialport';
import { Duplex } from 'stream';
import { IncomingFrame } from './frames/incoming';
import { OutgoingFrame } from './frames/outgoing/outgoing';


export interface TcpKissConstructor {
    /**
     * The host address of your TNC or software modem's TCP port.
     * @example "localhost"
     */
    host: string
    /**
     * The port number of your TNC or software modem's TCP port. Typically 8001 for direwolf and 8100 for UZ7HO Soundmodem.
     */
    port: number
}

export interface SerialKissConstructor {
    /** The path to your TNC or software modem's serial port. */
    path: string,
    /** The baud rate of your TNC or software modem's serial port. */
    baudRate: number
}

/**
 * A SerialPort/Socket connection to a TNC or software modem that encodes, sends, receives, decodes, and emits AX.25 packets for amateur radio use.
 * 
 * See exported interface KissConnectionConstructor for constructor options.
 * 
 * send(frameOrFrames:KissFrameOptionalSource|KissFrameOptionalSource[]) takes unencoded kiss frame(s) (see interface KissInput for format), runs them through the above mentioned processes, and sends them immediately.
 * 
 * Call the listen(callback: (data: DecodedKissFrame) => { // do stuff }, filter?: ListenFilter) method to begin listening for packets. See method documentation for filtering specs.
 */
export class KissConnection extends Duplex {
    private _connection!: SerialPort | Socket;

    constructor(args: TcpKissConstructor | SerialKissConstructor) {
        super({ objectMode: true })

        this.connection = args

        // attach event listener upon instantiation
        this.connection.on('data', (data: Buffer) => {
            this.push(new IncomingFrame(data, this))
        });
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
            // known issue: SerialPort does not work with Bun due to libuv compatibility issues
            this._connection = new SerialPort({
                path: conn.path,
                baudRate: ('serialBaud' in conn && typeof conn.baudRate === 'number') ? conn.baudRate : 19200,
                lock: false
            })
        }
        else {
            throw new Error('You must specify the connection details for a TCP or serial KISS connection.')
        }
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

    public override _read(size: number): void {
        const data: Buffer | null = this.connection.read()
        if (data) {
            this.push(new IncomingFrame(Array.from(data), this))
        }
    }

    public override write(frame: OutgoingFrame, callback?: (error: Error | null | undefined) => void): boolean
    public override write(frame: OutgoingFrame, encoding: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean
    public override write(frame: OutgoingFrame, arg1?: any, arg2?: any): boolean {
        return super.write(frame, arg1, arg2)
    }

    public override _write(frame: OutgoingFrame | number[] | Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
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

}