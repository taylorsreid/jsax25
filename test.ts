import { SerialPort } from "serialport";
import { DecodedAxezFrame, openPort, createFrame, readFrame, EncodedAxezFrame, Repeater } from "./axez";
// @ts-ignore
import lodash from 'lodash'
// ******************** SET YOUR TEST VARIABLES ********************

// const YOUR_CALL: string = 'NOCALL'
const YOUR_CALL: string = 'KO4LCM'
const YOUR_SSID: number = 0
// const THEIR_CALL = 'NOCALL'
const THEIR_CALL = 'KO4LCM'
const THEIR_SSID: number = 1
const MESSAGE: string = 'Hello World'
// const SEND_RECEIVE: 'send' | 'receive' | 'none' = 'none'
const SEND_RECEIVE: 'send' | 'receive' | 'none' = 'receive'
const PORT_NAME: string = 'COM5' // the serial port to send the test to, platform specific, ex. /tmp/kisstnc on Linux, COM5 on Windows, etc
const TEST_TYPE: 'simplex' | 'digipeater' | 'aprs' = 'simplex'

// only used if TEST_TYPE === 'digipeater'
const DIGIPEATERS = [
	{ callsign: "NOCALL", ssid: 0 },
	{ callsign: "NOCALL", ssid: 3 },
	{ callsign: "NOCALL", ssid: 4 },
	{ callsign: "NOCALL", ssid: 15 }
]

// only used if TEST_TYPE === 'aprs'
const APRS_DIGIPEATERS = [
	{ callsign: "WIDE1", ssid: 1 },
	{ callsign: "WIDE2", ssid: 2 }
]

// ******************** NO NEED TO MODIFY ANYTHING BELOW THIS LINE ********************

const testFrames = {

	simplex: {
		source: YOUR_CALL,
		destination: THEIR_CALL,
		sourceSSID: YOUR_SSID,
		destinationSSID: THEIR_SSID,
		message: MESSAGE,
		repeaters: [] as Repeater[],
		aprs: false
	},

	digipeater: {
		source: YOUR_CALL,
		destination: THEIR_CALL,
		sourceSSID: YOUR_SSID,
		destinationSSID: THEIR_SSID,
		message: MESSAGE,
		repeaters: DIGIPEATERS,
		aprs: false
	},

	aprs: {
		source: YOUR_CALL,
		destination: THEIR_CALL,
		sourceSSID: YOUR_SSID,
		destinationSSID: THEIR_SSID,
		message: `:${YOUR_CALL}-${YOUR_SSID}:${MESSAGE}`,
		repeaters: APRS_DIGIPEATERS,
		aprs: true
	}
}

const testFrame = testFrames[TEST_TYPE]
// @ts-ignore
if (SEND_RECEIVE === 'send') {
	console.log(`Sending on port ${PORT_NAME}...`)
	const port: SerialPort = openPort(PORT_NAME)
	const frame: EncodedAxezFrame = createFrame(testFrame)
	port.write(frame)
	console.log(`Sent ${JSON.stringify(testFrame)} on port ${PORT_NAME}`)
}
// @ts-ignore
else if (SEND_RECEIVE === 'receive') {
	const port = openPort(PORT_NAME)
	console.log(`Listening on ${PORT_NAME}...`)
	port.on('data', (data: EncodedAxezFrame) => {
		const frame: DecodedAxezFrame = readFrame(data)
		console.log(`Received ${JSON.stringify(frame)} on port ${PORT_NAME}`)
	})
}
// @ts-ignore
else if (SEND_RECEIVE === 'none') {
	console.log('Running no radio test...')
	const encodedFrame: EncodedAxezFrame = createFrame(testFrame)
	const decodedFrame: DecodedAxezFrame = readFrame(encodedFrame)
	delete testFrame.aprs // aprs flag is not encoded
	
	if (lodash.isEqual(testFrame, decodedFrame)) {
		console.log('Original and decoded frames match, successfully encoded and decoded: ' + JSON.stringify(decodedFrame))
	}
	else {
		console.log('Original and decoded frames do not match.')
	}
}
else {
	throw new Error('Enter a valid choice.')
}
