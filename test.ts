// type prefix required to run on bun
import { KissConnection, type KissConnectionConstructor } from './src'
import { BaseKissFrame } from './src/decodedkissframe'
import { Repeater } from './src/repeater'
import { isEqual } from 'lodash'

// ******************** SET YOUR TEST VARIABLES BELOW ********************
const MY_CALLSIGN: string = 'N0CALL'
const MY_SSID: number = 0
const THEIR_CALLSIGN: string = 'N0CALL'
const THEIR_SSID: number = 0
const REPEATERS: Repeater[] = [
	{
		callsign: 'RPTR1',
		ssid: 1,
		hasBeenRepeated: false
	}
]
const CONSTRUCTOR: KissConnectionConstructor = {
	compression: true,
}

// ******************** DIFFERENT FRAME TYPES ********************
const STRING: string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vitae sapien mollis, hendrerit nulla sit amet, vehicula nunc.'
const NUMBER: number = 86753.09
const OBJECT: Object = { key: STRING }
const STRING_ARRAY: string[] = STRING.split(' ')
const NUMBER_ARRAY: number[] = [8, 6, 7, 5, 3, 0, 9]
const OBJECT_ARRAY: Object[] = [OBJECT, OBJECT, OBJECT]

interface TestObject {
	type: string,
	value: any
}
// an array of each kind to test with a type tag
const SERIALIZABLE_ARRAY: TestObject[] = [
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

const testFrame: BaseKissFrame = {
	destination: {
		callsign: THEIR_CALLSIGN,
		ssid: THEIR_SSID,
	},
	source:{
		callsign: MY_CALLSIGN,
		ssid: MY_SSID,
	},
	payload: SERIALIZABLE_ARRAY,
	repeaters: REPEATERS
}


//TODO: APRS and digipeater implementation and testing

// ******************** SET WHICH TESTS TO RUN BY COMMENTING OUT LINES ********************

// these tests does not require a radio
encodeDecodePacketTest()
decodeRepeatersTest()

// all following tests require a radio

// tests for the base KissConnection library that powers everything
// createConnectionTest()
// listenTest()
// filterTest()
// sendTest()
// listenAndRespondTest()
// sendAndListenTest()

// ******************** ACTUAL TEST FUNCTIONS ********************

function printDivider() {
	console.log('\n****************************************************************************************************\n')
}

function encodeDecodePacketTest() {
	printDivider()
	console.log('Testing encode and decode methods...\n')
	console.time('encodeDecodeTest')
	SERIALIZABLE_ARRAY.map((testable: TestObject) => {
		try {
			testFrame.payload = testable.value
			const clone: BaseKissFrame = structuredClone(testFrame) // MUST USE STRUCTUREDCLONE OTHERWISE THE ORIGINAL IS MUTATED AND THE TEST FAILS
			const decoded: BaseKissFrame = new KissConnection({nullModem: true, compression: true}).decode(new KissConnection({nullModem: true, compression: true}).encode(clone))
			console.log(`\nEncoding and decoding a ${testable.type}...`)

			const recursiveCompareOverlapOnly = (original: any, decoded: any) => {
				for (const key in original) {
					if (typeof original[key] === 'object') {
						recursiveCompareOverlapOnly(original[key], decoded[key])
					}
					else if (isEqual(original[key], decoded[key])) {
						console.log(`${key} === ${key} ... \x1b[32mPASS\x1b[0m`)
					}
					else {
						console.log(`${key} === ${key} ... \x1b[31mFAIL\x1b[0m`)
						console.log('Original: ')
						console.log(original)
						console.log('Decoded: ')
						console.log(decoded)
					}
				}
			}
			recursiveCompareOverlapOnly(testFrame, decoded)
		} catch (error) {
			console.log(`Encoding and decoding a ${testable.type}... \x1b[31mFAIL\x1b[0m`)
			console.log(error)
		}
	})
	console.log()
	console.timeEnd('encodeDecodeTest')
}

function decodeRepeatersTest() {
	printDivider()
	console.time('decodeRepeatersTest')
	try {
		const decodedRepeaters = KissConnection.decodeRepeaters(new KissConnection({nullModem: true, compression: false}).encode(testFrame))
		console.log(decodedRepeaters)
		if (isEqual(testFrame.repeaters, decodedRepeaters)) {
			console.log(`Decoding repeaters from an encoded packet... \x1b[32mPASS\x1b[0m`)
		}
		else {
			console.log(`Decoding repeaters from an encoded packet... \x1b[31mFAIL\x1b[0m`)
		}
	} catch (error) {
		console.log(`Decoding repeaters from an encoded packet... \x1b[31mFAIL\x1b[0m`)
		console.log(error)
	}
	console.timeEnd('decodeRepeatersTest')
}

function createConnectionTest() {
	printDivider()
	console.time('createConnectionTest')
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		if (kissConnection.isSerial()) {
			console.log(`Creating a ${kissConnection.getSerialBaud()} baud connection on ${kissConnection.getSerialPort()}... \x1b[32mPASS\x1b[0m`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`Creating a connection on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}... \x1b[32mPASS\x1b[0m`)
		}
		else if (!kissConnection.isConnected()) {
			console.log('There is no connection open... \x1b[31mFAIL\x1b[0m')
		}
		else {
			console.log(`Something else went wrong... \x1b[31mFAIL\x1b[0m`)
		}
		kissConnection.close()
	}
	catch (error) {
		console.log('Creating connection... \x1b[31mFAIL\x1b[0m')
	}
	console.timeEnd('createConnectionTest')
}

