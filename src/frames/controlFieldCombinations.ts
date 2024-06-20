import { ControlFieldCombination } from "types";
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
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'UI',
        binaryOne: '000',
        binaryTwo: '0011',
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'XID',
        binaryOne: '101',
        binaryTwo: '1111',
        modulo: 8
    },
    {
        frameType: 'unnumbered',
        frameSubtype: 'TEST',
        binaryOne: '111',
        binaryTwo: '0011',
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'RR',
        binaryTwo: '0001',
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'RR',
        binaryTwo: '00000001',
        modulo: 128
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'RNR',
        binaryTwo: '0101',
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'RNR',
        binaryTwo: '00000101',
        modulo: 128
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'REJ',
        binaryTwo: '1001',
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'REJ',
        binaryTwo: '00001001',
        modulo: 128
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'SREJ',
        binaryTwo: '1101',
        modulo: 8
    },
    {
        frameType: 'supervisory',
        frameSubtype: 'SREJ',
        binaryTwo: '00001101',
        modulo: 128
    },
    {
        frameType: "information",
        frameSubtype: "information",
        commandOrResponse: "command",
        modulo: 8
    },
    {
        frameType: "information",
        frameSubtype: "information",
        commandOrResponse: "command",
        modulo: 128
    }
];