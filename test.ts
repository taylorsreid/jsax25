import { KissOutput, KissConnection, Repeater, KissConnectionConstructor, Serializable, KissInput } from "./kissconnection";
import { isEqual } from 'lodash'

// ******************** SET YOUR TEST VARIABLES BELOW ********************
const MY_CALLSIGN:string = 'KO4LCM'
const MY_SSID:number = 0
const THEIR_CALLSIGN:string = 'KO4LCM'
const THEIR_SSID:number = 1
const CONSTRUCTOR:KissConnectionConstructor = {
	callsign: MY_CALLSIGN,
    ssid: MY_SSID,
    // serialPort: 'COM5',
    // serialBaud: 9600,
    // tcpHost: '127.0.0.1',
    // tcpPort: 8100,
    // filterByCallsign: false,
    // filterBySsid: false,
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
	value: Serializable
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

// ******************** SET WHICH FRAME TYPE TO USE BY COMMENTING OUT THE REST ********************

// simplex
const testFrame:KissInput = {
	sourceCallsign: MY_CALLSIGN,
	sourceSsid: MY_SSID,
	destinationCallsign: THEIR_CALLSIGN,
	destinationSsid: THEIR_SSID,
	payload: STRING,
	repeaters: [] as Repeater[],
}

// // using digipeaters
// const testFrame = {
// 	source: YOUR_CALLSIGN,
// 	sourceSsid: YOUR_SSID,
// 	destination: THEIR_CALLSIGN,
// 	destinationSsid: THEIR_SSID,
// 	message: MESSAGE,
// 	repeaters: [
// 		{ callsign: "NOCALL", ssid: 0 },
// 		{ callsign: "NOCALL", ssid: 3 },
// 		{ callsign: "NOCALL", ssid: 4 },
// 		{ callsign: "NOCALL", ssid: 15 }
// 	],
// 	aprs: false
// }

// using APRS
// const testFrame:DecodedKissFrame = {
// 	sourceCallsign: MY_CALLSIGN,
// 	sourceSsid: MY_SSID,
// 	destinationCallsign: THEIR_CALLSIGN,
// 	destinationSsid: THEIR_SSID,
// 	payload: `:${MY_CALLSIGN}-${MY_SSID}:${STRING}`,
// 	repeaters: [
// 		{
// 			callsign: "WIDE1",
// 			ssid: 1,
// 			hasBeenRepeated: true
// 		},
// 		{
// 			callsign: "WIDE2",
// 			ssid: 2,
// 			hasBeenRepeated: true
// 		}
// 	],
// 	frameType: 'information'
// }

// ******************** SET WHICH TESTS TO RUN BY COMMENTING OUT LINES ********************

// tests that don't require a radio
// encodeDecodeTest()

// tests that require a radio
// createConnectionTest()
// sendTest()
listenTest()
// listenFilteredTest()
// listenAndRespondTest()
// sendAndListenTest()

// ******************** ACTUAL TEST FUNCTIONS ********************
function encodeDecodeTest() {
	console.log('Testing encode and decode methods...')
	SERIALIZABLE_ARRAY.map((testable:TestObject) => {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		try {
			let original:KissInput = {
				sourceCallsign: MY_CALLSIGN,
				sourceSsid: 0,
				destinationCallsign: MY_CALLSIGN,
				destinationSsid: 1,
				payload: testable.value
			}
			let originalCopy = structuredClone(original) // MUST USE STRUCTUREDCLONE OTHERWISE THE ORIGINAL IS MUTATED AND THE TEST FAILS
			let decoded = kissConnection.decode(kissConnection.encode(originalCopy))
			console.log(`\n\tEncoding and decoding a ${testable.type}... \x1b[32mPASS\x1b[0m`)

			if (isEqual(original.payload, decoded.payload)) {
				console.log(`\tTesting if received and original ${testable.type}s match... \x1b[32mPASS\x1b[0m`)
				console.log(decoded)
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
}

function createConnectionTest() {
	console.log(`Testing creating a connection...`)
	console.time('\tcreateConnectionTest')
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		if (kissConnection.isSerial()) {
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
		console.timeEnd('\tcreateConnectionTest')
	}
	catch (error) {
		console.log('\tCreating connection... \x1b[31mFAIL\x1b[0m')
		console.timeEnd('\tcreateConnectionTest')
	}
}

function sendTest() {
	console.log('Testing sending data...')
	console.time('\tsendTest')
	try {
		const kissConnection = new KissConnection(CONSTRUCTOR)
		if (kissConnection.isSerial()) {
			kissConnection.send(testFrame)
			console.log(`\tSending data to ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud.... \x1b[32mPASS\x1b[0m`)
		}
		else if (kissConnection.isTcp()) {
			kissConnection.send(testFrame)
			console.log(`\tSending data to ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}... \x1b[32mPASS\x1b[0m`)
		}
		kissConnection.close()
		console.timeEnd('\tsendTest')
	}
	catch(error) {
		if (error instanceof ReferenceError) {
			console.log('\tConnection test failed, aborting send test... \x1b[33mWARNING\x1b[0m')
		}
		else {
			console.log('\tSend test... \x1b[31mFAIL\x1b[0m')
		}
		console.timeEnd('\tsendTest')
	}
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

// function listenFilteredTest() {
// 	console.log('Testing filtering...')
// 	console.time('\tlistenFilteredTest')
// 	try {
// 		const kissConnection = new KissConnection(CONSTRUCTOR)
// 		kissConnection.on('callsignSsid', (f:DecodedKissFrame) => {
// 			if (typeof f !== 'undefined') { // guard against undefined
// 				if (f.destinationCallsign === MY_CALLSIGN && f.destinationSsid === MY_SSID) {
// 					console.log(`\tTesting if filtering works... \x1b[32mPASS\x1b[0m`)
// 				}
// 				else {
// 					console.log('\tTesting if filtering works... \x1b[31mFAIL\x1b[0m')
// 					console.log(`Packet callsign: ${f.destinationCallsign}`)
// 					console.log(`Your callsign: ${MY_CALLSIGN}`)
// 					console.log(`Packet SSID: ${f.destinationSsid}`)
// 					console.log(`Your SSID: ${MY_SSID}`)
// 				}
// 			}
// 		})
// 	}
// 	catch (error) {
// 		if (error instanceof ReferenceError) {
// 			console.log('\tConnection test failed, aborting receive test... \x1b[33mWARNING\x1b[0m')
// 		}
// 		else {
// 			console.log('\tListening test... \x1b[31mFAIL\x1b[0m')
// 		}
// 		console.timeEnd('\tlistenFilteredTest')
// 	}
	
// }

// function listenAndRespondTest() {
// 	console.log('Testing listening and responding...')
// 	console.time('\tlistenAndRespondTest')
// 	try {
// 		const kissConnection = new KissConnection(CONSTRUCTOR)
// 		if (kissConnection.isSerial()) {
// 			console.log(`\tListening on ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud...`)
// 		}
// 		else if (kissConnection.isTcp()) {
// 			console.log(`\tListening on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}...`)
// 		}
// 		kissConnection.on('callsignSsid', (decodedFrame:DecodedKissFrame) => {
// 			console.log
// 			console.log('\tReceived: ')
// 			console.log(decodedFrame)
// 			console.log('\t\x1b[33mWARNING:\x1b[0m You must manually verify that this frame meets what you expected.')
// 			const response:DecodedKissFrame = {
// 				destinationCallsign: decodedFrame.sourceCallsign,
// 				destinationSsid: decodedFrame.sourceSsid,
// 				payload: 'ACKNOWLEDGED',
// 				frameType: 'information'
// 			}
// 			kissConnection.send(response)
// 			console.log(`\tSending response ${JSON.stringify(response)}`)
// 			console.log('\tSending response... \x1b[32mPASS\x1b[0m')
// 			kissConnection.close()
// 			console.timeEnd('\tlistenAndRespondTest')
// 		})
		
// 	}
// 	catch (error) {
// 		if (error instanceof ReferenceError) {
// 			console.log('\tConnection test failed, aborting receive test... \x1b[33mWARNING\x1b[0m')
// 		}
// 		else {
// 			console.log('\tListening test... \x1b[31mFAIL\x1b[0m')
// 		}
// 		console.timeEnd('\tlistenAndRespondTest')
// 	}
// }

// function sendAndListenTest() {
// 	console.log('Testing sending and listening...')
// 	console.time('\tlistenAndRespondTest')
// 	try {
// 		const kissConnection = new KissConnection(CONSTRUCTOR)
// 		if (kissConnection.isSerial()) {
// 			console.log(`\tSending on ${kissConnection.getSerialPort()} at ${kissConnection.getSerialBaud()} baud...`)
// 		}
// 		else if (kissConnection.isTcp()) {
// 			console.log(`\tSending on ${kissConnection.getTcpHost()}:${kissConnection.getTcpPort()}...`)
// 		}
// 		kissConnection.send(testFrame)
// 		kissConnection.on('callsignSsid', (decodedFrame:KissFrameWithSource) => {
// 			console.log('\tSend and listen test... \x1b[32mPASS\x1b[0m')
// 		})
// 	} catch (error) {
// 		console.log('\tSend and listen test... \x1b[31mFAIL\x1b[0m')
// 	}
// }