'use strict';
const $=id=>document.getElementById(id),Q=QuantumDJ,L=QuantumI18n;
let config={...Q.DEFAULTS},probabilities,notes,metadata=null,session=1,audio=null,playing=false,nextTime=0,nextStep=0,timer=null,scheduled=[],visualTimers=[],toastTimer,mix={...QuantumAudio.DEFAULTS},mixGraph=null,ionqKey='',serverKeyConfigured=false,quantumBusy=false,currentJob=null;
let cloudState={key:'cloud.connectPrompt',variables:{},kind:''},connectionState={key:'connection.enter',variables:{}},importState=null,connectionConnected=false;
const presets={neblina:{variation:.25,density:.42,entanglement:.15,phase:.10,bpm:82},pulso:{variation:.62,density:.78,entanglement:.55,phase:.30,bpm:112},orbita:{variation:.88,density:.90,entanglement:.90,phase:.78,bpm:136}};

function text(state){
  if(state.raw!==undefined)return state.raw;
  const variables={...state.variables};
  for(const [key,value] of Object.entries(state.variables||{}))if(key.endsWith('Key'))variables[key.slice(0,-3)]=L.t(value);
  return L.t(state.key,variables);
}
function makeState(key,variables={}){return {key,variables};}
function errorState(error){
  if(error?.i18nKey)return makeState(error.i18nKey,error.variables);
  if(error?.code&&L.has('server.'+error.code))return makeState('server.'+error.code);
  const message=String(error?.message||error);
  const exact={
    'Tempo inválido':'error.invalidTempo','Semilla inválida':'error.invalidSeed','Longitud inválida':'error.invalidLength',
    'Formato QuantumDJ inválido':'error.invalidFormat','Falta job ID de IonQ':'error.missingJob',
    'Probabilidades inválidas':'error.invalidProbabilities','Distribución no normalizada':'error.invalidDistribution',
    'Faltan counts':'error.missingCounts','Counts inválidos':'error.invalidCounts','Shots inconsistentes':'error.invalidShots',
    'Volumen inválido':'error.invalidVolume','Sonido inválido':'error.invalidSound','Origen no permitido.':'server.origin',
    'Método no permitido.':'server.method','Solicitud demasiado grande.':'server.requestTooLarge','JSON inválido.':'server.invalidJson'
  };
  if(exact[message])return makeState(exact[message]);
  if(message.startsWith('Parámetro inválido: '))return makeState('error.invalidParameter',{parameter:message.slice(20)});
  return {raw:message};
}
function localizedError(error){return text(errorState(error));}
function throwMessage(key,variables={}){const error=new Error(key);error.i18nKey=key;error.variables=variables;throw error;}
function toast(key,variables={}){
  $('toast').textContent=L.has(key)?L.t(key,variables):key;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4000);
}
function toastError(key,error){toast(key,{error:localizedError(error)});}

