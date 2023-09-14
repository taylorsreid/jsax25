'use strict';

const AXEZ = require('./index');
const axez = AXEZ('/tmp/kisstnc', ()=>{
  console.log('ready');
  setInterval(()=>{
    axez.send('RECV', 'SENDER', "Hello World " + Date.now(), 2, 1);
  },3000);
});
axez.listen(data=>{
  console.log(data);
});
