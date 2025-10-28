import { DISCFrame, KissConnection, TESTFrame } from "./src";

const kissConnection: KissConnection = new KissConnection({
    host: 'localhost',
    port: 8100
})

new DISCFrame({
    destinationCallsign: 'WH6CMO',
    destinationSsid: 10,
    sourceCallsign: 'K04LCM',
    sourceSsid: 0,
    kissConnection: kissConnection
}).send()

kissConnection.close()