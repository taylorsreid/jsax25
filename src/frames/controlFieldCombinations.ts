import { ControlFieldCombination } from "types";
export const controlFieldCombinations: ControlFieldCombination[] = [
    {
        frameType: "unnumbered",
        framesubType: "SABME",
        binaryOne: '011',
        binaryTwo: '1111',
        commandResponse: "command",
        pollOrFinal: true
    },
    {
        frameType: 'unnumbered',
        framesubType: 'SABM',
        binaryOne: '001',
        binaryTwo: '1111',
        commandResponse: 'command',
        pollOrFinal: true
    },
    {
        frameType: 'unnumbered',
        framesubType: 'DISC',
        binaryOne: '010',
        binaryTwo: '0011',
        commandResponse: 'command',
        pollOrFinal: true
    },
    {
        frameType: 'unnumbered',
        framesubType: 'DM',
        binaryOne: '000',
        binaryTwo: '1111',
        commandResponse: 'response',
    },
    {
        frameType: 'unnumbered',
        framesubType: 'UA',
        binaryOne: '011',
        binaryTwo: '0011',
        commandResponse: 'response',
        pollOrFinal: true
    },
    {
        frameType: 'unnumbered',
        framesubType: 'FRMR',
        binaryOne: '100',
        binaryTwo: '0111',
        commandResponse: 'response'
    },
    {
        frameType: 'unnumbered',
        framesubType: 'UI',
        binaryOne: '000',
        binaryTwo: '0011',
        commandResponse: 'response', // can technically be either but it's de facto response in APRS so we'll go with that to simplify the dev api
        // pollOrFinal: false // handled in the constructor
    },
    {
        frameType: 'unnumbered',
        framesubType: 'XID',
        binaryOne: '101',
        binaryTwo: '1111',
        commandResponse: 'command' // can be either but we'll just go with command to simplify the dev api
    },
    {
        frameType: 'unnumbered',
        framesubType: 'TEST',
        binaryOne: '111',
        binaryTwo: '0011',
        commandResponse: 'command' // can be either but we'll just go with command to simplify the dev api
    },
    {
        frameType: 'supervisory',
        framesubType: 'RR',
        binaryTwo: '0001',
        commandResponse: 'response' // not in spec but defacto
        // pollFinal depends on context
    },
    {
        frameType: 'supervisory',
        framesubType: 'RNR',
        binaryTwo: '0101',
        commandResponse: 'response' // not in spec but defacto
        // pollFinal depends on context
    },
    {
        frameType: 'supervisory',
        framesubType: 'REJ',
        binaryTwo: '1001',
        commandResponse: 'response' // guessing on this one because I've never seen it in the wild
        // pollFinal depends on context
    },
    {
        frameType: 'supervisory',
        framesubType: 'SREJ',
        binaryTwo: '1101',
        commandResponse: 'response' // guessing on this one because I've never seen it in the wild
        // pollFinal no idea
    },
    {
        frameType: "information",
        framesubType: "information",
        commandResponse: "command"
    }
];