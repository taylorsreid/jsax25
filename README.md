
# <center>JSAX25</center>
<center>AX.25 amateur packet radio for Node, made simple.</center>
<br />

[![GitHub](https://img.shields.io/badge/Github-black?style=flat&logo=github)](https://github.com/taylorsreid/jsax25)
[![TypeDoc](https://img.shields.io/badge/TypeDoc-black?style=flat&logo=github-pages)](https://taylorsreid.github.io/jsax25/)
[![npm version](https://badge.fury.io/js/jsax25.svg)](https://badge.fury.io/js/jsax25)
[![Coverage](https://img.shields.io/badge/coverage-98%25-green?style=flat&logo=jest)](https://github.com/taylorsreid/jsax25/blob/main/tests.test.ts)
[![Codefactor](https://www.codefactor.io/repository/github/taylorsreid/jsax25/badge)](https://www.codefactor.io/repository/github/taylorsreid/jsax25/)

## Installation
Use your favorite JS package manager to add the package to your project:
```bash
npm install jsax25      # npm

yarn add jsax25         # yarn

bun add jsax25          # bun
```

## Usage
This library assumes that you already have some understanding of the AX.25 standard.

The latest revision of the AX.25 standard can be found [here](https://wiki.oarc.uk/_media/packet:ax25.2.2.10.pdf).

### Simple Example: Send a Test Frame
```ts
import { createConnection } from "net";
import { IncomingFrame, TESTFrame } from "jsax25";

const test = new TESTFrame({
    destinationCallsign: 'N0CALL',
    destinationSsid: 10,
    sourceCallsign: 'N0CALL',
    sourceSsid: 7,
    payload: 'hello world'
})

createConnection({
    host: 'localhost',
    port: 8001
})
.on('data', (chunk) => console.log(new IncomingFrame(chunk)))
.write(test.encode())
```

### Intermediate Example: Listen and Respond to UI Frames
```ts
import { createConnection, Socket } from "net";
import { IncomingFrame, UIFrame } from "jsax25";

const MY_CALL: string = 'N0CALL'
const MY_SSID: number = 7

// create a KISS connection to your running software modem or hardware TNC
const kissConnection: Socket = createConnection({
    host: 'localhost',
    port: 8001
})

// setup an event listener
kissConnection.on('data', (chunk) => {
    // create an IncomingFrame object from the chunk to decode it
    const incoming: IncomingFrame = new IncomingFrame(chunk)

    // do something with the data
    console.log(incoming)
    if (incoming.destinationCallsign === MY_CALL && incoming.destinationSsid === MY_SSID && incoming.subtype === 'UI') {
        const reply: UIFrame = incoming.replyWith('UI', `${MY_CALL}-${MY_SSID} has received your frame. Greetings!`)
        kissConnection.write(reply.encode())
    }
})
```

### Complex Example: Connect and Disconnect from a Session
```ts
import { DISCFrame, IncomingFrame, SABMFrame } from "jsax25";
import { SerialPort } from "serialport"

const MY_CALL: string = 'N0CALL'
const MY_SSID: number = 7

const THEIR_CALL: string = 'N0CALL'
const THEIR_SSID: number = 10

async function connect(destinationCallsign: string, destinationSsid: number, sourceCallsign: string, sourceSsid: number, kissConnection: SerialPort): Promise<void> {
    return new Promise((resolve, reject) => {
        const sabm: SABMFrame = new SABMFrame({ destinationCallsign, destinationSsid, sourceCallsign, sourceSsid }) // create an SABM or SABME frame

        const handleConnection = (data: Buffer) => { // create a handler function for the on('data') event
            const response: IncomingFrame = new IncomingFrame(data)
            if (response.destinationCallsign === MY_CALL && response.destinationSsid === MY_SSID) { // if it's addressed to us
                if (response.subtype === 'UA') { // success
                    resolve()
                }
                else if (response.subtype === 'DM') { // failure
                    reject(new Error('The remote station is not ready for connection.'))
                }
                else { // unknown response
                    reject(new Error(`The remote station responded with a ${response.subtype} frame. Expected a UA or DM frame.`))
                }
                kissConnection.removeListener('data', handleConnection) // don't forget to remove the handler
            }
        }
        kissConnection.on('data', handleConnection) // set the handler
        kissConnection.write(sabm.encode()) // send the frame
    })
}

async function disconnect(destinationCallsign: string, destinationSsid: number, sourceCallsign: string, sourceSsid: number, kissConnection: SerialPort, retries: number = 3): Promise<void> {
    return new Promise((resolve, reject) => {
        // keep track of how many attempts to disconnect have been made
        let attempts: number = 0

        // create a disconnect frame and encode it
        const disc: Uint8Array = new DISCFrame({ destinationCallsign, destinationSsid, sourceCallsign, sourceSsid }).encode()

        // create a handler function for the on('data') event
        const checkUA = async (data: Buffer) => {
            const response: IncomingFrame = new IncomingFrame(data)
            if (response.destinationCallsign === MY_CALL && response.destinationSsid === MY_SSID) { // if it's addressed to us
                if (response.subtype === 'UA') { // success
                    resolve()
                    kissConnection.removeListener('data', checkUA) // don't forget to remove the handler
                }
                else { // maybe failure
                    if (attempts <= retries) { // try again if we haven't reached our retry limit
                        kissConnection.write(disc)
                    }
                    else { // otherwise failure
                        reject(new Error(`Unable to disconnect properly from ${destinationCallsign}-${destinationSsid}`))
                        kissConnection.removeListener('data', checkUA) // don't forget to remove the handler
                    }
                }
            }
        }
        kissConnection.on('data', checkUA) // set the handler
        kissConnection.write(disc) // send the frame
        attempts++ // increment the amount of times we've attempted to disconnect
    })
}

const kissConnection: SerialPort = new SerialPort({
    path: '/dev/rfcomm0',
    baudRate: 9600
})
kissConnection.on('data', (chunk) => console.log(new IncomingFrame(chunk)))

try {
    await connect(THEIR_CALL, THEIR_SSID, MY_CALL, MY_SSID, kissConnection)
    console.log(`Connected to ${THEIR_CALL}-${THEIR_SSID}`)
    // continue with your program here...
    // All link state management must be done manually (I frames, retries, incrementing receievedSequence/sendSequence, acknowledgement, etc.). A future version of JSAX25 may automate this.
    await disconnect(THEIR_CALL, THEIR_SSID, MY_CALL, MY_SSID, kissConnection)
    console.log(`Disconnected from ${THEIR_CALL}-${THEIR_SSID}`)
}
catch (error) {
    console.log(error)
    kissConnection.destroy()
}
```