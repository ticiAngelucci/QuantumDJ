const API='https://api.ionq.co/v0.4';
const SITE_ORIGIN='https://quantumdj-qubit-studio.royal-cedar-6360.chatgpt.site';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULTS={variation:.62,density:.78,entanglement:.55,phase:.30,bpm:112,seed:4242,steps:32};
export function validConfig(raw){
  const c={};for(const [key,value]of Object.entries(DEFAULTS))c[key]=raw?.[key]??value;
  for(const key of ['variation','density','entanglement','phase'])if(typeof c[key]!=='number'||!Number.isFinite(c[key])||c[key]<0||c[key]>1)throw new Error('invalid_config');
  if(!Number.isInteger(c.bpm)||c.bpm<60||c.bpm>180||!Number.isInteger(c.seed)||c.seed<1||c.seed>4294967295||![16,32,64].includes(c.steps))throw new Error('invalid_config');
  return c;
}
export function circuitJSON(raw){
  const c=validConfig(raw),circuit=[],ry=(q,rotation)=>circuit.push({gate:'ry',targets:[q],rotation}),cx=(control,target)=>circuit.push({gate:'x',targets:[target],controls:[control]});
  ry(0,Math.PI*(.1+.8*c.variation));ry(1,Math.PI*(.9-.7*c.variation));
  ry(2,2*Math.asin(Math.sqrt(c.density)));ry(3,Math.PI*.45);
  circuit.push({gate:'rz',targets:[0],rotation:2*Math.PI*c.phase},{gate:'rx',targets:[0],rotation:Math.PI/2});
  for(let q=0;q<3;q++){const theta=Math.PI*c.entanglement;ry(q+1,theta/2);cx(q,q+1);ry(q+1,-theta/2);cx(q,q+1);}
  return {qubits:4,gateset:'qis',circuit};
}
export function normalizedProbabilities(raw){
  // SDK-compatible /results/probabilities uses decimal state indices, q0 = LSB.
  const values=Array(16).fill(0);
  if(raw?.probabilities?.registers?.output_all){
    for(const [bits,p]of Object.entries(raw.probabilities.registers.output_all)){
      if(!/^[01]{4}$/.test(bits)||typeof p!=='number'||!Number.isFinite(p)||p<0||p>1)throw new Error('invalid_result');
      values[parseInt(bits,2)]=p;
    }
  }else{
    for(const [key,p]of Object.entries(raw??{})){
      const state=Number(key);
      if(!/^\d+$/.test(key)||!Number.isInteger(state)||state<0||state>15||typeof p!=='number'||!Number.isFinite(p)||p<0||p>1)throw new Error('invalid_result');
      values[state]=p;
    }
  }
  const sum=values.reduce((a,b)=>a+b,0);if(Math.abs(sum-1)>.01)throw new Error('invalid_result');
  return Object.fromEntries(values.map((p,i)=>[i.toString(2).padStart(4,'0'),p/sum]));
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function upstream(path,key,method='GET',body,fetcher=fetch){
  let res;try{res=await fetcher(API+path,{method,headers:{Authorization:'apiKey '+key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000),redirect:'manual'});}catch{throw new Error('network_error');}
  if(!res.ok){if(res.status===401||res.status===403)throw new Error('credentials_rejected');if(res.status===429)throw new Error('rate_limited');if(res.status===404)throw new Error('not_found');throw new Error('ionq_error');}
  try{return await res.json();}catch{throw new Error('invalid_result');}
}
const errors={
  missing_key:'Ingresá tu API key de IonQ para conectar.',
  credentials_rejected:'IonQ rechazó la key o sus permisos. Revisá que corresponda al proyecto de la hackathon.',
  invalid_config:'La configuración del circuito no es válida.',
  invalid_job:'Ese job no corresponde a un circuito QuantumDJ en el simulador.',
  not_found:'IonQ no encontró ese job con esta key.',
  rate_limited:'IonQ está limitando las consultas. Esperá unos segundos y retomá el job.',
  network_error:'No se pudo completar la conexión con IonQ. Si ya aparece un job ID, retomá ese job.',
  ionq_error:'IonQ no pudo completar la solicitud. Revisá el proyecto y el estado del servicio.',
  invalid_result:'El resultado de IonQ no tiene el formato esperado.',
  job_failed:'El job falló en IonQ. Revisá su estado en la consola.',
  job_canceled:'El job fue cancelado en IonQ.'
};
export async function handleIonQ(request,env={},fetcher=fetch){
  // Sites dispatch enforces the retained owner-private audience.
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin&&origin!==SITE_ORIGIN)return json({error:'Origen no permitido.'},403);
  if(request.method==='GET')return json({server_key_configured:!!env.IONQ_API_KEY});
  if(request.method!=='POST')return json({error:'Método no permitido.'},405);
  try{
    const text=await request.text();if(text.length>10000)return json({error:'Solicitud demasiado grande.'},413);
    let body;try{body=JSON.parse(text);}catch{return json({error:'JSON inválido.'},400);}
    const key=typeof body.api_key==='string'&&body.api_key.trim()?body.api_key.trim():env.IONQ_API_KEY;
    if(!key||typeof key!=='string'||key.length>1000||/[\r\n]/.test(key))throw new Error('missing_key');
    if(body.action==='check'){await upstream('/whoami',key,'GET',undefined,fetcher);return json({connected:true,backend:'simulator'});}
    if(body.action==='submit'){
      const c=validConfig(body.config);
      const payload={type:'ionq.circuit.v1',backend:'simulator',name:'QuantumDJ / '+c.seed,shots:1024,input:circuitJSON(c),metadata:{app:'QuantumDJ',config:JSON.stringify(c),bit_order:'q3 q2 q1 q0'}};
      const job=await upstream('/jobs',key,'POST',payload,fetcher);
      if(!UUID.test(job.id))throw new Error('invalid_result');
      return json({job_id:job.id,status:job.status??'submitted',backend:'simulator',config:c});
    }
    if(body.action==='status'){
      if(typeof body.job_id!=='string'||!UUID.test(body.job_id))throw new Error('invalid_job');
      const job=await upstream('/jobs/'+body.job_id,key,'GET',undefined,fetcher);
      if(job.backend!=='simulator'||job.metadata?.app!=='QuantumDJ')throw new Error('invalid_job');
      if(job.status==='failed')throw new Error('job_failed');
      if(job.status==='canceled')throw new Error('job_canceled');
      if(job.status!=='completed')return json({job_id:body.job_id,status:job.status??'submitted'});
      let c;try{c=validConfig(JSON.parse(job.metadata.config));}catch{throw new Error('invalid_job');}
      const raw=await upstream('/jobs/'+body.job_id+'/results/probabilities',key,'GET',undefined,fetcher);
      return json({job_id:body.job_id,status:'completed',result:{schema:'quantumdj.v1',backend:'ionq-simulator',execution:'web',job_id:body.job_id,config:c,probabilities:normalizedProbabilities(raw),bit_order:'q3 q2 q1 q0',requested_shots:1024,sequence_method:'Classical sampling from IonQ cloud simulator probabilities',created_at:new Date().toISOString()}});
    }
    return json({error:'Acción no válida.'},400);
  }catch(e){
    const code=Object.hasOwn(errors,e.message)?e.message:'ionq_error';
    return json({code,error:errors[code]},['missing_key','invalid_config','invalid_job'].includes(code)?400:502);
  }
}
