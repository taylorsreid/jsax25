import { Socket, createConnection } from 'net';
import { SerialPort } from 'serialport';
import { EventEmitter } from 'stream';
import { IncomingFrame } from './incomingframe';
import { type TcpKissConstructor, type SerialKissConstructor, type MockModemKissConstructor, type OutgoingFrameConstructor } from './types';
import { MockModem } from './mockmodem';
import { OutgoingFrame } from './outgoingframe';

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
    private myCallsign: string
    private mySsid: number
    private conn: SerialPort | Socket | MockModem
    private useCompression: boolean
    private tcpHost: string | undefined
    private tcpPort: number | undefined
    private serialPort: string | undefined
    private serialBaud: number | undefined

    constructor(args: TcpKissConstructor | SerialKissConstructor | MockModemKissConstructor) {

        super()

        // use setters for validation
        this.setMyCallsign(args.myCallsign)
        this.setMySsid(args.mySsid ?? 0)
        this.setUseCompression(args.useCompression ?? false)

        if ('tcpHost' in args && 'tcpPort' in args) {
            this.conn = createConnection({
                host: this.tcpHost ??= args.tcpHost,
                port: this.tcpPort ??= args.tcpPort
            })
        }

        if ('serialPort' in args) {
            // throw error if using SerialPort with Bun due to a bug in Bun
            if (process.versions.bun) {
                throw new Error('Serial connections with Bun are not supported yet due to a bug in Bun.\nRun in Node or rerun with Bun using a TCP connection.\nSee https://github.com/oven-sh/bun/issues/10704 and https://github.com/oven-sh/bun/issues/4622 for details.')
            }
            this.conn = new SerialPort({
                path: this.serialPort ??= args.serialPort,
                baudRate: this.serialBaud ??= args.serialBaud ??= 1200,
                lock: false
            })
        }

        if ('useMockModem' in args) {
            console.warn('You have instantiated a KISS connection with the useMockModem option enabled. This allows you to instantiate the class as if it were a KISS connection, but anything written to the connection will be simply output to the console.')
            this.conn = new MockModem()
        }

        // TODO: FIGURE OUT WHETHER TO KEEP THIS
        // this.conn.on('error', () => { }) // suppress built in SerialPort and Socket warning messages

        // attach event listener upon object instantiation
        this.conn.on('data', (data: number[]) => {
            this.emit('data', new IncomingFrame(data, this));
        });

    }

    public getSerialPort(): string | undefined {
        return this.serialPort
    }
    public getSerialBaud(): number | undefined {
        return this.serialBaud
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

    public getMyCallsign(): string {
        return this.myCallsign
    }

    public setMyCallsign(myCallsign: string): this {

        // pre flight check
        if (myCallsign.length < 1 || myCallsign.length > 6) {
            throw new Error(`'${myCallsign}' is not a valid callsign. Callsigns must have a length from 1 to 6 characters, inclusive.`)
        }

        // uppercase per AX.25 spec, trim for prettiness
        this.myCallsign = myCallsign.toUpperCase().trim()
        return this
    }

    public getMySsid(): number {
        return this.mySsid
    }

    public setMySsid(mySsid: number): this {

        // pre flight check
        if (mySsid < 0 || mySsid > 15) {
            throw new Error(`${mySsid} is not a valid SSID. SSIDs must be between 0 and 15, inclusive.`)
        }

        this.mySsid = mySsid
        return this
    }

    public setUseCompression(useCompression: boolean): this {
        this.useCompression = useCompression
        return this
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

    public getUseCompression(): boolean {
        return this.useCompression ?? false
    }

    /**
     * Get the current connection in use to manage it manually.
     * @returns a configured SerialPort, (TCP) Socket, or MockModem instance.
     */
    public getConnection(): SerialPort | Socket | MockModem {
        return this.conn
    }

    public send(outgoingpacket: OutgoingFrame): void {
        outgoingpacket.setKissConnection(this).send()
    }

    public createOutgoing(args?: OutgoingFrameConstructor): OutgoingFrame {
        args ??= {}
        args.sourceCallsign ??= this.getMyCallsign(),
        args.sourceSsid ??= this.getMySsid(),
        args.kissConnection ??= this
        return new OutgoingFrame(args)
    }

}