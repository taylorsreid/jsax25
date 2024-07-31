import { setTimeout } from "timers/promises"
import { DISCFrame, IncomingFrame, type OutgoingConstructor, TESTFrame, type TestFrameConstructor, UIFrame, type UIFrameConstructor } from "../src/frames/index.js"
import { KissConnection } from "../src/kissconnection.js"
import { PacketSession } from "../src/packetsession.js"
import { TNC } from "../src/tnc.js"
import { Session } from "inspector"


// ******************** SET YOUR TEST VARIABLES BELOW ********************

const kc: KissConnection = new KissConnection({
	txBaud: 1200,
	tcpHost: '127.0.0.1',
    tcpPort: 8100
})
const destinationCallsign: string = 'WH6CMO'
const destinationSsid: number = 10
const sourceCallsign: string = 'KO4LCM'
const sourceSsid: number = 0

// // ******************** DIFFERENT FRAME TYPES ********************
const STRING: string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vitae sapien mollis, hendrerit nulla sit amet, vehicula nunc. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vitae sapien mollis, hendrerit nulla sit amet, vehicula nunc. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vitae sapien mollis, hendrerit nulla sit amet, vehicula nunc. '
const NUMBER: number = 86753.09
const OBJECT: Object = { key: STRING }
const STRING_ARRAY: string[] = STRING.split(' ')
const NUMBER_ARRAY: number[] = [8, 6, 7, 5, 3, 0, 9]
const OBJECT_ARRAY: Object[] = [OBJECT, OBJECT, OBJECT]

// interface TestObject {
// 	type: string,
// 	value: any
// }

// an array of each kind to test
const SERIALIZABLE_ARRAY = [
	{
		type: 'string',
		value: STRING
	},
	{
		type: 'number',
		value: NUMBER
	},
	{
		type: 'Object',
		value: OBJECT
	},
	{
		type: 'string[]',
		value: STRING_ARRAY
	},
	{
		type: 'number[]',
		value: NUMBER_ARRAY
	},
	{
		type: 'Object[]',
		value: OBJECT_ARRAY
	}
]


//TODO: APRS and digipeater implementation and testing

// ******************** SET WHICH TESTS TO RUN BY COMMENTING OUT LINES ********************

// listenTest()
// sendTest()
tncTest()
// responseTest()

// ******************** ACTUAL TEST FUNCTIONS ********************

function printDivider() {
	console.log('\n****************************************************************************************************\n')
}

function listenTest() {
	printDivider()
	kc.on('data', (frame) => {
		console.log(frame.toJSON())
	})
}


function sendTest() {
	printDivider()
	console.time('sendTest')
	try {
		const frame = new TESTFrame({
			destinationCallsign: destinationCallsign,
			destinationSsid: destinationSsid,
			sourceCallsign: sourceCallsign,
			sourceSsid: sourceSsid,
			payload: STRING
		})
		if (kc.isSerial) {
			console.log(`Sending data to ${kc.serialPort} at ${kc.serialBaud} baud.... \x1b[32mPASS\x1b[0m`)
		}
		else if (kc.isTcp) {
			console.log(`Sending data to ${kc.tcpHost}:${kc.tcpPort}... \x1b[32mPASS\x1b[0m`)
		}
		kc.once('data', (data: IncomingFrame) => {
			console.log(data.toJSON())
			kc.end()
		})
		frame.send()
	} catch (error) {
		console.log('Send test... \x1b[31mFAIL\x1b[0m')
		console.log(error)
	}
	console.timeEnd('sendTest')
}

async function tncTest() {
	printDivider()
	console.time('sessionTest')
	try {

		const tnc: TNC = new TNC({
			kissConnection: kc,
			sourceCallsign: sourceCallsign,
			sourceSsid: sourceSsid
		})

		const session: PacketSession = await tnc.connect({
			destinationCallsign: destinationCallsign,
			destinationSsid: destinationSsid
		})

		// session.send(STRING)

		await setTimeout(5_000)

		await session.disconnect()
		
	} catch (error) {
		new DISCFrame({
			kissConnection: kc,
			destinationCallsign: destinationCallsign,
			destinationSsid: destinationSsid,
			sourceCallsign: sourceCallsign,
			sourceSsid: sourceSsid
		}).send()
		console.log('Session test... \x1b[31mFAIL\x1b[0m')
		console.log(error)
	}
	console.timeEnd('sessionTest')
}

function responseTest() {
	// const c: UIFrameConstructor = ogc as UIFrameConstructor
	// c.payload = 'hello world'
	const encoded = new UIFrame({
		destinationCallsign: destinationCallsign,
		destinationSsid: destinationSsid,
		sourceCallsign: sourceCallsign,
		sourceSsid: sourceSsid,
		payload: 'hello world'
	}).encoded

	console.log(new IncomingFrame(encoded).IFrame('goodbye world', 1, 2).toJSON())
}