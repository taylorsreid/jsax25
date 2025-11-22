// Copyright 2025 Taylor Reid
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import type { IFrameType, SFrameType, UFrameType } from "./baseabstract";

export interface ControlFieldCombination {
    frameType: 'information' | 'supervisory' | 'unnumbered',
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