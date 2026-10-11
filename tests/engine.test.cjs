const assert=require('node:assert/strict'),Q=(()=>{const vm=require('node:vm'),fs=require('node:fs'),m={exports:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../public/engine.js'),'utf8'),{module:m});return m.exports;})();
const p=Q.probabilities(Q.DEFAULTS),notes=Q.sequence(p,Q.DEFAULTS);
assert.deepEqual(Q.sequence(p,Q.DEFAULTS),notes);
assert.notDeepEqual(Q.sequence(p,{...Q.DEFAULTS,seed:4243}),notes);
assert.ok(notes.every(n=>Q.SCALE.includes(n.note-48)&&n.active===!!(n.state&4)));
assert.ok(Q.probabilities({...Q.DEFAULTS,phase:.1}).some((x,i)=>Math.abs(x-p[i])>.01));
const counts=Q.counts(p,4242),data={schema:'quantumdj.v1',backend:'qiskit-statevector',config:Q.DEFAULTS,counts,shots:1024};
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),1024);
assert.equal(Q.importResult(data).metadata.backend,'qiskit-statevector');
assert.throws(()=>Q.importResult({...data,shots:1}));
assert.throws(()=>Q.importResult({...data,backend:'ionq-simulator'}));
assert.throws(()=>Q.importResult({...data,counts:{'10000':1024}}));
assert.throws(()=>Q.probabilities({...Q.DEFAULTS,density:2}));
// Parse Standard MIDI, check tempo, melodic/percussion channels and exact duration.
const bytes=Q.midi(notes,112),v=new DataView(bytes.buffer),ascii=(a,n)=>String.fromCharCode(...bytes.slice(a,a+n));
assert.equal(ascii(0,4),'MThd');assert.equal(v.getUint32(4),6);assert.equal(v.getUint16(12),480);assert.equal(ascii(14,4),'MTrk');assert.equal(v.getUint32(18),bytes.length-22);
let i=22,ticks=0,melody=0,drums=0,tempo=null;
const variable=()=>{let n=0,b;do{b=bytes[i++];n=(n<<7)|(b&127);}while(b&128);return n;};
while(i<bytes.length){ticks+=variable();const status=bytes[i++];if(status===255){const type=bytes[i++],size=variable();if(type===81)tempo=(bytes[i]<<16)|(bytes[i+1]<<8)|bytes[i+2];i+=size;if(type===47)break;}else{const pitch=bytes[i++],velocity=bytes[i++];if(status===144&&velocity>0){melody++;assert.ok(Q.SCALE.includes(pitch-48));}if(status===153&&velocity>0)drums++;}}
assert.equal(tempo,Math.round(60000000/112));assert.equal(ticks,32*120);assert.equal(melody,notes.filter(n=>n.active).length);assert.equal(drums,28);
console.log('PASS: sequence reproducibility, state mapping, phase interference, import validation, MIDI tempo/notes/drums/duration.');
