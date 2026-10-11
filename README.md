# QuantumDJ — Qubits into grooves

Un instrumento de cuatro qubits para productores: ejecutar un circuito en el simulador de IonQ, transformar su distribución en un loop y combinarlo con sonidos base. Diseño neobrutalista y mascota original Qubi.

## Usar la demo

1. Abrí la web publicada → **Conectar IonQ**.
2. Ingresá tu API key en el campo de contraseña → **Conectar con IonQ**.
3. Ajustá el circuito → **Ejecutar en IonQ**.
4. La web envía un job, consulta su estado y carga sus probabilidades reales. Muestra el job ID y **IONQ · SIMULADOR CLOUD**.
5. Escuchá, elegí sonidos y mové los volúmenes en **Armá tu mezcla**.
6. Exportá **WAV**, **MIDI** o **JSON** para conservar el resultado.

El backend está fijado al simulador, sin envío a QPU. La vista previa inicial es local y aparece como **PREVIA LOCAL · SIN EJECUTAR**. Cambiar parámetros cuánticos vuelve a esa vista previa hasta ejecutar otro job; cambiar sonidos conserva el resultado de IonQ. ↻ muestrea otra secuencia desde la misma distribución sin enviar otro job.

Si un job demora o una consulta falla, su ID permanece visible. Usá **Conectar IonQ → Recuperar un job** con la misma key para retomar el job existente. No se reenvía automáticamente un job tras un error de red. El servidor comprueba que el job sea de QuantumDJ, en el simulador, y recupera su configuración original.

## Sonidos y exportación

- Melodía cuántica: synth, campanas, pluck o guitarra sintetizada.
- Baterías: Electro, Lo-fi, Rock o silencio.
- Bajo con volumen independiente.
- Guitarra base: acordes limpios, apagados o silencio.
- Efectos: seco, delay o reverb, con intensidad ajustable.

Sonidos sintetizados con Web Audio, sin samples externos. La guitarra usa un modelo de cuerda pulsada; la batería, osciladores y ruido filtrado. Ritmos, acordes, sonido y efectos son clásicos; las decisiones de la melodía vienen de la distribución del circuito.

El WAV incluye mezcla y efectos. El MIDI conserva notas, velocidades, canales e indicaciones General MIDI para continuar en un DAW, cuyo sonido puede diferir del sintetizador de la web.

## Credenciales

La key permanece en memoria durante la sesión. Se transmite por HTTPS al servidor de este Site para comunicarse con IonQ; no se guarda en archivos, localStorage, sessionStorage, resultados ni código. **Desconectar** limpia la key de la sesión. No se registran claves ni cuerpos de solicitudes en logs.

También se admite el secreto de servidor IONQ_API_KEY, configurado en los ajustes protegidos de Sites. Nunca se incluye en el manifiesto ni en el cliente. La web conserva el acceso privado del propietario y el servidor se apoya en esa frontera de acceso.

## Circuito y alcance

Desde |0000⟩: RY en q0 y q1 según variación; RY en q2 con ángulo 2 asin(sqrt(density)); RY(0.45π) en q3; RZ(2π × phase), luego RX(π/2), en q0; CRY(π × entanglement) en q0→q1, q1→q2, q2→q3; medición final.

Cada CRY equivale a RY(θ/2), CX, RY(−θ/2), CX. La lista de 18 puertas del servidor coincide con la conversión de Qiskit-IonQ. IonQ JSON mide todos los qubits al final; el runner Qiskit incluye measure_all().

| Bits, orden q3 q2 q1 q0 | Rol |
| --- | --- |
| q1 q0 | Grupo de cuatro alturas |
| q2 | Nota o silencio |
| q3 | Registro y acento |

Escala desde MIDI 48: [0,3,5,7,10,12,15,17], Do menor pentatónica. El enlace también cambia la densidad final. Se muestran entropía de Shannon e información mutua I(q0;q1), en bits; las correlaciones de mediciones no prueban entrelazamiento.

La web usa un servidor Vinext/Cloudflare y la API oficial IonQ v0.4 para enviar/consultar jobs y recuperar probabilidades. No ejecuta Python en el Worker: Qiskit se usa en la referencia, el runner Python y las comprobaciones de equivalencia.