function syncControls(){
  for(const key of ['variation','density','entanglement','phase']){
    $(key).value=Math.round(config[key]*100);
    $(key+'-value').textContent=Math.round(config[key]*100)+'%';
  }
  $('bpm').value=config.bpm;
  $('steps').value=config.steps;
}
function entropy(p){return-p.reduce((sum,value)=>sum+(value>0?value*Math.log2(value):0),0);}
function mutual(p){
  const joint=Array(4).fill(0),a=[0,0],b=[0,0];
  p.forEach((value,index)=>{joint[index&3]+=value;a[index&1]+=value;b[(index>>1)&1]+=value;});
  return joint.reduce((sum,value,index)=>sum+(value>0?value*Math.log2(value/(a[index&1]*b[(index>>1)&1])):0),0);
}
function render(){
  const names=['F4','Eb4','C4','Bb3','G3','F3','Eb3','C3'];
  $('labels').replaceChildren(...names.map(name=>{const element=document.createElement('div');element.textContent=name;return element;}));
  const roll=$('roll');
  roll.style.gridTemplateColumns='repeat('+config.steps+',minmax(0,1fr))';
  roll.style.gridTemplateRows='repeat(8,1fr)';
  const cells=[];
  for(let row=0;row<8;row++)for(let step=0;step<config.steps;step++){
    const note=notes[step],cell=document.createElement('div');
    cell.className='cell'+(step%4===0?' beat':'');
    cell.dataset.step=step;
    if(note.active&&7-Q.SCALE.indexOf(note.note-48)===row){
      cell.className+=' note'+(note.velocity>90?' accent':'');
      cell.title=L.t('dynamic.stepTitle',{step:step+1,note:names[row],bits:note.bits,velocity:note.velocity});
    }
    cells.push(cell);
  }
  roll.replaceChildren(...cells);
  $('histogram').replaceChildren(...probabilities.map((probability,index)=>{
    const column=document.createElement('div'),bar=document.createElement('div'),label=document.createElement('span');
    column.className='hist-column';bar.className='hist-bar';
    bar.style.height=(probability/Math.max(...probabilities)*75)+'px';
    const bits=index.toString(2).padStart(4,'0');
    column.title='|'+bits+'⟩: '+(probability*100).toFixed(2)+'%';label.textContent=bits;
    column.append(bar,label);return column;
  }));
  $('entropy').textContent=entropy(probabilities).toFixed(2);
  $('correlation').textContent=Math.max(0,mutual(probabilities)).toFixed(3);
  $('notes').textContent=notes.filter(note=>note.active).length+' / '+config.steps;
  $('duration').textContent=(config.steps*60/config.bpm/4).toFixed(1)+' s';
  $('seed-label').textContent='SEED '+config.seed;
  $('loop-title').textContent=L.t('dynamic.session',{number:String(session).padStart(3,'0')});
  $('position').textContent='00 / '+config.steps;
  $('bars').textContent=config.steps===16?L.t('dynamic.barSteps'):L.t('dynamic.bar',{number:String(config.steps/16).padStart(2,'0')});
  const ionq=metadata?.backend==='ionq-simulator';
  $('result-download').disabled=!metadata;
  $('source').className='badge'+(ionq?' ionq':'');
  $('source').textContent=ionq?(metadata.execution==='web'?L.t('source.ionqCloud'):L.t('source.ionqImported')):metadata?L.t('source.qiskitImported'):($('backend').value==='ionq'?L.t('source.localPreview'):L.t('source.localSimulation'));
  $('provenance').textContent=metadata?(metadata.probabilities?
    L.t('provenance.probabilities',{job:metadata.job_id}):
    L.t('provenance.histogram',{backend:metadata.backend,shots:metadata.shots,job:ionq?' · Job: '+metadata.job_id:''})):
    L.t('provenance.preview');
  $('circuit').textContent='q0: Ry(π·'+(.1+.8*config.variation).toFixed(2)+') → Rz(2π·'+config.phase.toFixed(2)+') → Rx(π/2)\nq1: Ry(π·'+(.9-.7*config.variation).toFixed(2)+')\nq2: Ry('+(2*Math.asin(Math.sqrt(config.density))).toFixed(2)+')\nq3: Ry(0.45π)\n\nCRY(q0 → q1, θ), CRY(q1 → q2, θ), CRY(q2 → q3, θ)\nθ = π × '+config.entanglement.toFixed(2)+'\n\n'+L.t('circuit.each')+': Ry(θ/2) · CX · Ry(−θ/2) · CX\n'+L.t('circuit.measurement');
}
function updatePlayButton(){$('play-label').textContent=L.t(playing?'studio.stop':'studio.listen');$('play-icon').textContent=playing?'■':'▶';}
function updateRunButton(){$('ionq-run').textContent=L.t(quantumBusy?'studio.running':$('backend').value==='ionq'?'studio.runIonq':'studio.generateLocal');}
function displayCloudStatus(){$('cloud-status').textContent=text(cloudState);$('cloud-status').className=cloudState.kind;}
function cloudStatus(key,kind='',variables={}){cloudState={key,kind,variables};displayCloudStatus();}
function cloudError(error){cloudState={...errorState(error),kind:'error'};displayCloudStatus();}
function displayConnectionStatus(){
  $('ionq-open-label').textContent=L.t(connectionConnected?'ionq.connected':'ionq.connect');
  $('connection-status').textContent=text(connectionState);
}
function connectionStatus(key,variables={}){connectionState={key,variables};displayConnectionStatus();}
function connectionError(error){connectionState=errorState(error);displayConnectionStatus();}
function setConnection(connected){connectionConnected=connected;connectionStatus(connected?'connection.valid':'connection.enter');}
function displayImportStatus(){$('import-status').textContent=importState?text(importState):'';}
function refreshLanguage(){
  if(probabilities&&notes)render();
  updatePlayButton();updateRunButton();displayCloudStatus();displayConnectionStatus();displayImportStatus();
}

