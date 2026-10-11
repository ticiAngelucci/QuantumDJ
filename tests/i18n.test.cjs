const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const stored=new Map();
const document={
  documentElement:{lang:'es'},
  querySelectorAll:()=>[],
  getElementById:()=>null,
  dispatchEvent:()=>{},
};
const window={};
const context={
  window,document,
  navigator:{language:'es-AR'},
  localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},
  CustomEvent:class CustomEvent{constructor(type,options){this.type=type;this.detail=options?.detail;}},
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/i18n.js'),'utf8'),context);
const i18n=window.QuantumI18n;

assert.equal(i18n.init(),'es');
assert.equal(i18n.t('hero.cta'),'AL ESTUDIO ↘');
assert.equal(i18n.setLanguage('en'),'en');
assert.equal(document.documentElement.lang,'en');
assert.equal(stored.get('quantumdj-language'),'en');
assert.equal(i18n.t('hero.cta'),'ENTER THE STUDIO ↘');
assert.equal(i18n.t('dynamic.stepTitle',{step:2,note:'C4',bits:'0101',velocity:96}),'Step 2: C4, state 0101, velocity 96');
assert.match(i18n.t('technical.scope'),/classical quantum-state simulator/);

const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const keys=[...html.matchAll(/data-i18n(?:-html|-aria|-title|-placeholder|-alt|-content)?="([^"]+)"/g)].map(match=>match[1]);
assert.ok(keys.length>90);
for(const key of keys)assert.ok(i18n.has(key),`Missing translation: ${key}`);

console.log('PASS: Spanish/English selection, interpolation, persistence, and complete static translation keys.');
