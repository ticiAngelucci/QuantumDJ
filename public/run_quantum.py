#!/usr/bin/env python3
"""Execute the exact QuantumDJ circuit in Qiskit or the IonQ cloud simulator."""
import argparse
import getpass
import json
import math
import os
from pathlib import Path
from datetime import datetime, timezone

DEFAULTS = dict(variation=.62, density=.78, entanglement=.55, phase=.30, bpm=112, seed=4242, steps=32)

def validate_config(raw):
    c = {**DEFAULTS, **raw}
    for key in ('variation', 'density', 'entanglement', 'phase'):
        if isinstance(c[key], bool) or not isinstance(c[key], (float, int)) or not math.isfinite(c[key]) or not 0 <= c[key] <= 1:
            raise ValueError(f'Invalid parameter: {key}')
    for key, low, high in (('bpm', 60, 180), ('seed', 1, 4294967295)):
        if type(c[key]) is not int or not low <= c[key] <= high:
            raise ValueError(f'Invalid parameter: {key}')
    if type(c['steps']) is not int or c['steps'] not in (16, 32, 64):
        raise ValueError('Invalid number of steps')
    return c

def build_circuit(c, measure=True):
    from qiskit import QuantumCircuit
    c = validate_config(c)
    qc = QuantumCircuit(4, name='QuantumDJ loop')
    qc.ry(math.pi * (.1 + .8 * c['variation']), 0)
    qc.ry(math.pi * (.9 - .7 * c['variation']), 1)
    qc.ry(2 * math.asin(math.sqrt(c['density'])), 2)
    qc.ry(math.pi * .45, 3)
    qc.rz(2 * math.pi * c['phase'], 0)
    qc.rx(math.pi / 2, 0)
    # Controlled-RY expressed with IonQ QIS-compatible primitive gates.
    for control in range(3):
        target = control + 1
        theta = math.pi * c['entanglement']
        qc.ry(theta / 2, target)
        qc.cx(control, target)
        qc.ry(-theta / 2, target)
        qc.cx(control, target)
    if measure:
        qc.measure_all()
    return qc

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend', choices=['local', 'ionq'], default='local')
    parser.add_argument('--config', type=Path, help='Config JSON exported from the demo')
    parser.add_argument('--output', type=Path, default=Path('quantum-result.json'))
    parser.add_argument('--shots', type=int, default=1024)
    parser.add_argument('--job-id', help='Retrieve an already submitted IonQ simulator job; use the SAME config')
    parser.add_argument('--timeout', type=int, default=180)
    args = parser.parse_args()
    if not 1 <= args.shots <= 10000 or args.timeout < 1:
        parser.error('shots must be 1..10000 and timeout must be positive')
    if args.job_id and args.backend != 'ionq':
        parser.error('--job-id requires --backend ionq')
    raw = json.loads(args.config.read_text()) if args.config else {}
    c = validate_config(raw.get('config', raw))
    qc = build_circuit(c)
    job_id = None
    if args.backend == 'local':
        from qiskit.quantum_info import Statevector
        sv = Statevector.from_instruction(build_circuit(c, measure=False))
        sv.seed(c['seed'])
        counts = dict(sv.sample_counts(args.shots))
        source = 'qiskit-statevector'
    else:
        from qiskit_ionq import IonQProvider
        key = os.environ.get('IONQ_API_KEY') or getpass.getpass('IonQ API key (hidden): ')
        if not key.strip():
            parser.error('An IonQ API key is required')
        backend = IonQProvider(key).get_backend('simulator')
        job = backend.retrieve_job(args.job_id) if args.job_id else backend.run(qc, shots=args.shots)
        job_id = job.job_id()
        print(f'IonQ job ID: {job_id}', flush=True)
        print('Waiting for simulator result...', flush=True)
        # Timeout leaves the printed job ID available for retrieval; no auto-resubmission.
        result = job.result(timeout=args.timeout)
        counts = result.get_counts()
        source = 'ionq-simulator'
    counts = {str(k).replace(' ', ''): int(v) for k, v in counts.items()}
    payload = dict(schema='quantumdj.v1', backend=source, job_id=job_id,
                   created_at=datetime.now(timezone.utc).isoformat(), config=c,
                   shots=sum(counts.values()), counts=counts, circuit=str(qc),
                   bit_order='q3 q2 q1 q0',
                   sequence_method='Classical resampling of the returned histogram, using config.seed')
    args.output.write_text(json.dumps(payload, indent=2))
    print(f'Saved: {args.output.resolve()} ({payload["shots"]} shots)')

if __name__ == '__main__':
    main()
