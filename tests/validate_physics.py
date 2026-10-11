"""Independent Qiskit reference: compare every basis-state probability."""
import json
import random
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from run_quantum import build_circuit, DEFAULTS
from qiskit.quantum_info import Statevector
from qiskit_ionq.helpers import qiskit_circ_to_ionq_circ

random.seed(731)
configs = [DEFAULTS, {**DEFAULTS, 'entanglement': 0}, {**DEFAULTS, 'density': 0},
           {**DEFAULTS, 'density': 1}, {**DEFAULTS, 'phase': 0}, {**DEFAULTS, 'phase': 1}]
configs += [{**DEFAULTS, **{k: random.random() for k in ['variation', 'density', 'entanglement', 'phase']}} for _ in range(24)]
script = "const vm=require('node:vm'),fs=require('node:fs'),m={exports:{}};vm.runInNewContext(fs.readFileSync('./public/engine.js','utf8'),{module:m});const Q=m.exports;let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>process.stdout.write(JSON.stringify(JSON.parse(s).map(c=>Q.probabilities(c)))));"
result = subprocess.run(['node', '-e', script], cwd=ROOT, input=json.dumps(configs), text=True, capture_output=True, check=True)
js = json.loads(result.stdout)
largest = 0
for c, p in zip(configs, js):
    reference = Statevector.from_instruction(build_circuit(c, measure=False)).probabilities()
    error = max(abs(float(a)-b) for a,b in zip(reference,p))
    largest = max(largest,error)
    assert error < 1e-12, error
    assert abs(sum(p)-1) < 1e-12
    qiskit_circ_to_ionq_circ(build_circuit(c), gateset='qis')
print(f'PASS: {len(configs)} circuits, all 16 probabilities match Qiskit; max error {largest:.2g}; IonQ QIS conversion passes.')
