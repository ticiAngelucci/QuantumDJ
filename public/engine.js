(function(root){
  'use strict';
  const SCALE=[0,3,5,7,10,12,15,17];
  const SCALES={
    minorPentatonic:{intervals:SCALE,label:'Minor pentatonic'},
    majorPentatonic:{intervals:[0,2,4,7,9,12,14,16],label:'Major pentatonic'},
    major:{intervals:[0,2,4,5,7,9,11,12],label:'Major'},
    naturalMinor:{intervals:[0,2,3,5,7,8,10,12],label:'Natural minor'},
    dorian:{intervals:[0,2,3,5,7,9,10,12],label:'Dorian'},
    mixolydian:{intervals:[0,2,4,5,7,9,10,12],label:'Mixolydian'}
  };
  const KEY_NAMES=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const DEFAULTS={variation:0.62,density:0.78,entanglement:0.55,phase:0.30,bpm:112,seed:4242,steps:32,root:0,scale:'minorPentatonic'};
  function config(input={}){
    const c={...DEFAULTS,...input};
    for(const key of ['variation','density','entanglement','phase']){
      if(!Number.isFinite(c[key])||c[key]<0||c[key]>1) throw Error('Parámetro inválido: '+key);
    }
    if(!Number.isInteger(c.bpm)||c.bpm<60||c.bpm>180)throw Error('Tempo inválido');
    if(!Number.isInteger(c.seed)||c.seed<1||c.seed>4294967295)throw Error('Semilla inválida');
    if(![16,32,64].includes(c.steps))throw Error('Longitud inválida');
    if(!Number.isInteger(c.root)||c.root<0||c.root>11)throw Error('Tonalidad inválida');
    if(!Object.hasOwn(SCALES,c.scale))throw Error('Escala inválida');
    return c;
  }
  function scalePitches(input={}){const c=config(input);return SCALES[c.scale].intervals.map(interval=>48+c.root+interval);}
  function probabilities(input){
    const c=config(input), re=Array(16).fill(0),im=Array(16).fill(0);re[0]=1;
    function ry(q,theta,control=-1){const co=Math.cos(theta/2),si=Math.sin(theta/2),mask=1<<q;
      for(let a=0;a<16;a++)if(!(a&mask)&&(control<0||(a&(1<<control)))){
        const b=a|mask,ar=re[a],ai=im[a],br=re[b],bi=im[b];
        re[a]=co*ar-si*br;im[a]=co*ai-si*bi;re[b]=si*ar+co*br;im[b]=si*ai+co*bi;
      }
    }
    function rz(q,theta){for(let a=0;a<16;a++){
      const angle=(a&(1<<q))?theta/2:-theta/2,co=Math.cos(angle),si=Math.sin(angle),r=re[a],v=im[a];
      re[a]=r*co-v*si;im[a]=r*si+v*co;
    }}
    function rx(q,theta){const co=Math.cos(theta/2),si=Math.sin(theta/2),mask=1<<q;
      for(let a=0;a<16;a++)if(!(a&mask)){const b=a|mask,ar=re[a],ai=im[a],br=re[b],bi=im[b];
        re[a]=co*ar+si*bi;im[a]=co*ai-si*br;re[b]=co*br+si*ai;im[b]=co*bi-si*ar;
      }
    }
    ry(0,Math.PI*(0.1+0.8*c.variation));ry(1,Math.PI*(0.9-0.7*c.variation));
    ry(2,2*Math.asin(Math.sqrt(c.density)));ry(3,Math.PI*0.45);
    rz(0,2*Math.PI*c.phase);rx(0,Math.PI/2);
    for(let q=0;q<3;q++)ry(q+1,Math.PI*c.entanglement,q);
    return re.map((v,i)=>v*v+im[i]*im[i]);
  }
  function rng(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
  function sample(p,r){const v=r();let sum=0;for(let i=0;i<p.length;i++){sum+=p[i];if(v<sum)return i;}return p.length-1;}
  function sequence(p,input){const c=config(input),r=rng(c.seed),pitches=scalePitches(c);return Array.from({length:c.steps},(_,step)=>{
    const state=sample(p,r),index=(state&3)+((state>>3)&1)*4;
    return {step,state,bits:state.toString(2).padStart(4,'0'),note:pitches[index],active:!!(state&4),velocity:(state&8)?108:72,length:1};
  });}
  function counts(p,seed,shots=1024){const r=rng(seed),out={};for(let k=0;k<shots;k++){const key=sample(p,r).toString(2).padStart(4,'0');out[key]=(out[key]||0)+1;}return out;}
  function normalizeNotes(raw,steps){
    const byStep=new Map();
    for(const value of Array.isArray(raw)?raw:[]){
      if(!value||!Number.isInteger(value.step)||value.step<0||value.step>=steps||byStep.has(value.step))continue;
      const note=Number.isInteger(value.note)?Math.max(24,Math.min(96,value.note)):48;
      byStep.set(value.step,{step:value.step,state:Number.isInteger(value.state)?value.state:0,bits:/^[01]{4}$/.test(value.bits||'')?value.bits:'0000',note,active:!!value.active,velocity:Math.max(1,Math.min(127,Math.round(value.velocity||72))),length:Math.max(1,Math.min(steps-value.step,Math.round(value.length||1)))});
    }
    return Array.from({length:steps},(_,step)=>byStep.get(step)||{step,state:0,bits:'0000',note:48,active:false,velocity:72,length:1});
  }
  function importResult(data){
    if(data.schema!=='quantumdj.v1'||!['qiskit-statevector','ionq-simulator'].includes(data.backend))throw Error('Formato QuantumDJ inválido');
    const c=config(data.config),p=Array(16).fill(0);let total=0;
    if(data.backend==='ionq-simulator'&&(typeof data.job_id!=='string'||!data.job_id.trim()))throw Error('Falta job ID de IonQ');
    if(data.probabilities){
      for(const [key,v]of Object.entries(data.probabilities)){if(!/^[01]{4}$/.test(key)||!Number.isFinite(v)||v<0||v>1)throw Error('Probabilidades inválidas');p[parseInt(key,2)]=v;total+=v;}
      if(Math.abs(total-1)>.01)throw Error('Distribución no normalizada');
      return {config:c,probabilities:p.map(x=>x/total),metadata:data};
    }
    if(!data.counts||typeof data.counts!=='object'||Array.isArray(data.counts))throw Error('Faltan counts');
    for(const [key,count]of Object.entries(data.counts)){
      if(!/^[01]{4}$/.test(key)||!Number.isInteger(count)||count<0)throw Error('Counts inválidos');
      p[parseInt(key,2)]=count;total+=count;
    }
    if(total<1||total!==data.shots)throw Error('Shots inconsistentes');
    return {config:c,probabilities:p.map(x=>x/total),metadata:data};
  }
  function emptyDrumPattern(steps=32){return {kick:Array(steps).fill(false),snare:Array(steps).fill(false),hat:Array(steps).fill(false)};}
  function defaultDrumPattern(steps=32,kit='electro'){
    const pattern=emptyDrumPattern(steps),rock=kit==='rock';
    for(let step=0;step<steps;step++){
      pattern.kick[step]=step%4===0||(rock&&step%16===10);
      pattern.snare[step]=step%8===4;
      pattern.hat[step]=step%(rock?1:2)===0;
    }
    return pattern;
  }
  function normalizedDrumPattern(raw,steps,kit){
    const fallback=defaultDrumPattern(steps,kit);
    if(!raw||typeof raw!=='object')return fallback;
    return Object.fromEntries(['kick','snare','hat'].map(track=>[track,Array.from({length:steps},(_,step)=>!!raw[track]?.[step])]));
  }
  function trackState(raw,kind){
    const value=raw?.tracks?.[kind]||{};
    return {mute:!!value.mute,solo:!!value.solo,pan:Math.max(-1,Math.min(1,Number(value.pan)||0)),effect:['dry','delay','reverb'].includes(value.effect)?value.effect:'dry',effectAmount:Math.max(0,Math.min(100,Number(value.effectAmount)||0))};
  }
  function arrangement(notes,raw={}){
    const m={melody:'synth',melodyVolume:100,drums:'electro',drumVolume:100,bassVolume:0,guitar:'off',guitarVolume:0,...raw},out=[],steps=notes.length;
    const states=Object.fromEntries(['melody','drums','bass','guitar'].map(kind=>[kind,trackState(m,kind)]));
    const anySolo=Object.values(states).some(value=>value.solo),enabled=kind=>!states[kind].mute&&(!anySolo||states[kind].solo);
    const pattern=normalizedDrumPattern(m.drumPattern,steps,m.drums);
    const add=(step,pitch,velocity,length,channel,kind,timbre,offset=0)=>{const track=kind==='drum'?'drums':kind;if(velocity>0&&enabled(track))out.push({step,pitch,velocity:Math.max(1,Math.min(127,Math.round(velocity))),length,channel,kind,track,timbre,offset});};
    notes.forEach(n=>{
      if(n.active)add(n.step,n.note,n.velocity*m.melodyVolume/100,Math.max(.25,n.length||1),0,'melody',m.melody);
      if(m.drums!=='none'&&m.drumVolume>0){
        if(pattern.kick[n.step])add(n.step,36,100*m.drumVolume/100,.5,9,'drum',m.drums);
        if(pattern.snare[n.step])add(n.step,38,(m.drums==='lofi'?70:95)*m.drumVolume/100,.5,9,'drum',m.drums);
        if(pattern.hat[n.step])add(n.step,42,(n.step%4===0?58:38)*m.drumVolume/100,.25,9,'drum',m.drums);
      }
      if(m.bassVolume>0&&[0,6,8,14].includes(n.step%16))add(n.step,n.step%32<16?36:34,105*m.bassVolume/100,1.8,1,'bass','bass');
      if(m.guitar!=='off'&&m.guitarVolume>0&&n.step%8===0){
        const root=48+(Number.isInteger(m.root)?m.root:0),chords=[[0,3,7],[3,7,10],[-2,2,5],[0,3,7]],chord=chords[Math.floor(n.step/8)%4];
        chord.forEach((pitch,i)=>add(n.step,root+pitch,85*m.guitarVolume/100,m.guitar==='muted'?1.4:3.5,2,'guitar',m.guitar,i*.10));
      }
    });return out;
  }
  function midi(notes,bpm,mix){
    const bytes=[],push=(...v)=>bytes.push(...v),ascii=s=>[...s].map(x=>x.charCodeAt(0)),u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
    const vlq=n=>{let a=[n&127];while(n>>=7)a.unshift((n&127)|128);return a;};
    const tempo=Math.round(60000000/bpm),events=[{t:0,data:[255,81,3,(tempo>>16)&255,(tempo>>8)&255,tempo&255]}];
    if(mix){const programs={synth:80,keys:4,bell:10,pluck:24,guitar:25};events.push({t:0,data:[192,programs[mix.melody]??80]},{t:0,data:[193,33]},{t:0,data:[194,mix.guitar==='muted'?28:25]});for(const [kind,ch]of [['melody',0],['bass',1],['guitar',2]])events.push({t:0,data:[176+ch,10,Math.round((trackState(mix,kind).pan+1)*63.5)]});}
    for(const e of arrangement(notes,mix)){const t=Math.round((e.step+e.offset)*120);events.push({t,data:[144+e.channel,e.pitch,e.velocity]},{t:Math.min(notes.length*120,t+Math.round(e.length*120)),data:[128+e.channel,e.pitch,0]});}
    events.sort((a,b)=>a.t-b.t);const track=[];let previous=0;
    for(const e of events){track.push(...vlq(e.t-previous),...e.data);previous=e.t;}
    track.push(...vlq(Math.max(0,notes.length*120-previous)),255,47,0);
    push(...ascii('MThd'),...u32(6),0,0,0,1,1,224,...ascii('MTrk'),...u32(track.length),...track);return new Uint8Array(bytes);
  }
  const api={DEFAULTS,SCALE,SCALES,KEY_NAMES,config,scalePitches,probabilities,sequence,normalizeNotes,counts,importResult,emptyDrumPattern,defaultDrumPattern,arrangement,midi};
  if(typeof module!=='undefined')module.exports=api;else root.QuantumDJ=api;
})(typeof window!=='undefined'?window:globalThis);
