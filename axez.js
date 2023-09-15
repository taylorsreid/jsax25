'use strict';

const {SerialPort} = require('serialport');

const createFrame = (to, from, message, toSSID = 0, fromSSID = 0) => {
  let frame = [192, 0];
  to = to.toLocaleUpperCase();
  to += "      ";
  let destination = to.split('').map(val=>{
    return val.charCodeAt(0) * 2;
  });
  if (destination.length > 6) {
    destination = destination.slice(0,6);
  }
  for(let i = 0; i < destination.length; i++) {
    frame.push(destination[i]);
  }

  toSSID = (toSSID < 16 && toSSID > -1 ? toSSID : 0) 
  frame.push(224 + (toSSID * 2));

  from = from.toLocaleUpperCase();
  from += "      ";
  let source = from.split('').map(val=>{
    return val.charCodeAt(0) * 2;
  });
  if (source.length > 6) {
    source = source.slice(0,6);
  }
  for(let i = 0; i < source.length; i++) {
    frame.push(source[i]);
  }

  fromSSID = (fromSSID < 16 && fromSSID > -1 ? fromSSID : 0);
  frame.push(97 + (fromSSID * 2));

  // Control
  frame.push(0);

  // PID
  frame.push(240);

  let content = message.split('').map(val=>{
    return val.charCodeAt(0);
  });
  for(let i = 0; i < content.length; i++) {
    frame.push(content[i]);
  }
  frame.push(192);
  return frame;
};

const readFrame = (data) => {
  let frame = {};
  let result = Array.from(new Uint8Array(data));

  frame.destination = result.slice(2,8).map(val=>{
    return String.fromCharCode(val/2);
  }).join('').trim();
  frame.destinationSSID = result.slice(8)[0] - 224;
  frame.destinationSSID = (frame.destinationSSID > 0) ? frame.destinationSSID / 2 : 0;

  frame.source = result.slice(9, 15).map(val=>{
    return String.fromCharCode(val/2);
  }).join('').trim();
  frame.sourceSSID = result.slice(15)[0] - 97;
  frame.sourceSSID = (frame.sourceSSID > 0) ? frame.sourceSSID / 2 : 0;

  frame.message = result.slice(18, -1).map(val=>{
    return String.fromCharCode(val);
  }).join('');
  return frame;
}

const openPort = (kissPath, baudRate=1200) => {
  return new Promise((resolve,reject) =>{

    let onData = null;

    let serialPort = new SerialPort({
      "path": kissPath,
      "baudRate": baudRate,
      "lock": false
    });

    serialPort.on('open', ()=>{
      resolve(serialPort);
    });

  });
};

function AXEZ() {
  return {readFrame, createFrame, openPort};
}

module.exports = AXEZ;