function generate(newSeed=false){
  stop();
  if(newSeed){config.seed=crypto.getRandomValues(new Uint32Array(1))[0]||1;session++;}
  if(!newSeed||!metadata){metadata=null;probabilities=Q.probabilities(config);}
  notes=Q.sequence(probabilities,config);render();
}
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function schedule(context,step,time,graph){return QuantumAudio.schedule(context,Q.arrangement(notes,mix),step,time,config.bpm,graph,config.seed);}
function highlight(step){document.querySelectorAll('.cell.current').forEach(cell=>cell.classList.remove('current'));document.querySelectorAll('.cell[data-step="'+step+'"]').forEach(cell=>cell.classList.add('current'));$('position').textContent=String(step+1).padStart(2,'0')+' / '+config.steps;}
function tick(){
  if(!playing)return;
  const interval=60/config.bpm/4;
  while(nextTime<audio.currentTime+.12){
    const step=nextStep,time=nextTime,oscillators=schedule(audio,step,time,mixGraph);
    for(const oscillator of oscillators){scheduled.push(oscillator);oscillator.onended=()=>{scheduled=scheduled.filter(item=>item!==oscillator);};}
    const id=setTimeout(()=>{visualTimers=visualTimers.filter(item=>item!==id);if(playing)highlight(step);},Math.max(0,(time-audio.currentTime)*1000));
    visualTimers.push(id);nextTime+=interval;nextStep=(nextStep+1)%config.steps;
  }
}
async function play(){
  if(playing){stop();return;}
  try{
    audio=audio||new(window.AudioContext||window.webkitAudioContext)();await audio.resume();mixGraph=QuantumAudio.graph(audio,mix,config.bpm);
    playing=true;document.body.classList.add('is-playing');nextTime=audio.currentTime+.04;nextStep=0;updatePlayButton();tick();timer=setInterval(tick,25);
  }catch(error){toastError('toast.audioError',error);stop();}
}
function stop(){
  playing=false;document.body.classList.remove('is-playing');clearInterval(timer);
  for(const oscillator of scheduled)try{oscillator.stop();}catch{}
  for(const id of visualTimers)clearTimeout(id);
  scheduled=[];visualTimers=[];
  if(mixGraph){mixGraph.disconnect();mixGraph=null;}
  updatePlayButton();document.querySelectorAll('.cell.current').forEach(cell=>cell.classList.remove('current'));$('position').textContent='00 / '+config.steps;
}
function wav(buffer){
  const pcm=buffer.getChannelData(0),bytes=new ArrayBuffer(44+pcm.length*2),view=new DataView(bytes),writeText=(offset,value)=>[...value].forEach((character,index)=>view.setUint8(offset+index,character.charCodeAt(0)));
  writeText(0,'RIFF');view.setUint32(4,36+pcm.length*2,true);writeText(8,'WAVE');writeText(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,buffer.sampleRate,true);view.setUint32(28,buffer.sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);writeText(36,'data');view.setUint32(40,pcm.length*2,true);pcm.forEach((value,index)=>view.setInt16(44+index*2,Math.round(Math.max(-1,Math.min(1,value))*32767),true));return bytes;
}
function preset(name){stop();config={...config,...presets[name]};syncControls();generate();document.querySelectorAll('[data-preset]').forEach(button=>button.classList.toggle('selected',button.dataset.preset===name));}
function syncMix(){
  for(const key of ['melody','drums','guitar','effect'])$('mix-'+key).value=mix[key];
  for(const key of ['melodyVolume','drumVolume','bassVolume','guitarVolume','effectAmount']){$('mix-'+key).value=mix[key];$('mix-'+key+'-value').textContent=mix[key]+'%';}
}
function busy(value){
  quantumBusy=value;$('ionq-run').disabled=value;$('resume-job').disabled=value;$('backend').disabled=value;
  for(const id of ['variation','density','entanglement','phase','generate'])$(id).disabled=value;
  document.querySelectorAll('[data-preset]').forEach(button=>button.disabled=value);updateRunButton();
}
async function callIonQ(action,extra={},overrideKey){
  let response;
  try{response=await fetch('/api/ionq',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({action,api_key:overrideKey===undefined?ionqKey:overrideKey,...extra})});}
  catch{throwMessage('server.network_error');}
  let data;try{data=await response.json();}catch{throwMessage('error.invalidJson');}
  if(!response.ok){const error=new Error(data.error||L.t('error.ionqRequest'));error.code=data.code;throw error;}
  return data;
}
function applyResult(data){
  const imported=Q.importResult(data),musical={bpm:config.bpm,steps:config.steps,seed:config.seed};
  stop();config={...imported.config,...musical};probabilities=imported.probabilities;metadata=imported.metadata;notes=Q.sequence(probabilities,config);session++;syncControls();render();
}
async function awaitJob(jobId){
  currentJob=jobId;$('resume-job-id').value=jobId;
  for(let attempt=0;attempt<90;attempt++){
    const data=await callIonQ('status',{job_id:jobId});
    if(data.status==='completed'){applyResult(data.result);cloudStatus('cloud.completed','success',{job:jobId});toast('cloud.resultLoaded');return;}
    const statusKey={submitted:'cloud.statusSubmitted',ready:'cloud.statusReady',started:'cloud.statusStarted'}[data.status];
    cloudStatus('cloud.jobStatus','',{statusKey:statusKey||data.status,status:data.status,job:jobId});
    await new Promise(resolve=>setTimeout(resolve,2000));
  }
  throwMessage('cloud.pending',{job:jobId});
}
async function executeIonQ(){
  if(quantumBusy)return;
  if($('backend').value==='local'){generate(true);cloudStatus('cloud.localDone');return;}
  if(!ionqKey&&!serverKeyConfigured){$('ionq-dialog').showModal();$('ionq-key').focus();return;}
  busy(true);cloudStatus('cloud.submitting');
  try{const job=await callIonQ('submit',{config});currentJob=job.job_id;$('resume-job-id').value=currentJob;await awaitJob(currentJob);}
  catch(error){cloudError(error);toast(localizedError(error));}
  finally{busy(false);}
}

