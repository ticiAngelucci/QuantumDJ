(function(root){
'use strict';
const TRACKS=['melody','drums','bass','guitar'];
const trackDefaults=()=>Object.fromEntries(TRACKS.map(kind=>[kind,{mute:false,solo:false,pan:0,effect:'dry',effectAmount:25}]));
const DEFAULTS={melody:'keys',melodyVolume:75,drums:'electro',drumVolume:55,bassVolume:25,guitar:'off',guitarVolume:35,effect:'dry',effectAmount:30,tracks:trackDefaults()};
const contextCaches=new WeakMap();
function settings(raw={}){
  const m={...DEFAULTS,...raw,tracks:{...trackDefaults(),...(raw.tracks||{})}};
  for(const k of ['melodyVolume','drumVolume','bassVolume','guitarVolume','effectAmount'])if(!Number.isFinite(m[k])||m[k]<0||m[k]>100)throw Error('Volumen inválido');
  if(!['synth','keys','bell','pluck','guitar','custom'].includes(m.melody)||!['electro','lofi','rock','custom','none'].includes(m.drums)||!['off','clean','muted','custom'].includes(m.guitar)||!['dry','delay','reverb'].includes(m.effect))throw Error('Sonido inválido');
  for(const kind of TRACKS){
    const value={...trackDefaults()[kind],...(m.tracks[kind]||{})};
    if(!Number.isFinite(value.pan)||value.pan<-1||value.pan>1||!['dry','delay','reverb'].includes(value.effect)||!Number.isFinite(value.effectAmount)||value.effectAmount<0||value.effectAmount>100)throw Error('Mezcla inválida');
    m.tracks[kind]={mute:!!value.mute,solo:!!value.solo,pan:value.pan,effect:value.effect,effectAmount:value.effectAmount};
  }
  return m;
}
function impulse(ctx){
  const len=Math.floor(ctx.sampleRate*1.45),buffer=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let channel=0;channel<2;channel++){const data=buffer.getChannelData(channel);let state=8123+channel*997;for(let i=0;i<len;i++){state=(state*1664525+1013904223)>>>0;data[i]=(state/4294967296*2-1)*Math.pow(1-i/len,2.8);}}
  return buffer;
}
function graph(ctx,raw,bpm){
  let current=settings(raw),nodes=[],master=ctx.createGain(),compressor=ctx.createDynamicsCompressor(),delay=ctx.createDelay(2),feedback=ctx.createGain(),reverb=ctx.createConvolver(),delayReturn=ctx.createGain(),reverbReturn=ctx.createGain();
  master.gain.value=.82;compressor.threshold.value=-12;compressor.ratio.value=4;delay.delayTime.value=60/bpm*.75;feedback.gain.value=.24;delayReturn.gain.value=.55;reverbReturn.gain.value=.6;reverb.buffer=impulse(ctx);
  master.connect(compressor).connect(ctx.destination);delay.connect(feedback).connect(delay);delay.connect(delayReturn).connect(master);reverb.connect(reverbReturn).connect(master);nodes.push(master,compressor,delay,feedback,reverb,delayReturn,reverbReturn);
  const tracks={};
  for(const kind of TRACKS){
    const input=ctx.createGain(),pan=typeof ctx.createStereoPanner==='function'?ctx.createStereoPanner():ctx.createGain(),dry=ctx.createGain(),delaySend=ctx.createGain(),reverbSend=ctx.createGain();
    input.connect(pan);pan.connect(dry).connect(master);pan.connect(delaySend).connect(delay);pan.connect(reverbSend).connect(reverb);tracks[kind]={input,pan,dry,delaySend,reverbSend};nodes.push(input,pan,dry,delaySend,reverbSend);
  }
  function update(next,at=ctx.currentTime){
    current=settings(next);const anySolo=TRACKS.some(kind=>current.tracks[kind].solo);
    for(const kind of TRACKS){const value=current.tracks[kind],track=tracks[kind],audible=!value.mute&&(!anySolo||value.solo),set=(param,target)=>{if(typeof param.cancelScheduledValues==='function'){param.cancelScheduledValues(at);param.setValueAtTime(param.value,at);param.linearRampToValueAtTime(target,at+.025);}else param.value=target;};
      set(track.dry.gain,audible?1:0);if(track.pan.pan)set(track.pan.pan,value.pan);
      set(track.delaySend.gain,audible&&value.effect==='delay'?value.effectAmount/100*.65:0);set(track.reverbSend.gain,audible&&value.effect==='reverb'?value.effectAmount/100*.72:0);
    }
    return current;
  }
  update(current,ctx.currentTime);
  return {tracks,instruments:tracks.melody.input,drums:tracks.drums.input,wet:reverbReturn,master,update,settings:()=>current,disconnect(){for(const node of nodes)try{node.disconnect();}catch{}}};
}
function cacheFor(ctx){if(!contextCaches.has(ctx))contextCaches.set(ctx,new Map());return contextCaches.get(ctx);}
function seededNoise(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296*2-1;};}
function makeBuffer(ctx,key,duration,draw){const cache=cacheFor(ctx);if(cache.has(key))return cache.get(key);const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);draw(data,ctx.sampleRate);cache.set(key,buffer);return buffer;}
function builtin(ctx,event,seed){
  if(event.kind==='drum'){
    if(event.pitch===36)return {root:36,buffer:makeBuffer(ctx,'kick-'+event.timbre,.5,(data,rate)=>{let phase=0;for(let i=0;i<data.length;i++){const t=i/rate,f=(event.timbre==='rock'?145:120)*Math.exp(-t*18)+42;phase+=2*Math.PI*f/rate;data[i]=(Math.sin(phase)+.18*Math.sin(phase*2))*Math.exp(-t*11);}})};
    if(event.pitch===38)return {root:38,buffer:makeBuffer(ctx,'snare-'+event.timbre,.34,(data,rate)=>{const noise=seededNoise(seed+38);for(let i=0;i<data.length;i++){const t=i/rate,tone=Math.sin(2*Math.PI*185*t)*.35;data[i]=(noise()*.82+tone)*Math.exp(-t*(event.timbre==='lofi'?12:18));}})};
    return {root:42,buffer:makeBuffer(ctx,'hat-'+event.timbre,.16,(data,rate)=>{const noise=seededNoise(seed+42);let previous=0;for(let i=0;i<data.length;i++){const t=i/rate,value=noise();data[i]=(value-previous*.72)*Math.exp(-t*45);previous=value;}})};
  }
  if(event.track==='bass')return {root:36,buffer:makeBuffer(ctx,'bass',1.4,(data,rate)=>{let phase=0;for(let i=0;i<data.length;i++){const t=i/rate;phase+=2*Math.PI*65.406/rate;data[i]=(Math.sin(phase)+.38*Math.sin(phase*2)+.12*Math.sin(phase*3))*Math.exp(-t*2.2);}})};
  if(event.track==='guitar'||['guitar','clean','muted','pluck'].includes(event.timbre))return {root:48,buffer:makeBuffer(ctx,'guitar-'+event.timbre,2.2,(data,rate)=>{const frequency=130.813,period=Math.round(rate/frequency),ring=new Float32Array(period),noise=seededNoise(seed+17);for(let i=0;i<period;i++)ring[i]=noise();const damp=event.timbre==='muted'?.977:.996;for(let i=0;i<data.length;i++){const j=i%period;data[i]=ring[j];ring[j]=(ring[j]+ring[(j+1)%period])*.5*damp;}})};
  if(event.timbre==='keys')return {root:60,buffer:makeBuffer(ctx,'keys',2.4,(data,rate)=>{for(let i=0;i<data.length;i++){const t=i/rate,env=(1-Math.exp(-t*90))*Math.exp(-t*2.1);data[i]=(Math.sin(2*Math.PI*261.626*t)+.34*Math.sin(2*Math.PI*523.252*t)+.12*Math.sin(2*Math.PI*784.878*t))*env*.68;}})};
  return null;
}
function sampleSource(ctx,event,time,duration,output,entry,velocity){
  const source=ctx.createBufferSource(),gain=ctx.createGain(),rootPitch=entry.root??event.pitch;source.buffer=entry.buffer;source.playbackRate.value=2**((event.pitch-rootPitch)/12);gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(velocity/127*.72,time+.006);gain.gain.exponentialRampToValueAtTime(.0001,time+Math.max(.04,duration));source.connect(gain).connect(output);source.start(time);source.stop(time+Math.max(.06,duration)+.03);return source;
}
function tone(ctx,pitch,velocity,time,duration,timbre,output){
  const frequency=440*2**((pitch-69)/12),gain=ctx.createGain(),source=ctx.createOscillator();gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(velocity/127*.17,time+.007);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);gain.connect(output);source.type=timbre==='bell'?'sine':'triangle';source.frequency.value=frequency;if(timbre==='bell'){const extra=ctx.createOscillator(),g=ctx.createGain();extra.type='sine';extra.frequency.value=frequency*2.76;g.gain.setValueAtTime(velocity/127*.035,time);g.gain.exponentialRampToValueAtTime(.0001,time+duration*.7);extra.connect(g).connect(output);extra.start(time);extra.stop(time+duration);source.extra=extra;}source.connect(gain);source.start(time);source.stop(time+duration+.01);return source;
}
function customEntry(samples,event){const key=event.kind==='drum'?(event.pitch===36?'kick':event.pitch===38?'snare':'hat'):event.track;return samples?.[key]||samples?.[event.track]||null;}
function schedule(ctx,events,step,time,bpm,liveGraph,seed=73,samples={}){
  const interval=60/bpm/4,list=[];
  for(const event of events)if(event.step===step){const at=time+(event.offset||0)*interval,track=event.track||(event.kind==='drum'?'drums':event.kind),output=liveGraph.tracks?.[track]?.input||(event.kind==='drum'?liveGraph.drums:liveGraph.instruments),duration=Math.max(.04,event.length*interval),entry=customEntry(samples,event)||builtin(ctx,event,seed+step),source=entry?sampleSource(ctx,event,at,duration,output,entry,event.velocity):tone(ctx,event.pitch,event.velocity,at,duration,event.timbre,output);list.push(source);if(source.extra)list.push(source.extra);}
  return list;
}
const api={DEFAULTS,TRACKS,settings,graph,schedule};if(typeof module!=='undefined')module.exports=api;else root.QuantumAudio=api;
})(typeof window!=='undefined'?window:globalThis);
