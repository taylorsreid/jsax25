'use strict';

const AXEZ = require('./index');

const axez = AXEZ();

axez.openPort('/tmp/kisstnc').then(port=>{
  port.on('data', (data)=>{
    let frame = axez.readFrame(data);
    console.log(frame);
  });
  setInterval(()=>{
    let frame = axez.createFrame('RECV', 'SENDER', 'Hello World', 2, 1);
    port.write(frame, (err) => {
      console.log(err||"Sent!");
    });
  }, 3000);
});