$('language-toggle').addEventListener('click',()=>L.setLanguage(L.getLanguage()==='es'?'en':'es'));
document.addEventListener('quantumdj:languagechange',refreshLanguage);
for(const key of ['variation','density','entanglement','phase'])$(key).addEventListener('input',()=>{config[key]=Number($(key).value)/100;$(key+'-value').textContent=$(key).value+'%';document.querySelectorAll('[data-preset]').forEach(button=>button.classList.remove('selected'));generate();});
$('bpm').addEventListener('change',()=>{const value=Number($('bpm').value);if(!Number.isInteger(value)||value<60||value>180){$('bpm').value=config.bpm;toast('toast.tempo');return;}stop();config.bpm=value;render();});
$('steps').addEventListener('change',()=>{stop();config.steps=Number($('steps').value);notes=Q.sequence(probabilities,config);render();});
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>preset(button.dataset.preset)));
$('play').addEventListener('click',play);
$('generate').addEventListener('click',()=>{generate(true);toast('toast.variation');});
$('midi').addEventListener('click',()=>{download(Q.midi(notes,config.bpm,mix),'quantumdj-'+config.seed+'.mid','audio/midi');toast('toast.midi');});
$('wav').addEventListener('click',async()=>{
  stop();const button=$('wav');button.disabled=true;
  try{const length=config.steps*60/config.bpm/4,context=new OfflineAudioContext(1,Math.ceil((length+(mix.effect==='dry'?.5:2.5))*44100),44100),graph=QuantumAudio.graph(context,mix,config.bpm);for(let index=0;index<config.steps;index++)schedule(context,index,index*60/config.bpm/4,graph);const buffer=await context.startRendering();download(wav(buffer),'quantumdj-'+config.seed+'.wav','audio/wav');toast('toast.wav');}
  catch(error){toastError('toast.wavError',error);}finally{button.disabled=false;}
});
$('ionq-open').addEventListener('click',()=>$('ionq-dialog').showModal());
$('ionq-close').addEventListener('click',()=>$('ionq-dialog').close());
$('config-download').addEventListener('click',()=>download(JSON.stringify({schema:'quantumdj.config.v1',config,mix},null,2),'quantum-config.json','application/json'));
$('import').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>1048576)throwMessage('import.size');
    let data;try{data=JSON.parse(await file.text());}catch{throwMessage('import.invalidJson');}
    const imported=Q.importResult(data);stop();if(data.mix){mix=QuantumAudio.settings(data.mix);syncMix();}
    config=imported.config;probabilities=imported.probabilities;metadata=imported.metadata;notes=Q.sequence(probabilities,config);session++;syncControls();document.querySelectorAll('[data-preset]').forEach(button=>button.classList.remove('selected'));render();
    importState=makeState('import.loaded');displayImportStatus();$('ionq-dialog').close();toast('import.loadedToast',{backend:metadata.backend});
  }catch(error){importState={key:'import.failed',variables:{error:localizedError(error)}};displayImportStatus();}finally{event.target.value='';}
});
$('ionq-run').addEventListener('click',executeIonQ);
$('backend').addEventListener('change',()=>{busy(false);render();cloudStatus($('backend').value==='ionq'?'cloud.updateIonq':'cloud.localMode');});
$('ionq-form').addEventListener('submit',async event=>{
  event.preventDefault();const candidate=$('ionq-key').value.trim();if(!candidate&&!serverKeyConfigured){connectionStatus('connection.required');return;}
  const button=$('ionq-connect');button.disabled=true;connectionStatus('connection.validating');
  try{await callIonQ('check',{},candidate);ionqKey=candidate;$('ionq-key').value='';setConnection(true);$('ionq-dialog').close();cloudStatus('cloud.connected','success');}
  catch(error){connectionError(error);}finally{button.disabled=false;}
});
$('ionq-disconnect').addEventListener('click',()=>{
  if(quantumBusy){connectionStatus('connection.wait');return;}
  ionqKey='';serverKeyConfigured=false;$('ionq-key').value='';setConnection(false);cloudStatus('cloud.disconnected');
});
$('resume-job').addEventListener('click',async()=>{
  if(quantumBusy)return;if(!ionqKey&&!serverKeyConfigured){connectionStatus('connection.jobKey');return;}
  const id=$('resume-job-id').value.trim();if(!id)return;busy(true);$('ionq-dialog').close();try{await awaitJob(id);}catch(error){cloudError(error);}finally{busy(false);}
});
$('result-download').addEventListener('click',()=>{if(metadata)download(JSON.stringify({...metadata,config,mix,job_config:metadata.config},null,2),'quantumdj-'+(metadata.job_id||config.seed)+'.json','application/json');});
for(const key of ['melody','drums','guitar','effect'])$('mix-'+key).addEventListener('change',()=>{const restart=playing;mix[key]=$('mix-'+key).value;if(restart){stop();play();}});
for(const key of ['melodyVolume','drumVolume','bassVolume','guitarVolume','effectAmount'])$('mix-'+key).addEventListener('input',()=>{mix[key]=Number($('mix-'+key).value);$('mix-'+key+'-value').textContent=mix[key]+'%';if(key==='effectAmount'&&mixGraph)mixGraph.wet.gain.value=mix.effect==='dry'?0:mix.effectAmount/100*.55;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});

L.init();syncControls();syncMix();setConnection(false);generate();displayCloudStatus();
fetch('/api/ionq',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(data=>{if(data?.server_key_configured){serverKeyConfigured=true;setConnection(true);cloudStatus('cloud.serverKey');}}).catch(()=>{});
