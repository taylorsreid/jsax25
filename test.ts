import { KissOutput, KissConnection, Repeater, KissConnectionConstructor, KissInput } from "./kissconnection";
import { isEqual } from 'lodash'

// ******************** SET YOUR TEST VARIABLES BELOW ********************
const MY_CALLSIGN:string = 'N0CALL'
const MY_SSID:number = 0
const THEIR_CALLSIGN:string = 'N0CALL'
const THEIR_SSID:number = 1
const CONSTRUCTOR:KissConnectionConstructor = {
    compression: true
}

// ******************** DIFFERENT FRAME TYPES ********************
const STRING:string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vitae sapien mollis, hendrerit nulla sit amet, vehicula nunc. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vitae sapien mollis, hendrerit nulla sit amet, vehicula nunc.'
const NUMBER:number = 8675309
const OBJECT:Object = {key:STRING}
const STRING_ARRAY:string[] = STRING.split(' ')
const NUMBER_ARRAY:number[] = [8, 6, 7, 5, 3, 0, 9]
const OBJECT_ARRAY:Object[] = [OBJECT, OBJECT, OBJECT]

interface TestObject {
	type: string,
	value: any
}
// an array of each kind to test with a type tag
const SERIALIZABLE_ARRAY:TestObject[] = [
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

// simplex
const testFrame:KissInput = {
	sourceCallsign: MY_CALLSIGN,
	sourceSsid: MY_SSID,
	destinationCallsign: THEIR_CALLSIGN,
	destinationSsid: THEIR_SSID,
	payload: STRING,
	repeaters: [] as Repeater[],
}

//TODO: APRS and digipeater implementation and testing

// ******************** SET WHICH TESTS TO RUN BY COMMENTING OUT LINES ********************

// these tests do not require a radio
encodeDecodeTest()
createConnectionTest({nullModem: true})
sendTest({nullModem: true})

// these tests require a radio
// createConnectionTest()
// listenTest()
// sendTest()
// listenAndRespondTest()
// sendAndListenTest()

// ******************** ACTUAL TEST FUNCTIONS ********************
function encodeDecodeTest() {
	console.log('Testing encode and decode methods...')
	console.time('\tEncodeDecodeTest')
	SERIALIZABLE_ARRAY.map((testable:TestObject) => {
		try {
			const kissConnection = new KissConnection({nullModem: true})
			let original:KissInput = {
				sourceCallsign: MY_CALLSIGN,
				sourceSsid: MY_SSID,
				destinationCallsign: THEIR_CALLSIGN,
				destinationSsid: THEIR_SSID,
				payload: testable.value
			}
			let originalCopy = structuredClone(original) // MUST USE STRUCTUREDCLONE OTHERWISE THE ORIGINAL IS MUTATED AND THE TEST FAILS
			let decoded = kissConnection.decode(kissConnection.encode(originalCopy))
			kissConnection.close()
			console.log(`\n\tEncoding and decoding a ${testable.type}... \x1b[32mPASS\x1b[0m`)
			if (isEqual(original.payload, decoded.payload)) {
				console.log(`\tTesting if received and original ${testable.type}s match... \x1b[32mPASS\x1b[0m`)
			}
			else {
				console.log(`\tTesting if received and original ${testable.type} match... \x1b[31mFAIL\x1b[0m`)
				console.log('Original: ')
				console.log(original)
				console.log('Decoded: ')
				console.log(decoded)
			}
		} catch (error) {
			console.log(`\tEncoding and decoding a ${testable.type}... \x1b[31mFAIL\x1b[0m`)
			console.log(error)
		}
	})
	console.log()
	console.timeEnd('\tEncodeDecodeTest')
}

function createConnectionTest(constructor?: KissConnectionConstructor) {
	console.log(`Testing creating a connection...`)
	console.time('\tcreateConnectionTest')
	try {
		constructor ??= CONSTRUCTOR // set to default if arg not defined
		const kissConnection = new KissConnection(constructor)
		if (kissConnection.isNullModem()) {
			console.log('\tCreating a NullModem test connection... \x1b[32mPASS\x1b[0m')
		}
		else if (kissConnection.isSerial()) {
			console.log(`\tCreating a ${kissConnection.getSerialBaud()} baud connection on ${kissConnection.getSerialPort()}.... \x1b[32mPASS\x1b[0m`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`\tCreating a connection on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}.... \x1b[32mPASS\x1b[0m`)
		}
		else if (!kissConnection.isConnected()) {
			console.log('\tThere is no connection open... \x1b[31mFAIL\x1b[0m')
		}
		else {
			console.log(`\tSomething else went wrong... \x1b[31mFAIL\x1b[0m`)
		}
		kissConnection.close()
	}
	catch (error) {
		console.log('\tCreating connection... \x1b[31mFAIL\x1b[0m')
	}
	console.timeEnd('\tcreateConnectionTest')
}

function listenTest() {
	console.log('Testing listening...')
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		if (kissConnection.isSerial()) {
			console.log(`\tListening on ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud...`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`\tListening on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}...`)
		}
		kissConnection.on('data', (decodedFrame:KissOutput) => {
			console.log(decodedFrame)
		})
	}
	catch (error) {
		if (error instanceof ReferenceError) {
			console.log('\tConnection test failed, aborting receive test... \x1b[33mWARNING\x1b[0m')
		}
		else {
			console.log('\tListening test... \x1b[31mFAIL\x1b[0m')
			console.log(error)
		}
		
	}
}