El simulador ideal devuelve probabilidades e ignora shots; el loop se muestrea clásicamente de esa distribución. El JSON web conserva requested_shots y no afirma que se observaron 1.024 mediciones. Los archivos del runner Python conservan su histograma obtenido.

No se afirma ventaja cuántica, superioridad musical ni ejecución en hardware. Es un experimento creativo interpretable y exportable.

## Ejecutar el runner Qiskit

Python 3.11+, en un entorno virtual:

    python -m pip install -r requirements.txt
    python tools/run_quantum.py --backend ionq --config quantum-config.json --output ionq-result.json

Descargá la configuración en el panel avanzado. El runner lee IONQ_API_KEY o la pide sin mostrarla. Para probar sin IonQ, usá --backend local. Los archivos pueden importarse en la web. Para recuperar un job, usá --job-id con la misma configuración.

## Código y desarrollo local

- public/: interfaz, simulador, sintetizador y mascota.
- lib/ionq.mjs: cliente y validador de la API.
- build/sites-worker.ts: ruta /api/ionq integrada con Sites.
- app/route.ts: interfaz del estudio.
- tools/sync_studio.py: sincroniza el HTML en el módulo de la ruta.
- tools/run_quantum.py: Qiskit y proveedor IonQ.
- tests/: pruebas del motor y la API.

Node 22.13+ y pnpm 11.25.0:

    pnpm install
    pnpm dev

Para construir:

    python tools/sync_studio.py
    pnpm build

Para probar únicamente el instrumento local, serví public/ con python -m http.server 8000 --directory public y elegí **Local · prueba sin API**. La conexión directa a IonQ necesita el servidor completo o la web publicada.

## Validación

Probado con Python 3.12, Qiskit 2.5.2, qiskit-ionq 1.1.1 y Node 24.19.

    node tests/engine.test.cjs
    node tests/ionq.test.mjs
    python tests/validate_physics.py

- Los 16 estados coinciden con Qiskit en 30 configuraciones, error máximo ~1e−15.
- API comprobada con respuestas de prueba: conexión, envío, consulta, errores, claves, resultado y ausencia de shots ficticios.
- Con QDJ_TEST_PYTHON definido, el test IonQ compara la lista de puertas con la conversión Qiskit-IonQ.
- Mezclas de guitarra/bajo/batería renderizadas con Web Audio en Node: seco, delay y reverb; señales finitas, no silenciosas y sin recorte.
- Prueba DOM: conexión, borrado del campo de key, envío/consulta, fuente del resultado y cambios musicales.
- Build de producción del servidor completado.

La primera ejecución real sigue pendiente de ingresar la key del equipo en la web. La revisión visual y la escucha en el navegador de presentación también quedan pendientes.

## Pitch

“QuantumDJ turns a four-qubit circuit into an editable musical starting point. We change rotations, phase and controlled interactions, send the circuit to the IonQ simulator, and hear a loop sampled from its actual distribution. Producers add drums, bass, guitar and effects, then export MIDI or WAV into their DAW. We keep the IonQ job ID and result visible. This is a creative experiment, not a claim of quantum advantage.”

Demo: conectar → ejecutar → mostrar job ID → escuchar → sumar guitarra y cambiar batería → exportar. Conservá un JSON real, añadí autores del equipo y seguí las reglas vigentes de la hackathon.

## Diseño, atribución y referencias

Qubi: public/assets/Qubi-QuantumDJ.png, recurso activo de la interfaz. La presentación usa una grilla azul tenue, superficies blancas, bordes y sombras sólidas en azul marino, azul principal y acentos amarillos.

Código y documentación con asistencia de ChatGPT/Codex. Añadí los integrantes y la atribución exigida por la hackathon. MIT; dependencias conservan sus licencias.

[IonQ Qiskit](https://docs.ionq.com/sdks/qiskit) · [API directa](https://docs.ionq.com/guides/direct-api-submission) · [Formatos de resultados](https://docs.ionq.com/api-reference/v0.4/schemas/results-formats)
