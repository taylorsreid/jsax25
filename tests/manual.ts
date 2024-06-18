// type prefix required to run on bun
import { NetConnectOpts } from 'net'
import type { Repeater } from '../src'
import { UIFrame, IncomingFrame, KissConnection, SABMEFrame, SABMFrame } from '../src'

// ******************** SET YOUR TEST VARIABLES BELOW ********************
const MY_CALLSIGN: string = 'KO4LCM'
const MY_SSID: number = 0
const THEIR_CALLSIGN: string = 'KO4LCM'
const THEIR_SSID: number = 0

const REPEATERS: Repeater[] = [
	{
		callsign: 'WH6CMO',
		ssid: 10
	}
]

const CONSTRUCTOR: NetConnectOpts = {
    host: '127.0.0.1',
    port: 8100
}


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

// these tests does not require a radio
// encodeDecodePacketTest()
// decodeRepeatersTest()

// all following tests require a radio
sendTest()

// // ******************** ACTUAL TEST FUNCTIONS ********************

function printDivider() {
	console.log('\n****************************************************************************************************\n')
}

async function sendTest() {
	printDivider()
	console.time('sendTest')
	try {
		// const kc = new KissConnection({ mockModem: true })
		const kc = new KissConnection(CONSTRUCTOR)
		const frame = new SABMFrame({
			kissConnection: kc,
			destinationCallsign: THEIR_CALLSIGN,
			destinationSsid: THEIR_SSID,
			sourceCallsign: MY_CALLSIGN,
			sourceSsid: MY_SSID,
			repeaters: REPEATERS
		})
		if (kc.isSerial()) {
			console.log(`Sending data to ${kc.getSerialPath()} at ${kc.getSerialBaudRate()} baud.... \x1b[32mPASS\x1b[0m`)
		}
		else if (kc.isTcp()) {
			console.log(`Sending data to ${kc.getTcpHost()}:${kc.getTcpPort()}... \x1b[32mPASS\x1b[0m`)
		}
		else if (kc.isMockModem()) {
			console.log('Sending data to mock modem... \x1b[32mPASS\x1b[0m')
		}
		kc.once('data', (data: IncomingFrame) => {
			console.log(data.toJSON())
			kc.removeAllListeners()
			kc.close()
		})
		frame.send()
	}
	catch (error) {
		console.log('Send test... \x1b[31mFAIL\x1b[0m')
		console.log(error)
	}
	console.timeEnd('sendTest')
}