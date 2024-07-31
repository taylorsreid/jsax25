import type { FrameType, IFrameType, SFrameType, UFrameType } from "./baseabstract.js";

export interface ControlFieldCombination {
    frameType: FrameType,
    frameSubtype: UFrameType | SFrameType | IFrameType,
    binaryOne?: string,
    binaryTwo?: string,
    commandOrResponse: 'command' | 'response',
    pollOrFinal: boolean,
    modulo: 8 | 128
}

export const controlFieldCombinations: ControlFieldCombination[] = [
    {
        frameType: "unnumbered",
        frameSubtype: "SABME",
        binaryOne: '011',
        binaryTwo: '1111',
        commandOrResponse: "command",
        pollOrFinal: true,
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'SABM',
        binaryOne: '001',
        binaryTwo: '1111',
        commandOrResponse: 'command',
        pollOrFinal: true,
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'DISC',
        binaryOne: '010',
        binaryTwo: '0011',
        commandOrResponse: 'command',
        pollOrFinal: true,
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'DM',
        binaryOne: '000',
        binaryTwo: '1111',
        commandOrResponse: 'response',
        pollOrFinal: true,
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'UA',
        binaryOne: '011',
        binaryTwo: '0011',
        commandOrResponse: 'response',
        pollOrFinal: true,
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'FRMR',
        binaryOne: '100',
        binaryTwo: '0111',
        commandOrResponse: 'response',
        pollOrFinal: true,
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'UI',
        binaryOne: '000',
        binaryTwo: '0011',
        commandOrResponse: 'response', // defacto in APRS
        pollOrFinal: false,  // sensible default & defacto in APRS
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'XID',
        binaryOne: '101',
        binaryTwo: '1111',
        commandOrResponse: 'command', // sensible default
        pollOrFinal: false, // sensible default
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'TEST',
        binaryOne: '111',
        binaryTwo: '0011',
        commandOrResponse: 'command', // sensible default
        pollOrFinal: false, // sensible default
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'RR',
        binaryTwo: '0001',
        commandOrResponse: 'response',
        pollOrFinal: false, // setting to commandOrResponse: 'command' and pollOrFinal: true requests the remote TNC status
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'RR',
        binaryTwo: '00000001',
        commandOrResponse: 'response',
        pollOrFinal: false, // setting to commandOrResponse: 'command' and pollOrFinal: true requests the remote TNC status
        modulo: 128
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'RNR',
        binaryTwo: '0101',
        commandOrResponse: 'response',
        pollOrFinal: false, // setting to commandOrResponse: 'command' and pollOrFinal: true requests the remote TNC status
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'RNR',
        binaryTwo: '00000101',
        commandOrResponse: 'response',
        pollOrFinal: false, // setting to commandOrResponse: 'command' and pollOrFinal: true requests the remote TNC status
        modulo: 128
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'REJ',
        binaryTwo: '1001',
        commandOrResponse: 'response',
        pollOrFinal: false, // setting to commandOrResponse: 'command' and pollOrFinal: true requests the remote TNC status
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'REJ',
        binaryTwo: '00001001',
        commandOrResponse: 'response',
        pollOrFinal: false, // setting to commandOrResponse: 'command' and pollOrFinal: true requests the remote TNC status
        modulo: 128
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'SREJ',
        binaryTwo: '1101',
        commandOrResponse: 'response',
        pollOrFinal: true, // only added for consistency, required by SREJ constructor
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'SREJ',
        binaryTwo: '00001101',
        commandOrResponse: 'response',
        pollOrFinal: true, // only added for consistency, required by SREJ constructor
        modulo: 128
    },
    {
        frameType: "information",
        frameSubtype: "I",
        commandOrResponse: "command",
        pollOrFinal: false, // sensible default because it's usually false, but can be overridden in the constructor
        modulo: 8
    },
    {
        frameType: "information",
        frameSubtype: "I",
        commandOrResponse: "command",
        pollOrFinal: false, // sensible default because it's usually false, but can be overridden in the constructor
        modulo: 128
    }
];