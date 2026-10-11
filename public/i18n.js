'use strict';
(function(root){
  const messages={
    'meta.description':['Explorá ideas musicales con un instrumento de cuatro qubits. Generá loops, escuchá las mediciones y exportá MIDI.','Explore musical ideas with a four-qubit instrument. Generate loops, hear the measurements, and export MIDI.'],
    'brand.home':['QuantumDJ inicio','QuantumDJ home'],
    'nav.sections':['Secciones','Sections'],
    'nav.studio':['EL ESTUDIO','THE STUDIO'],
    'nav.how':['CÓMO FUNCIONA','HOW IT WORKS'],
    'language.switch':['Switch to English','Cambiar a español'],
    'ionq.connect':['Conectar IonQ','Connect IonQ'],
    'ionq.connected':['IONQ CONECTADO','IONQ CONNECTED'],
    'hero.eyebrow':['CUATRO QUBITS. CERO MIEDO.','FOUR QUBITS. ZERO FEAR.'],
    'hero.title':['TUS IDEAS.<br>OTRO<br><em>UNIVERSO.</em>','YOUR IDEAS.<br>ANOTHER<br><em>UNIVERSE.</em>'],
    'hero.body':['Jugá con las probabilidades, encontrá tu próximo loop y llevátelo a tu DAW. Este estudio es tuyo.','Play with probabilities, find your next loop, and take it to your DAW. This studio is yours.'],
    'hero.cta':['AL ESTUDIO ↘','ENTER THE STUDIO ↘'],
    'hero.note':['UN EXPERIMENTO MUSICAL PARA QOLLAB / VOL. 01','A MUSICAL EXPERIMENT FOR QOLLAB / VOL. 01'],
    'mascot.hello':['HEY! SOY QUBI ♫',"HEY! I'M QUBI ♫"],
    'mascot.alt':['Qubi, la mascota robot de QuantumDJ, con auriculares amarillos y una consola DJ azul','Qubi, the QuantumDJ robot mascot, wearing yellow headphones and mixing on a blue DJ console'],
    'mascot.caption':['TU COPILOTO DE LOOPS ↗','YOUR LOOP COPILOT ↗'],
    'features.label':['Funciones','Features'],
    'features.states':['4 QUBITS / 16 ESTADOS','4 QUBITS / 16 STATES'],
    'features.generate':['GENERÁ + ESCUCHÁ','GENERATE + LISTEN'],
    'features.export':['EXPORTÁ MIDI + WAV','EXPORT MIDI + WAV'],
    'features.own':['HACÉLO TUYO','MAKE IT YOURS'],
    'studio.label':['Secuenciador musical','Music sequencer'],
    'studio.yourLoop':['TU LOOP','YOUR LOOP'],
    'studio.engine':['MOTOR','ENGINE'],
    'studio.ionqBackend':['IonQ · simulador cloud','IonQ · cloud simulator'],
    'studio.localBackend':['Local · prueba sin API','Local · API-free test'],
    'studio.runIonq':['⚛ Ejecutar en IonQ','⚛ Run on IonQ'],
    'studio.generateLocal':['Generar localmente','Generate locally'],
    'studio.running':['IonQ está ejecutando…','IonQ is running…'],
    'studio.listen':['Escuchar loop','Listen to loop'],
    'studio.stop':['Detener','Stop'],
    'studio.generateTitle':['Generar una nueva secuencia','Generate a new sequence'],
    'studio.downloadEvidence':['Descargar evidencia de ejecución','Download execution evidence'],
    'studio.rollLabel':['Piano roll: notas generadas','Piano roll: generated notes'],
    'studio.barOne':['COMPÁS 01','BAR 01'],
    'studio.note':['NOTA','NOTE'],
    'studio.accent':['ACENTO','ACCENT'],
    'studio.classicLayers':['+ CAPAS CLÁSICAS','+ CLASSIC LAYERS'],
    'studio.layers':['Batería · Bajo · Guitarra','Drums · Bass · Guitar'],
    'studio.statesToSounds':['De estados a sonidos','From states to sounds'],
    'studio.histogramLabel':['Probabilidades de los 16 estados cuánticos','Probabilities of the 16 quantum states'],
    'studio.entropy':['ENTROPÍA DE MEDICIÓN / BITS','MEASUREMENT ENTROPY / BITS'],
    'studio.correlation':['CORRELACIÓN q0 ↔ q1 / BITS','CORRELATION q0 ↔ q1 / BITS'],
    'studio.notes':['NOTAS EN ESTE LOOP','NOTES IN THIS LOOP'],
    'controls.label':['Controles de composición','Composition controls'],
    'controls.eyebrow':['DALE TU DIRECCIÓN','SHAPE YOUR DIRECTION'],
    'controls.title':['Mové perillas.<br>Encontrá algo.','TURN KNOBS.<br>FIND SOMETHING.'],
    'preset.mist':['Neblina','Mist'],
    'preset.pulse':['Pulso','Pulse'],
    'preset.orbit':['Órbita','Orbit'],
    'controls.variation':['Variación','Variation'],
    'controls.variationHelp':['Cambiá el equilibrio entre las notas.','Change the balance between notes.'],
    'controls.density':['Densidad','Density'],
    'controls.densityHelp':['Ajustá la preparación del qubit de ritmo.','Adjust how the rhythm qubit is prepared.'],
    'controls.entanglement':['Enlace entre qubits','Qubit links'],
    'controls.entanglementHelp':['Explorá cambios en las correlaciones.','Explore changes in the correlations.'],
    'controls.phase':['Fase','Phase'],
    'controls.phaseHelp':['Transformá interferencia en probabilidades.','Turn interference into probabilities.'],
    'controls.tempo':['TEMPO','TEMPO'],
    'controls.length':['LONGITUD','LENGTH'],
    'controls.oneBar':['1 compás','1 bar'],
    'controls.twoBars':['2 compases','2 bars'],
    'controls.fourBars':['4 compases','4 bars'],
    'controls.scale':['Do menor pentatónica','C minor pentatonic'],
    'controls.scaleHelp':['Una paleta armónica lista para experimentar.','A harmonic palette ready to explore.'],
    'controls.tip':['Probá el mismo loop con diferentes enlaces. Después generá otra variación.','Try the same loop with different qubit links. Then generate another variation.'],
    'mix.label':['Biblioteca de sonidos','Sound library'],
    'mix.eyebrow':['QUBITS + SONIDOS BASE','QUBITS + FOUNDATIONAL SOUNDS'],
    'mix.title':['Armá tu mezcla.','Build your mix.'],
    'mix.synthetic':['SONIDOS SINTETIZADOS / SIN DESCARGAS','SYNTHESIZED SOUNDS / NO DOWNLOADS'],
    'mix.quantumMelody':['MELODÍA CUÁNTICA','QUANTUM MELODY'],
    'mix.softSynth':['Synth suave','Soft synth'],
    'mix.bells':['Campanas','Bells'],
    'mix.synthGuitar':['Guitarra sintetizada','Synthesized guitar'],
    'mix.volume':['Volumen','Volume'],
    'mix.drums':['BATERÍA','DRUMS'],
    'mix.noDrums':['Sin batería','No drums'],
    'mix.bass':['BAJO','BASS'],
    'mix.bassHelp':['Un pulso grave para sostener el loop. Bajalo a cero para silenciar.','A low pulse to anchor the loop. Turn it down to zero to mute it.'],
    'mix.guitar':['GUITARRA BASE','RHYTHM GUITAR'],
    'mix.noGuitar':['Sin guitarra','No guitar'],
    'mix.cleanGuitar':['Acordes · limpia','Chords · clean'],
    'mix.mutedGuitar':['Acordes · apagada','Chords · muted'],
    'mix.effects':['EFECTOS','EFFECTS'],
    'mix.dry':['Seco · sin efecto','Dry · no effect'],
    'mix.intensity':['Intensidad','Intensity'],
    'mix.note':['La melodía nace del circuito. Las capas base y los efectos son clásicos. El WAV incluye la mezcla y los efectos; el MIDI conserva notas e instrumentos para editar en tu DAW.','The melody comes from the circuit. The foundational layers and effects are classical. The WAV includes the mix and effects; the MIDI preserves notes and instruments for editing in your DAW.'],
    'explain.eyebrow':['DE LA FÍSICA A TU DAW','FROM PHYSICS TO YOUR DAW'],
    'explain.title':['Un circuito.<br>Muchas posibilidades.','One circuit.<br>Many possibilities.'],
    'explain.prepare':['Prepará','Prepare'],
    'explain.prepareBody':['Las rotaciones definen las amplitudes. La fase y las puertas controladas cambian la distribución conjunta.','Rotations define the amplitudes. Phase and controlled gates change the joint distribution.'],
    'explain.measure':['Medí','Measure'],
    'explain.measureBody':['Cada estado de cuatro bits se traduce en altura, silencio y acento. La correlación mostrada es información mutua de mediciones.','Each four-bit state maps to pitch, silence, and accent. The displayed correlation is the mutual information of the measurements.'],
    'explain.produce':['Producí','Produce'],
    'explain.produceBody':['Escuchá una secuencia de esa distribución. Exportá el MIDI y hacela tuya en Ableton, FL Studio o tu DAW favorito.','Listen to a sequence sampled from that distribution. Export the MIDI and make it yours in Ableton, FL Studio, or your favorite DAW.'],
    'technical.summary':['Ver el circuito y el alcance del experimento','View the circuit and the scope of the experiment'],
    'technical.bits':['Orden de bits: q3 q2 q1 q0. q0 y q1 eligen cuatro alturas; q2 decide nota o silencio; q3 cambia registro y acento. Escala: C, Eb, F, G, Bb, C, Eb, F. El beat, la escala y el sintetizador son clásicos. La densidad final también depende de las puertas de enlace.','Bit order: q3 q2 q1 q0. q0 and q1 choose among four pitches; q2 decides between note and silence; q3 changes register and accent. Scale: C, Eb, F, G, Bb, C, Eb, F. The beat, scale, and synthesizer are classical. Final density also depends on the linking gates.'],
    'technical.scope':['La demo usa un simulador clásico de estados cuánticos. La web envía el circuito validado con Qiskit a la API de IonQ y recibe las probabilidades de su simulador cloud. El script Python también permite ejecutarlo mediante el proveedor Qiskit-IonQ. Ambos usan el mismo circuito; no es una ejecución en hardware. El loop se muestrea clásicamente de las probabilidades devueltas por IonQ, o del histograma al importar un archivo. No se utiliza un orden temporal de mediciones. No afirmamos ventaja cuántica ni superioridad musical frente a un generador clásico.','The demo uses a classical quantum-state simulator. The site sends the Qiskit-validated circuit to the IonQ API and receives probabilities from its cloud simulator. The Python script can also run it through the Qiskit-IonQ provider. Both use the same circuit; this is not a hardware execution. The loop is classically sampled from the probabilities returned by IonQ, or from the histogram when a file is imported. No temporal measurement order is used. We make no claim of quantum advantage or musical superiority over a classical generator.'],
    'technical.docs':['Documentación de IonQ ↗','IonQ documentation ↗'],
    'dialog.eyebrow':['CONECTÁ TU PROYECTO DE IONQ','CONNECT YOUR IONQ PROJECT'],
    'dialog.close':['Cerrar','Close'],
    'dialog.title':['De tu key<br>a tu próximo loop.','From your key<br>to your next loop.'],
    'dialog.body':['La key se usa para conectar con IonQ a través del servidor de esta web. Permanece en memoria durante esta sesión; no se guarda en archivos ni en el almacenamiento del navegador.','The key connects to IonQ through this site’s server. It remains in memory during this session and is not saved to files or browser storage.'],
    'dialog.keyLabel':['API key de IonQ','IonQ API key'],
    'dialog.keyPlaceholder':['Pegá tu key acá, sin compartirla en el chat','Paste your key here without sharing it in chat'],
    'dialog.connect':['Conectar con IonQ ↗','Connect to IonQ ↗'],
    'dialog.disconnect':['Desconectar','Disconnect'],
    'dialog.fine':['La ejecución usa el simulador cloud de IonQ. El job ID y la distribución real se mostrarán en el estudio cuando termine.','The run uses IonQ’s cloud simulator. The job ID and actual distribution will appear in the studio when it finishes.'],
    'dialog.advanced':['Recuperar un job / importar un resultado','Recover a job / import a result'],
    'dialog.resumeHelp':['Para retomar un job QuantumDJ ya enviado, conectá la misma key e ingresá su ID.','To resume a previously submitted QuantumDJ job, connect the same key and enter its ID.'],
    'dialog.jobPlaceholder':['UUID del job de QuantumDJ','QuantumDJ job UUID'],
    'dialog.resume':['Consultar job existente','Check existing job'],
    'dialog.config':['↓ Configuración','↓ Configuration'],
    'dialog.import':['↑ Importar JSON','↑ Import JSON'],
    'dynamic.session':['Sesión {number}','Session {number}'],
    'dynamic.barSteps':['16 PASOS','16 STEPS'],
    'dynamic.bar':['COMPÁS {number}','BAR {number}'],
    'dynamic.stepTitle':['Paso {step}: {note}, estado {bits}, velocidad {velocity}','Step {step}: {note}, state {bits}, velocity {velocity}'],
    'source.ionqCloud':['IONQ · SIMULADOR CLOUD','IONQ · CLOUD SIMULATOR'],
    'source.ionqImported':['IONQ · IMPORTADO','IONQ · IMPORTED'],
    'source.qiskitImported':['QISKIT · IMPORTADO','QISKIT · IMPORTED'],
    'source.localPreview':['PREVIA LOCAL · SIN EJECUTAR','LOCAL PREVIEW · NOT RUN'],
    'source.localSimulation':['SIMULACIÓN LOCAL','LOCAL SIMULATION'],
    'provenance.probabilities':['IonQ cloud · Job: {job}. Loop muestreado clásicamente de las probabilidades devueltas por el simulador.','IonQ cloud · Job: {job}. Loop classically sampled from the probabilities returned by the simulator.'],
    'provenance.histogram':['{backend} · {shots} shots{job}. Loop remuestreado del histograma importado.','{backend} · {shots} shots{job}. Loop resampled from the imported histogram.'],
    'provenance.preview':['Vista previa calculada en el navegador. Ejecutá en IonQ para usar su distribución cloud.','Preview calculated in your browser. Run on IonQ to use its cloud distribution.'],
    'circuit.each':['Cada CRY','Each CRY'],
    'circuit.measurement':['Medición de q0, q1, q2, q3 en la base computacional.','Measurement of q0, q1, q2, q3 in the computational basis.'],
    'toast.audioError':['No se pudo iniciar el audio: {error}','Could not start audio: {error}'],
    'toast.tempo':['Elegí un tempo de 60 a 180 BPM.','Choose a tempo from 60 to 180 BPM.'],
    'toast.variation':['Nueva variación generada.','New variation generated.'],
    'toast.midi':['MIDI exportado: melodía y batería.','MIDI exported: melody and drums.'],
    'toast.wav':['WAV exportado.','WAV exported.'],
    'toast.wavError':['No se pudo exportar el WAV: {error}','Could not export the WAV: {error}'],
    'import.size':['El JSON debe pesar menos de 1 MB','The JSON file must be smaller than 1 MB'],
    'import.invalidJson':['El archivo no contiene JSON válido.','The file does not contain valid JSON.'],
    'import.loaded':['Resultado cargado.','Result loaded.'],
    'import.loadedToast':['Resultado cargado: {backend}','Result loaded: {backend}'],
    'import.failed':['No se pudo importar: {error}','Could not import: {error}'],
    'cloud.connectPrompt':['Conectá tu key para ejecutar.','Connect your key to run.'],
    'cloud.localDone':['Circuito simulado localmente.','Circuit simulated locally.'],
    'cloud.submitting':['Enviando el circuito al simulador de IonQ…','Sending the circuit to the IonQ simulator…'],
    'cloud.completed':['IonQ completó el circuito · Job: {job}','IonQ completed the circuit · Job: {job}'],
    'cloud.resultLoaded':['Resultado real de IonQ cargado. Escuchá tu loop.','Actual IonQ result loaded. Listen to your loop.'],
    'cloud.jobStatus':['IonQ: {status} · Job: {job}','IonQ: {status} · Job: {job}'],
    'cloud.statusSubmitted':['en cola','queued'],
    'cloud.statusReady':['listo para ejecutar','ready to run'],
    'cloud.statusStarted':['ejecutando','running'],
    'cloud.pending':['El job sigue pendiente. Usá «Consultar job existente» con el ID {job} para retomarlo.','The job is still pending. Use “Check existing job” with ID {job} to resume it.'],
    'cloud.updateIonq':['Ejecutá para actualizar el resultado en IonQ.','Run to update the result on IonQ.'],
    'cloud.localMode':['Modo de prueba local seleccionado.','Local test mode selected.'],
    'cloud.connected':['IonQ conectado. Ejecutá el circuito cuando quieras.','IonQ connected. Run the circuit whenever you are ready.'],
    'cloud.disconnected':['IonQ desconectado. Los resultados anteriores siguen disponibles.','IonQ disconnected. Previous results remain available.'],
    'cloud.serverKey':['Key del servidor configurada. Ejecutá para conectar con IonQ.','Server key configured. Run to connect to IonQ.'],
    'connection.valid':['Conexión validada. Ejecutá el circuito desde el estudio.','Connection validated. Run the circuit from the studio.'],
    'connection.enter':['Ingresá tu key para conectar.','Enter your key to connect.'],
    'connection.required':['Ingresá tu API key de IonQ.','Enter your IonQ API key.'],
    'connection.validating':['Validando la conexión con IonQ…','Validating the IonQ connection…'],
    'connection.wait':['Esperá a que termine la consulta del job para desconectar.','Wait for the job check to finish before disconnecting.'],
    'connection.jobKey':['Conectá primero la key con acceso a ese job.','First connect the key that has access to that job.'],
    'error.invalidJson':['El servidor no devolvió JSON. Abrí la web publicada para conectar con IonQ.','The server did not return JSON. Open the published site to connect to IonQ.'],
    'error.ionqRequest':['No se pudo completar la solicitud de IonQ.','Could not complete the IonQ request.'],
    'error.invalidParameter':['Parámetro inválido: {parameter}','Invalid parameter: {parameter}'],
    'error.invalidTempo':['Tempo inválido','Invalid tempo'],
    'error.invalidSeed':['Semilla inválida','Invalid seed'],
    'error.invalidLength':['Longitud inválida','Invalid length'],
    'error.invalidFormat':['Formato QuantumDJ inválido','Invalid QuantumDJ format'],
    'error.missingJob':['Falta job ID de IonQ','Missing IonQ job ID'],
    'error.invalidProbabilities':['Probabilidades inválidas','Invalid probabilities'],
    'error.invalidDistribution':['Distribución no normalizada','Distribution is not normalized'],
    'error.missingCounts':['Faltan counts','Missing counts'],
    'error.invalidCounts':['Counts inválidos','Invalid counts'],
    'error.invalidShots':['Shots inconsistentes','Inconsistent shot count'],
    'error.invalidVolume':['Volumen inválido','Invalid volume'],
    'error.invalidSound':['Sonido inválido','Invalid sound'],
    'server.origin':['Origen no permitido.','Origin not allowed.'],
    'server.method':['Método no permitido.','Method not allowed.'],
    'server.requestTooLarge':['Solicitud demasiado grande.','Request is too large.'],
    'server.invalidJson':['JSON inválido.','Invalid JSON.'],
    'server.missing_key':['Ingresá una API key de IonQ.','Enter an IonQ API key.'],
    'server.credentials_rejected':['IonQ rechazó la key. Revisá que esté activa y tenga acceso al proyecto.','IonQ rejected the key. Check that it is active and has access to the project.'],
    'server.rate_limited':['IonQ limitó temporalmente las solicitudes. Esperá un momento e intentá de nuevo.','IonQ temporarily rate-limited requests. Wait a moment and try again.'],
    'server.network_error':['No se pudo completar la conexión con IonQ. Si ya aparece un job ID, retomá ese job.','Could not complete the IonQ connection. If a job ID is already displayed, resume that job.'],
    'server.ionq_error':['IonQ no pudo completar la solicitud. Revisá el proyecto y el estado del servicio.','IonQ could not complete the request. Check the project and service status.'],
    'server.invalid_config':['La configuración del circuito no es válida.','The circuit configuration is invalid.'],
    'server.invalid_job':['El job no es un trabajo válido de QuantumDJ en el simulador de IonQ.','The job is not a valid QuantumDJ run on the IonQ simulator.'],
    'server.job_failed':['El job de IonQ falló.','The IonQ job failed.'],
    'server.job_canceled':['El job de IonQ fue cancelado.','The IonQ job was canceled.'],
    'server.not_found':['IonQ no encontró el recurso solicitado.','IonQ could not find the requested resource.'],
    'server.invalid_result':['IonQ devolvió un resultado inválido.','IonQ returned an invalid result.']
  };

  const index=lang=>lang==='en'?1:0;
  let language='es';

  function interpolate(value,variables={}){
    return value.replace(/\{(\w+)\}/g,(_,key)=>variables[key]===undefined?`{${key}}`:String(variables[key]));
  }

  function t(key,variables={}){
    const pair=messages[key];
    return pair?interpolate(pair[index(language)],variables):key;
  }

  function has(key){return Object.hasOwn(messages,key);}

  function applyStatic(){
    document.querySelectorAll('[data-i18n]').forEach(element=>{element.textContent=t(element.dataset.i18n);});
    document.querySelectorAll('[data-i18n-html]').forEach(element=>{element.innerHTML=t(element.dataset.i18nHtml);});
    for(const [attribute,dataName] of [['aria-label','i18nAria'],['title','i18nTitle'],['placeholder','i18nPlaceholder'],['alt','i18nAlt'],['content','i18nContent']]){
      document.querySelectorAll(`[data-${dataName.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())}]`).forEach(element=>element.setAttribute(attribute,t(element.dataset[dataName])));
    }
    const toggle=document.getElementById('language-toggle');
    if(toggle){
      toggle.setAttribute('aria-label',t('language.switch'));
      toggle.title=t('language.switch');
      toggle.querySelectorAll('[data-language]').forEach(option=>option.classList.toggle('active',option.dataset.language===language));
    }
  }

  function setLanguage(next,{persist=true}={}){
    language=next==='en'?'en':'es';
    document.documentElement.lang=language;
    if(persist){try{localStorage.setItem('quantumdj-language',language);}catch{}}
    applyStatic();
    document.dispatchEvent(new CustomEvent('quantumdj:languagechange',{detail:{language}}));
    return language;
  }

  function init(){
    let preferred;
    try{preferred=localStorage.getItem('quantumdj-language');}catch{}
    if(preferred!=='es'&&preferred!=='en')preferred=(navigator.language||'es').toLowerCase().startsWith('es')?'es':'en';
    return setLanguage(preferred,{persist:false});
  }

  root.QuantumI18n={init,setLanguage,t,has,getLanguage:()=>language};
})(typeof window==='undefined'?globalThis:window);