function listenTest() {
	printDivider()
	// not a timed test
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		if (kissConnection.isSerial()) {
			console.log(`Listening on ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud...`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`Listening on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}...`)
		}
		console.log('\x1b[33mWARNING:\x1b[0m not a passable test, manually verify received frames.')
		kissConnection.listen((data: BaseKissFrame) => {
			console.log(data)
			// don't close so we can continue listening
		})
	}
	catch (error) {
		console.log('Listening test... \x1b[31mFAIL\x1b[0m')
		console.log(error)
	}
}

function filterTest() {
	printDivider()
	// not a timed test
	try {
		const kissConnection: KissConnection = new KissConnection(CONSTRUCTOR)
		console.log('Listening only for packets addressed to your callsign and SSID...')
		kissConnection.listen((frame: BaseKissFrame) => {
			if (frame.destination.callsign === MY_CALLSIGN && frame.destination.ssid === MY_SSID) {
				console.log(`Filtering test... \x1b[32mPASS\x1b[0m`)
			}
			else {
				console.log('Filtering test... \x1b[31mFAIL\x1b[0m')
			}
			kissConnection.close()
		}, {
			destination: {
				callsign: MY_CALLSIGN,
				ssid: MY_SSID
			}
		})
	} catch (error) {
		console.log('Filtering test... \x1b[31mFAIL\x1b[0m')
		console.log(error)
	}

}

function sendTest() {
	printDivider()
	console.time('sendTest')
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		kissConnection.send(testFrame)
		if (kissConnection.isSerial()) {
			console.log(`Sending data to ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud.... \x1b[32mPASS\x1b[0m`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`Sending data to ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}... \x1b[32mPASS\x1b[0m`)
		}
		kissConnection.close()
	}
	catch (error) {
		console.log('Send test... \x1b[31mFAIL\x1b[0m')
		console.log(error)
	}
	console.timeEnd('sendTest')
}

function listenAndRespondTest() {
	printDivider()
	// not a timed test
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		if (kissConnection.isSerial()) {
			console.log(`Listening on ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud...`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`Listening on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}...`)
		}
		kissConnection.listen((decodedFrame: BaseKissFrame) => {
			console.log('Received: ')
			console.log(decodedFrame)
			console.log('\x1b[33mWARNING:\x1b[0m You must manually verify that this frame meets what you expected.')
			const response: BaseKissFrame = {
				source: {
					callsign: MY_CALLSIGN,
					ssid: MY_SSID,
					
				},
				destination: {
					callsign: decodedFrame.source.callsign,
					ssid: decodedFrame.source.ssid
				},
				payload: 'ACKNOWLEDGED',
			}
			console.log(`Sending response ${JSON.stringify(response)}`)
			kissConnection.send(response)
			kissConnection.close()
			console.log('Sending response... \x1b[32mPASS\x1b[0m')
		})

	}
	catch (error) {
		console.log('Listening and respond test... \x1b[31mFAIL\x1b[0m')
		console.log(error)
	}
}

function sendAndListenTest() {
	printDivider()
	// not a timed test
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		if (kissConnection.isSerial()) {
			console.log(`Sending on ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud...`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`Sending on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}...`)
		}
		kissConnection.send(testFrame)
		console.log('Sent frame... awaiting response.')
		kissConnection.listen((decodedFrame: BaseKissFrame) => {
			console.log('Received:')
			console.log(decodedFrame)
			console.log('Send and listen test... \x1b[32mPASS\x1b[0m')
		}, {
			destination: {
				callsign: MY_CALLSIGN,
				ssid: MY_SSID
			}
		})
	} catch (error) {
		console.log('Send and listen test... \x1b[31mFAIL\x1b[0m')
		console.log(error)
	}
}