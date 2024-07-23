// type prefix required to run on bun
import { FrameFactory, IncomingFrame, KissConnection, PacketSession } from '../src'
import { OutgoingConstructor } from '../src/types'

// ******************** SET YOUR TEST VARIABLES BELOW ********************

const kc: KissConnection = new KissConnection({
	txBaud: 1200,
	tcpHost: '127.0.0.1',
    tcpPort: 8100
})

const ogc: OutgoingConstructor = {
	kissConnection: kc,
    destinationCallsign: 'WH6CMO',
    destinationSsid: 10,
    sourceCallsign: 'KO4LCM',
    sourceSsid: 0,
    // repeaters: [
	// 	{
	// 		callsign: 'WH6CMO',
	// 		ssid: 10
	// 	}
	// ]
}

const ff: FrameFactory = new FrameFactory(ogc)


// // ******************** DIFFERENT FRAME TYPES ********************
const STRING: string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vitae sapien mollis, hendrerit nulla sit amet, vehicula nunc.'
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

// sendTest()
sessionTest()

// // ******************** ACTUAL TEST FUNCTIONS ********************

function printDivider() {
	console.log('\n****************************************************************************************************\n')
}


// function sendTest() {
// 	printDivider()
// 	console.time('sendTest')
// 	try {
// 		const frame = ff.ui(SERIALIZABLE_ARRAY)
// 		if (kc.isSerial()) {
// 			console.log(`Sending data to ${kc.getSerialPort()} at ${kc.getSerialBaud()} baud.... \x1b[32mPASS\x1b[0m`)
// 		}
// 		else if (kc.isTcp()) {
// 			console.log(`Sending data to ${kc.getTcpHost()}:${kc.getTcpPort()}... \x1b[32mPASS\x1b[0m`)
// 		}
// 		else if (kc.isMock()) {
// 			console.log('Sending data to mock modem... \x1b[32mPASS\x1b[0m')
// 		}
// 		kc.once('data', (data: IncomingFrame) => {
// 			console.log(data.toJSON())
// 			kc.close()
// 		})
// 		frame.send()
// 	} catch (error) {
// 		console.log('Send test... \x1b[31mFAIL\x1b[0m')
// 		console.log(error)
// 	}
// 	console.timeEnd('sendTest')
// }

async function sessionTest() {
	printDivider()
	console.time('sessionTest')
	try {
		const session: PacketSession = new PacketSession(ogc)
		await session.connect()
		await session.send([SERIALIZABLE_ARRAY, SERIALIZABLE_ARRAY, SERIALIZABLE_ARRAY])
		await session.disconnect()
	} catch (error) {
		console.log('Session test... \x1b[31mFAIL\x1b[0m')
		console.log(error)
	}
	console.timeEnd('sessionTest')
}