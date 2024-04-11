# JSAX25
A Javascript connector class for amateur radio KISS connections that encodes, compresses, decompresses, and decodes KISS + AX.25 frames 
in conjunction with a software modem like Direwolf or UZ7HO SoundModem, or with a hardware TNC like a Mobilinkd.

## How to Use
### import the class
    import { KissConnection } from 'jsax25'

### Create a connection
There's a multitude of constructor options that you can use:

    // Defaults to a TCP KISS connection at 127.0.0.1:8100
    const conn = new KissConnection()

    // You can also set your own TCP options.
    const conn = new KissConnection({
        tcpHost: '192.168.0.1'
        tcpHost: 8080
    })

    // You can also use a serial port, this will override any TCP options that you set.
    const conn = new KissConnection({ 
        serialPort: 'COM1'
    })

    // A more complex example, a serial connection with a custom baud rate, Brotli compression enabled, and connection errors suppressed.
    //You can use different combinations together, except for serialPort and tcp options, you must pick one.
    const conn = new KissConnection({

        serialPort: 'COM2',

        serialBaud: 9600 // Default if not set is 1200.

        compression: true, // Default is false, set to true to reduce bandwidth usage.
                           // KissConnection will automatically detect if the other callsign + SSID combo is using this library,
                           // and compress packets after exchanging initial packets.
                           // Enabling compression does not break backwards compatibility with sources sending uncompressed data,
                           // and packets may still be sent uncompressed if the compression effect isn't significant.

        suppressConnectionErrors: true //useful if you are building a CLI app like a BBS and want to handle errors on your own without them being printed to the console.
    })

### Create an encoded packet
    let myFrame: KissInput = {
        sourceCallsign: 'MY0CALL',
        sourceSsid: 0, // Default is 0 if not specified.
        destinationCallsign: 'THEIR0CALL',
        destinationSsid: 1, // Default is 0 if not specified.
        payload: 'Hello world!', // Also supports automatic stringification of number, JSON / object, and array types.
        repeaters: [ // Optional repeater path you wish to use in sending the packet, Default none aka simplex if not defined.
            { callsign: 'RPT0CALL', ssid: 1, hasBeenRepeated: false }, // be very careful with hasBeenRepeated, as it can cause unexpected behavior when use improperly
            { callsign: 'RPT1CALL', ssid: 2 } // leave it undefined if you're not sure
        ],
        frameType: 'unnumbered', // Optional and defaults to 'unnumbered' valid choices are 'information'|'supervisory'|'unnumbered'. Only unnumbered is implemented at this time.
        pid: number // Optional, indicates which layer 3 protocol is in use, default is 240 which is none. Leave this alone unless you're very sure about it.
    }

### Send a packet
    conn.send(myFrame) // encodes and sends packet immediately
    conn.send([myFrame, myFrame]) // also accepts an array of unencoded packets, encodes them and sends them upon finishing encoding all of them.

### Manual encoding and sending of packets (optional, not reccomended)
    const encodedFrame: EncodedKissFrame = conn.encode(myFrame) // not necessary but if for some reason you wish to manually encode and manage your frames, you can do this
    const manualConn = conn.getConnection() // returns the SerialPort or TCP Socket instance
    manualConn.write(new Uint8Array(encodedFrame))

### Listening for data
    conn.on('data', (decodedFrame:KissOutput) => {
		console.log(decodedFrame)
        // or do some other stuff
	})

    // decoded data looks like this:
    {
        destinationCallsign: string, // The destination amateur radio callsign.

        destinationSsid: number, // The destination's SSID. Default 0 if not defined.

        destinationCommand: boolean, // command = true = 1, response = false = 0, inverted from sourceCommand. Whether the frame is a command frame from the destination or 
                                     // not. Must be opposite of sourceCommand.

        sourceCallsign: string, // The sender's amateur radio callsign.

        sourceSsid: number, // The sender's SSID. Default 0 if not defined.

        sourceCommand: boolean // command = true = 0, response = false = 1. inverted from destinationCommand. Whether the frame is a command frame from the source or
                               // not. Must be opposite of destinationCommand.

        sourceAcceptsCompression: boolean, // If the sender is using this library, indicates whether they have compression enabled using the Brotli algorithm.

        payloadIsCompressed: boolean, // If the sender is using this library, indicates whether the payload is compressed or not.
                                      // The payload is not always compressed even if compression is enabled,
                                      // for instance if the compressed version is longer than the uncompressed version.

        payload: Serializable, // The payload/body of the packet frame. Can be of multiple different types just like in the input,
                               // see exported Serializable interface for exact allowed types.
        
        repeaters: Repeater[], // The repeater path that the packet was received on. Empty if no repeaters used.

        frameType: 'information'|'supervisory'|'unnumbered', // Which of the allowed frame types the frame is, unnumbered is the most common in APRS and is the default.

        pid: number // The PID indicates which layer 3 protocol is in use, default is 240 which is none.
    }

### Manual listening and decoding of data (optional, not reccomended)
    conn.on('raw', (data:EncodedKissFrame) => {
        const decoded:KissOutput = conn.decode(data)
        // or do other stuff like store them
    })

