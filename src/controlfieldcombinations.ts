import { type ControlFieldCombination } from "./types";

export const controlFieldCombinations: ControlFieldCombination[] = [
    {
        internalFrameType: 'unnumbered',
        frameType: 'SABM',
        binaryOne: '001',
        binaryTwo: '1111',
        commandResponse: 'command',
        pollFinal: true
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'DISC',
        binaryOne: '010',
        binaryTwo: '0011',
        commandResponse: 'command'
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'DM',
        binaryOne: '000',
        binaryTwo: '1111',
        commandResponse: 'response'
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'UA',
        binaryOne: '011',
        binaryTwo: '0011',
        commandResponse: 'response'
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
        binaryTwo: '0011'
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'XID',
        binaryOne: '101',
        binaryTwo: '1111'
    },
    {
        internalFrameType: 'unnumbered',
        frameType: 'TEST',
        binaryOne: '111',
        binaryTwo: '0011'
    },
    {
        internalFrameType: 'supervisory',
        frameType: 'RR',
        binaryTwo: '0001'
    },
    {
        internalFrameType: 'supervisory',
        frameType: 'RNR',
        binaryTwo: '0101'
    },
    {
        internalFrameType: 'supervisory',
        frameType: 'REJ',
        binaryTwo: '1001'
    },
    {
        internalFrameType: 'supervisory',
        frameType: 'SREJ',
        binaryTwo: '1101'
    },
    {
        internalFrameType: 'information',
        frameType: 'information'
    }
];