function sendTest(constructor?: KissConnectionConstructor) {
	console.log('Testing sending data...')
	console.time('\tsendTest')
	try {
		constructor ??= CONSTRUCTOR
		const kissConnection = new KissConnection(constructor)
		kissConnection.send(testFrame)
		if (kissConnection.isNullModem()) {
			console.log('\tSending data to test NullModem... \x1b[32mPASS\x1b[0m')
		}
		else if (kissConnection.isSerial()) {
			console.log(`\tSending data to ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud.... \x1b[32mPASS\x1b[0m`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`\tSending data to ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}... \x1b[32mPASS\x1b[0m`)
		}
		kissConnection.close()
	}
	catch(error) {
		if (error instanceof ReferenceError) {
			console.log('\tConnection test failed, aborting send test... \x1b[33mWARNING\x1b[0m')
		}
		else {
			console.log('\tSend test... \x1b[31mFAIL\x1b[0m')
		}
	}
	console.timeEnd('\tsendTest')
}

function listenAndRespondTest() {
	console.log('Testing listening and responding...')
	console.time('\tlistenAndRespondTest')
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		if (kissConnection.isSerial()) {
			console.log(`\tListening on ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud...`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`\tListening on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}...`)
		}
		kissConnection.on('data', (decodedFrame:KissOutput) => {
			console.log('\tReceived: ')
			console.log(decodedFrame)
			console.log('\t\x1b[33mWARNING:\x1b[0m You must manually verify that this frame meets what you expected.')
			const response:KissInput = {
				sourceCallsign: MY_CALLSIGN,
				sourceSsid:MY_SSID,
				destinationCallsign: decodedFrame.sourceCallsign,
				destinationSsid: decodedFrame.sourceSsid,
				payload: 'ACKNOWLEDGED',
			}
			console.log(`\tSending response ${JSON.stringify(response)}`)
			kissConnection.send(response)
			console.log('\tSending response... \x1b[32mPASS\x1b[0m')
			kissConnection.close()
		})
		
	}
	catch (error) {
		if (error instanceof ReferenceError) {
			console.log('\tConnection test failed, aborting receive test... \x1b[33mWARNING\x1b[0m')
		}
		else {
			console.log('\tListening test... \x1b[31mFAIL\x1b[0m')
		}
	}
	console.timeEnd('\tlistenAndRespondTest')
}

function sendAndListenTest() {
	console.log('Testing sending and listening...')
	console.time('\tlistenAndRespondTest')
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		if (kissConnection.isSerial()) {
			console.log(`\tSending on ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud...`)
		}
		else if (kissConnection.isTcp()) {
			console.log(`\tSending on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}...`)
		}
		kissConnection.send(testFrame)
		kissConnection.on('data', (decodedFrame:KissOutput) => {
			console.log(decodedFrame)
			console.log('\tSend and listen test... \x1b[32mPASS\x1b[0m')
		})
	} catch (error) {
		console.log('\tSend and listen test... \x1b[31mFAIL\x1b[0m')
	}
	console.timeEnd('\tlistenAndRespondTest')
}