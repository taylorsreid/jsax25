import { type ControlFieldCombination } from "./types";

export const controlFieldCombinations: ControlFieldCombination[] = [
    {
        internalFrameType: 'unnumbered',
        frameType: 'SABM',
        binaryOne: '001',
        binaryTwo: '1111',
        commandResponse: 'command',
        // pollFinal: true
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'DISC',
        binaryOne: '010',
        binaryTwo: '0011',
        commandResponse: 'command',
        // pollFinal: true,
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'DM',
        binaryOne: '000',
        binaryTwo: '1111',
        commandResponse: 'response',
        // pollFinal: true
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'UA',
        binaryOne: '011',
        binaryTwo: '0011',
        commandResponse: 'response',
        // pollFinal: true
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'FRMR',
        binaryOne: '100',
        binaryTwo: '0111',
        commandResponse: 'response'
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'UI',
        binaryOne: '000',
        binaryTwo: '0011',
        commandResponse: 'response' // can technically be either but it's de facto response in APRS so we'll go with that to simplify the dev api
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'XID',
        binaryOne: '101',
        binaryTwo: '1111',
        commandResponse: 'command' // can be either but we'll just go with command to simplify the dev api
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'TEST',
        binaryOne: '111',
        binaryTwo: '0011',
        commandResponse: 'command' // can be either but we'll just go with command to simplify the dev api
    },
    {
        internalFrameType: 'supervisory',
        frameType: 'RR',
        binaryTwo: '0001',
        commandResponse: 'response' // not in spec but defacto
        // pollFinal depends on context
    },
    {
        internalFrameType: 'supervisory',
        frameType: 'RNR',
        binaryTwo: '0101',
        commandResponse: 'response' // not in spec but defacto
        // pollFinal depends on context
    },
    {
        internalFrameType: 'supervisory',
        frameType: 'REJ',
        binaryTwo: '1001',
        commandResponse: 'response' // guessing on this one because I've never seen it in the wild
        // pollFinal depends on context
    },
    {
        internalFrameType: 'supervisory',
        frameType: 'SREJ',
        binaryTwo: '1101',
        commandResponse: 'response' // guessing on this one because I've never seen it in the wild
        // pollFinal no idea
    },
    {
        internalFrameType: 'information',
        frameType: 'information',
        commandResponse: 'command' // not in spec but defacto
        // pollFinal depends on context
    }
];
