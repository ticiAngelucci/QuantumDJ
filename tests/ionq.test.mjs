import assert from 'node:assert/strict';
import {handleIonQ,circuitJSON,normalizedProbabilities} from '../lib/ionq.mjs';
const id='617a1f8b-59d4-435d-aa33-695433d7155e',config={variation:.62,density:.78,entanglement:.55,phase:.30,bpm:112,seed:4242,steps:32},key='unit-test-key';
const request=body=>new Request('https://site.test/api/ionq',{method:'POST',headers:{origin:'https://site.test','content-type':'application/json'},body:JSON.stringify(body)});
let submitted;
const fetcher=async(url,options)=>{
  assert.equal(options.headers.Authorization,'apiKey '+key);
  assert.equal(options.redirect,'manual');
  if(url.endsWith('/whoami'))return Response.json({key_id:id});
  if(url.endsWith('/results/probabilities'))return Response.json({'0':.3,'4':.7});
  if(options.method==='POST'){submitted=JSON.parse(options.body);return Response.json({id,status:'submitted'});}
  return Response.json({id,backend:'simulator',status:'completed',metadata:{app:'QuantumDJ',config:JSON.stringify(config)}});
};
let r=await handleIonQ(request({action:'check',api_key:key}),{},fetcher);assert.deepEqual(await r.json(),{connected:true,backend:'simulator'});
r=await handleIonQ(request({action:'submit',config,api_key:key}),{},fetcher);assert.equal((await r.json()).job_id,id);assert.equal(submitted.backend,'simulator');assert.equal(submitted.input.circuit.length,18);assert.ok(!JSON.stringify(submitted).includes(key));
r=await handleIonQ(request({action:'status',job_id:id,api_key:key}),{},fetcher);const result=(await r.json()).result;assert.equal(result.probabilities['0100'],.7);assert.equal(result.backend,'ionq-simulator');assert.equal(result.execution,'web');assert.ok(!('shots' in result));assert.ok(!JSON.stringify(result).includes(key));
r=await handleIonQ(request({action:'submit',config,api_key:key}),{},async()=>new Response(JSON.stringify({token:key}),{status:401}));const rejected=await r.json();assert.equal(rejected.code,'credentials_rejected');assert.ok(!JSON.stringify(rejected).includes(key));
r=await handleIonQ(request({action:'check'}),{},fetcher);assert.equal((await r.json()).code,'missing_key');
r=await handleIonQ(request({action:'submit',config:{...config,variation:9},api_key:key}),{},fetcher);assert.equal((await r.json()).code,'invalid_config');
r=await handleIonQ(request({action:'status',job_id:'../whoami',api_key:key}),{},fetcher);assert.equal((await r.json()).code,'invalid_job');
r=await handleIonQ(new Request('https://site.test/api/ionq',{method:'POST',headers:{origin:'https://evil.test'},body:'{}'}),{},fetcher);assert.equal(r.status,403);
assert.deepEqual(normalizedProbabilities({probabilities:{registers:{output_all:{'0000':.25,'1000':.75}}}}),{...Object.fromEntries(Array.from({length:16},(_,i)=>[i.toString(2).padStart(4,'0'),0])),'0000':.25,'1000':.75});
assert.throws(()=>normalizedProbabilities({'0':.2}));assert.throws(()=>normalizedProbabilities({'16':1}));
const fs=await import('node:fs'),vm=await import('node:vm'),m={exports:{}};vm.runInNewContext(fs.readFileSync(new URL('../public/engine.js',import.meta.url),'utf8'),{module:m});const Q=m.exports;
assert.equal(Q.importResult(result).probabilities[4],.7);
const notes=Q.sequence(Q.probabilities(config),config),mix={melody:'guitar',melodyVolume:50,drums:'rock',drumVolume:50,bassVolume:50,guitar:'clean',guitarVolume:50};
const events=Q.arrangement(notes,mix);assert.ok(events.some(e=>e.kind==='guitar'));assert.ok(events.some(e=>e.kind==='bass'));assert.ok(events.filter(e=>e.kind==='drum').length>28);
const silent=Q.arrangement(notes,{melodyVolume:0,drums:'none',bassVolume:0,guitar:'off'});assert.equal(silent.length,0);
assert.ok(Q.midi(notes,112,mix).length>Q.midi(notes,112).length);
const generated=circuitJSON(config);
const python=process.env.QDJ_TEST_PYTHON;
if(python){
 const {execFileSync}=await import('node:child_process');const expected=JSON.parse(execFileSync(python,['-c',"import json,sys;sys.path.insert(0,'tools');from run_quantum import build_circuit,DEFAULTS;from qiskit_ionq.helpers import qiskit_circ_to_ionq_circ;print(json.dumps(qiskit_circ_to_ionq_circ(build_circuit(DEFAULTS),gateset='qis')[0]))"],{cwd:new URL('..',import.meta.url)}).toString());
 assert.deepEqual(generated.circuit,expected);
}
console.log('PASS: IonQ submit/status/credentials/error sanitization, real probability mapping, no fake shots, Qiskit circuit serialization, mixer layers/mutes and MIDI export.');
