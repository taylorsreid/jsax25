import { NetConnectOpts, Socket, createConnection } from 'net';
import { SerialPort } from 'serialport';
import { EventEmitter } from 'stream';
import { IncomingFrame } from './frames/incoming';
import type { MockModemConstructor, SerialConstructor} from './types';
import { MockModem } from './mockmodem';

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
    private conn: SerialPort | Socket | MockModem
    private tcpHost: string | undefined
    private tcpPort: number | undefined
    private serialPath: string | undefined
    private serialBaudRate: number | undefined

    constructor(args: NetConnectOpts | SerialConstructor | MockModemConstructor) {

        super()

        if ('host' in args && 'port' in args) {
            this.conn = createConnection({
                host: this.tcpHost ??= args.host, // assigning and passing as argument in one statement
                port: this.tcpPort ??= args.port
            })
        }

        if ('path' in args) {
            // throw error if using SerialPort with Bun due to a bug in Bun
            if (process.versions.bun) {
                throw new Error('Serial connections with Bun are not supported yet due to a bug in Bun.\nRun in Node or rerun with Bun using a TCP connection.\nSee https://github.com/oven-sh/bun/issues/10704 and https://github.com/oven-sh/bun/issues/4622 for details.')
            }
            this.conn = new SerialPort({
                path: this.serialPath ??= args.path,
                baudRate: this.serialBaudRate ??= ('baudRate' in args) ? args.baudRate! : 1200,
                lock: false
            })
        }

        if ('mockModem' in args) {
            console.warn('You have instantiated a KISS connection with the useMockModem option enabled. This allows you to instantiate the class as if it were a KISS connection, but anything written to the connection will be simply output to the console.')
            this.conn = new MockModem()
        }

        // attach event listener upon object instantiation
        this.conn.on('data', (data: number[]) => {
            this.emit('data', new IncomingFrame(data));
        });

    }

    /**
     * Check if the current connection is a serial connection.
     */
    public isSerial(): boolean {
        return this.conn instanceof SerialPort
    }

    /**
     * Check if the current connection is a TCP socket connection.
     */
    public isTcp(): boolean {
        return this.conn instanceof Socket
    }

    /**
     * Check if the current connection is a MockModem.
     */
    public isMockModem(): boolean {
        return this.conn instanceof MockModem
    }

    public getSerialPath(): string | undefined {
        return this.serialPath
    }
    public getSerialBaudRate(): number | undefined {
        return this.serialBaudRate
    }
    public getTcpHost(): string | undefined {
        return this.tcpHost
    }
    public getTcpPort(): number | undefined {
        return this.tcpPort
    }

    /**
     * Check to see if the connection is open.
     */
    public isConnected(): boolean {
        return !this.conn.closed
    }

    /**
     * Close the current serial or TCP connection.
     */
    public close(): void {
        this.conn.end()
    }

    /**
     * Get the current connection in use to manage it manually.
     * @returns a configured SerialPort, (TCP) Socket, or MockModem instance.
     */
    public getConnection(): SerialPort | Socket | MockModem {
        return this.conn
    }

}