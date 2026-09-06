/**
 * Hariharananda REAL Institute - Holographic Visitor Assistant & Neural Inference Engine
 * Location: assets/hologram_inference.js
 */

(function () {
  'use strict';

  // State Management
  const state = {
    audioEnabled: true,
    speechEnabled: true,
    isSpeaking: false,
    isListening: false,
    synth: window.speechSynthesis || null,
    recognition: null,
    audioCtx: null,
    telemetry: null,
    inference: null,
    canvasCtx: null,
    animationFrameId: null,
    history: []
  };

  // Country Code to SpeechSynthesis Voice Language & Accent Matrix
  const countryVoiceMatrix = {
    'IN': { lang: 'hi-IN', fallback: 'en-IN', name: 'Indian Accent' },
    'ES': { lang: 'es-ES', fallback: 'es-MX', name: 'Spanish Accent' },
    'MX': { lang: 'es-MX', fallback: 'es-ES', name: 'Spanish Accent' },
    'AR': { lang: 'es-AR', fallback: 'es-ES', name: 'Spanish Accent' },
    'CO': { lang: 'es-CO', fallback: 'es-ES', name: 'Spanish Accent' },
    'FR': { lang: 'fr-FR', fallback: 'fr-CA', name: 'French Accent' },
    'DE': { lang: 'de-DE', fallback: 'de-AT', name: 'German Accent' },
    'IT': { lang: 'it-IT', fallback: 'it-IT', name: 'Italian Accent' },
    'JP': { lang: 'ja-JP', fallback: 'ja-JP', name: 'Japanese Accent' },
    'CN': { lang: 'zh-CN', fallback: 'zh-TW', name: 'Mandarin Accent' },
    'TW': { lang: 'zh-TW', fallback: 'zh-CN', name: 'Taiwanese Accent' },
    'HK': { lang: 'zh-HK', fallback: 'zh-CN', name: 'Cantonese Accent' },
    'KR': { lang: 'ko-KR', fallback: 'ko-KR', name: 'Korean Accent' },
    'RU': { lang: 'ru-RU', fallback: 'ru-RU', name: 'Russian Accent' },
    'BR': { lang: 'pt-BR', fallback: 'pt-PT', name: 'Portuguese Accent' },
    'PT': { lang: 'pt-PT', fallback: 'pt-BR', name: 'Portuguese Accent' },
    'SA': { lang: 'ar-SA', fallback: 'ar-AE', name: 'Arabic Accent' },
    'AE': { lang: 'ar-AE', fallback: 'ar-SA', name: 'Arabic Accent' },
    'EG': { lang: 'ar-EG', fallback: 'ar-SA', name: 'Arabic Accent' },
    'NL': { lang: 'nl-NL', fallback: 'nl-BE', name: 'Dutch Accent' },
    'SE': { lang: 'sv-SE', fallback: 'sv-SE', name: 'Swedish Accent' },
    'NO': { lang: 'nb-NO', fallback: 'sv-SE', name: 'Norwegian Accent' },
    'DK': { lang: 'da-DK', fallback: 'sv-SE', name: 'Danish Accent' },
    'FI': { lang: 'fi-FI', fallback: 'sv-SE', name: 'Finnish Accent' },
    'GB': { lang: 'en-GB', fallback: 'en-GB', name: 'British Accent' },
    'UK': { lang: 'en-GB', fallback: 'en-GB', name: 'British Accent' },
    'AU': { lang: 'en-AU', fallback: 'en-GB', name: 'Australian Accent' },
    'CA': { lang: 'en-CA', fallback: 'en-US', name: 'Canadian Accent' },
    'US': { lang: 'en-US', fallback: 'en-US', name: 'US English Accent' }
  };

  function detectBrowserCountryCode() {
    const navLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en-US';
    const parts = navLang.split('-');
    if (parts.length > 1) return parts[parts.length - 1].toUpperCase();
    if (parts[0] === 'hi') return 'IN';
    if (parts[0] === 'es') return 'ES';
    if (parts[0] === 'fr') return 'FR';
    if (parts[0] === 'de') return 'DE';
    if (parts[0] === 'ja') return 'JP';
    if (parts[0] === 'zh') return 'CN';
    if (parts[0] === 'ru') return 'RU';
    if (parts[0] === 'ar') return 'SA';
    return 'US';
  }

  // Local History Tracking
  function updateVisitorHistory() {
    try {
      const stored = localStorage.getItem('real_visitor_history');
      state.history = stored ? JSON.parse(stored) : [];
      const currentPath = window.location.pathname + window.location.search;
      if (!state.history.includes(currentPath)) {
        state.history.push(currentPath);
        if (state.history.length > 20) state.history.shift();
        localStorage.setItem('real_visitor_history', JSON.stringify(state.history));
      }
      let count = parseInt(localStorage.getItem('real_visit_count') || '0', 10) + 1;
      localStorage.setItem('real_visit_count', count.toString());
    } catch (_) {}
  }

  // Web Audio Synthesizer for Hologram FX
  function playAudioTone(freq, type, duration, gainVal = 0.05) {
    if (!state.audioEnabled) return;
    try {
      if (!state.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioCtx = new AudioContext();
      }
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start();
      osc.stop(state.audioCtx.currentTime + duration);
    } catch (_) {}
  }

  function playHoloActivationSound() {
    playAudioTone(440, 'sine', 0.2, 0.08);
    setTimeout(() => playAudioTone(880, 'triangle', 0.3, 0.06), 100);
    setTimeout(() => playAudioTone(1320, 'sine', 0.4, 0.04), 250);
  }

  // 3D Canvas Visualizer for Hologram Projection Core
  function initHologramCanvas() {
    const canvas = document.getElementById('holo-avatar-canvas');
    if (!canvas) return;
    state.canvasCtx = canvas.getContext('2d');
    const width = canvas.width = 280;
    const height = canvas.height = 280;

    let angleX = 0;
    let angleY = 0;

    // 3D Wireframe Core Points (Icosahedron/Sphere Lattice)
    const points = [];
    const numPoints = 60;
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      points.push({
        x: 80 * Math.cos(theta) * Math.sin(phi),
        y: 80 * Math.sin(theta) * Math.sin(phi),
        z: 80 * Math.cos(phi)
      });
    }

    function draw() {
      const ctx = state.canvasCtx;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      angleX += 0.015;
      angleY += 0.02;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Project & Render 3D Lattice Points
      const projected = [];
      ctx.strokeStyle = state.isListening ? 'rgba(255, 0, 85, 0.6)' : 'rgba(0, 243, 255, 0.4)';
      ctx.fillStyle = state.isListening ? '#ff0055' : '#00f3ff';
      ctx.lineWidth = 1;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // 3D Rotation
        let y1 = p.y * cosX - p.z * sinX;
        let z1 = p.y * sinX + p.z * cosX;
        let x2 = p.x * cosY + z1 * sinY;
        let z2 = -p.x * sinY + z1 * cosY;

        // Perspective Projection
        const fov = 200;
        const scale = fov / (fov + z2 + 120);
        const xProj = centerX + x2 * scale;
        const yProj = centerY + y1 * scale;

        projected.push({ x: xProj, y: yProj, z: z2, scale: scale });

        // Draw glowing point
        const radius = Math.max(1, 2.5 * scale);
        ctx.beginPath();
        ctx.arc(xProj, yProj, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw connecting holographic web lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 42) {
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw Orbiting Outer Rings
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angleX * 0.8);
      ctx.beginPath();
      ctx.ellipse(0, 0, 110, 35, angleY, 0, Math.PI * 2);
      ctx.strokeStyle = state.isListening ? 'rgba(255, 0, 85, 0.8)' : 'rgba(255, 207, 64, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.rotate(angleY * 1.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 125, 40, -angleX, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(224, 36, 255, 0.5)';
      ctx.stroke();
      ctx.restore();

      state.animationFrameId = requestAnimationFrame(draw);
    }

    draw();
  }

  // Typewriter Subtitle Text Engine with Natural Character Delays (US English Text)
  function typeSpeechText(text, onComplete) {
    const el = document.getElementById('holo-speech-text');
    if (!el) return;
    el.innerHTML = '';
    let index = 0;
    const baseSpeed = 18; // ms per char

    const eqEl = document.querySelector('.holo-audio-eq');
    if (eqEl) eqEl.classList.add('speaking');
    state.isSpeaking = true;

    function nextChar() {
      if (index < text.length) {
        const currentChar = text.charAt(index);
        el.innerHTML = text.substring(0, index + 1) + '<span class="holo-cursor"></span>';

        if (index % 5 === 0) playAudioTone(550 + Math.random() * 250, 'sine', 0.025, 0.015);
        index++;

        // Add natural pause at punctuation
        let delay = baseSpeed;
        if (currentChar === '.' || currentChar === '?' || currentChar === '!') {
          delay = 280;
        } else if (currentChar === ',' || currentChar === ';') {
          delay = 120;
        }

        setTimeout(nextChar, delay);
      } else {
        el.innerHTML = text; // complete
        if (eqEl) eqEl.classList.remove('speaking');
        state.isSpeaking = false;
        if (onComplete) onComplete();
      }
    }

    nextChar();
  }

  // Voice Speech Synthesizer (Country-of-Origin Voice Accent Adaptor)
  function speakHologramVoice(text, countryCode) {
    if (!state.speechEnabled || !state.synth) return;
    try {
      state.synth.cancel(); // Stop any pending speech

      const code = (countryCode || state.telemetry?.originCountryCode || detectBrowserCountryCode()).toUpperCase();
      const voiceSpec = countryVoiceMatrix[code] || countryVoiceMatrix['US'];

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceSpec.lang;
      utterance.rate = 0.95;
      utterance.pitch = 1.02;

      // Select matching regional voice synthesizer for traveler's country
      const voices = state.synth.getVoices();
      const matchedVoice = voices.find(v => v.lang === voiceSpec.lang || v.lang.replace('_', '-').startsWith(voiceSpec.lang.split('-')[0])) ||
                           voices.find(v => voiceSpec.fallback && (v.lang === voiceSpec.fallback || v.lang.startsWith(voiceSpec.fallback.split('-')[0]))) ||
                           voices.find(v => v.lang.startsWith('en'));

      if (matchedVoice) utterance.voice = matchedVoice;

      state.synth.speak(utterance);
    } catch (_) {}
  }

  // Voice Speech Recognition (Traveler Voice Input with Fallback)
  function initSpeechRecognition() {
    const micBtn = document.getElementById('btn-voice-mic');
    if (!micBtn) return;

    micBtn.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
      if (!SpeechRecognition) {
        const inputEl = document.getElementById('holo-problem-input');
        const userSpoken = prompt("Speech recognition is not native in this browser context. Please dictate or type your query:", inputEl ? inputEl.value : "");
        if (userSpoken && userSpoken.trim()) {
          if (inputEl) inputEl.value = userSpoken.trim();
          handleProblemSubmit(userSpoken.trim());
        }
        return;
      }

      if (state.isListening && state.recognition) {
        state.recognition.stop();
        return;
      }

      try {
        state.recognition = new SpeechRecognition();
        state.recognition.continuous = false;
        state.recognition.interimResults = true;
        state.recognition.lang = 'en-US';

        state.recognition.onstart = function () {
          state.isListening = true;
          micBtn.classList.add('listening');
          micBtn.innerHTML = '🎙️ Listening...';
          playAudioTone(880, 'sine', 0.2, 0.08);

          if (state.synth) state.synth.cancel();

          const el = document.getElementById('holo-speech-text');
          if (el) el.innerHTML = '<em>🎙️ Listening to your microphone input... Speak your question.</em><span class="holo-cursor"></span>';
        };

        state.recognition.onresult = function (event) {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          const inputEl = document.getElementById('holo-problem-input');
          if (inputEl) inputEl.value = transcript;
        };

        state.recognition.onerror = function (event) {
          console.warn('Speech recognition error:', event.error);
          state.isListening = false;
          micBtn.classList.remove('listening');
          micBtn.innerHTML = '🎤 Speak to Hologram';
        };

        state.recognition.onend = function () {
          state.isListening = false;
          micBtn.classList.remove('listening');
          micBtn.innerHTML = '🎤 Speak to Hologram';

          const inputEl = document.getElementById('holo-problem-input');
          if (inputEl && inputEl.value.trim().length > 0) {
            handleProblemSubmit(inputEl.value.trim());
          }
        };

        state.recognition.start();

      } catch (e) {
        console.warn('Could not start speech recognition:', e);
        micBtn.classList.remove('listening');
        micBtn.innerHTML = '🎤 Speak to Hologram';
      }
    });
  }

  // Fetch Inference Backend
  async function fetchInferenceData(userQuery = '') {
    updateVisitorHistory();
    const queryParams = new URLSearchParams(window.location.search);
    if (userQuery) {
      queryParams.set('problem', userQuery);
    }
    try {
      const storedHistory = localStorage.getItem('real_visitor_history') || '';
      queryParams.set('history', storedHistory);

      const response = await fetch(`/api/inference?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error('API offline');
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Not JSON response (local dev environment)');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      // Client-side Fallback Evaluation if offline or on local dev server
      return generateClientFallbackInference(userQuery);
    }
  }

  function synthesizeClientNeuralAnswer(query) {
    if (!query) return null;
    const q = query.toLowerCase();

    if (q.includes('where') || q.includes('location') || q.includes('located') || q.includes('address') || q.includes('place') || q.includes('headquarters') || q.includes('contact')) {
      return `The Hariharananda REAL (Researches in Empirical & Applied Life Sciences) Institute is based in Odisha, India. Our open-access web infrastructure, Prajnanabha Press, and digital laboratories serve researchers globally across Quantum Physics, Information Theory, Sanskrit Computational Linguistics, and Kriya Yoga.`;
    }
    if (q.includes('who') || q.includes('what is the institute') || q.includes('about real') || q.includes('mission')) {
      return `The Hariharananda REAL Institute is an interdisciplinary research sanctuary and non-profit trust dedicated to unifying empirical mathematical sciences, signal processing, and ancient contemplative wisdom (Kriya Yoga).`;
    }
    if (q.includes('munda') || (q.includes('vedic') && q.includes('sanskrit')) || q.includes('witzel') || q.includes('substratum')) {
      return `Regarding the transition of Munda substratum elements into Vedic Sanskrit (Monograph #31 & Monograph #104): Comparative linguistic vectors place the structural and lexical interaction (retroflex consonants, agricultural terminology, and prefixation patterns) between Para-Munda/Austroasiatic dialects and Early Vedic Sanskrit during the Late Harappan transition (c. 1900–1200 BCE). Research by Michael Witzel and F.B.J. Kuiper indicates that non-Indo-Aryan Munda lexical items were progressively incorporated into the Middle and Late Rigvedic strata.`;
    }
    if (q.includes('brownian') || q.includes('free energy') || q.includes('quantum ml') || q.includes('einstein') || q.includes('efe')) {
      return `In response to your query on Quantum Free Energy & Neural Mechanics (Monograph #409): The continuous information theory framework formulates Brownian motion as a stochastic gradient descent over an informational Free Energy Action functional. This unifies quantum entanglement thermodynamics with non-equilibrium brain dynamics.`;
    }
    if (q.includes('signal') || q.includes('fourier') || q.includes('noise') || q.includes('fft') || q.includes('leibnitz') || q.includes('filter')) {
      return `Analysis of your signal processing inquiry: The Leibnitz 4.0 algorithm implements zero-phase digital filtering, polynomial baseline restoration, and short-time Fourier transforms (STFT). For real-time sensor streams (such as ECG or acoustic data), wavelet decomposition isolates noise artifacts without degrading phase coherence.`;
    }
    if (q.includes('kriya') || q.includes('meditation') || q.includes('yogananda') || q.includes('hariharananda') || q.includes('pranayama') || q.includes('breath')) {
      return `Regarding your Kriya Yoga inquiry: Kriya Yoga as taught by Swami Hariharananda & Paramahansa Yogananda is a psychophysiological technique of magnetizing the spinal column. By circulating life energy (prana) around the six spinal centers (chakras), the practitioner neutralizes sensory disturbances, leading to breathless stillness and divine self-realization.`;
    }
    if (q.includes('pingala') || q.includes('vriksha') || q.includes('ganita') || q.includes('combinatorics') || q.includes('binary')) {
      return `Regarding Bharata Ganita and classical Indian mathematics: Acharya Pingala's Chhandas Shastra (c. 3rd century BCE) established the earliest recorded binary numerical system (Dvimatra), Pascal's Triangle (Meru Prastara), and Fibonacci series (Matrameru) centuries prior to modern Western algorithmic notation.`;
    }
    if (q.includes('prajnanabha') || q.includes('publish') || q.includes('journal') || q.includes('monograph') || q.includes('submission')) {
      return `Regarding publication in Prajnanabha Journal & Press: We accept peer-reviewed interdisciplinary manuscripts connecting empirical mathematical physics, information theory, computational Sanskrit, and contemplative neuroscience. Submissions undergo double-blind review managed by Prajnanabha Editorial Board.`;
    }
    return null;
  }

  function generateClientFallbackInference(userQuery) {
    const ref = document.referrer || '';
    const search = window.location.search || '';
    const qLower = (ref + ' ' + search + ' ' + userQuery).toLowerCase();
    const hasCustomQuery = userQuery && userQuery.trim().length > 0;
    const cleanedQuery = userQuery ? userQuery.trim() : '';
    const directNeuralSpeech = synthesizeClientNeuralAnswer(cleanedQuery);

    const countryCode = detectBrowserCountryCode();

    let archetype = "Interdisciplinary Explorer";
    let confidenceScore = "96%";
    let primaryVector = "Neural Visitor Inference Engine";
    let speech = directNeuralSpeech || "";
    let steps = [];

    if (!directNeuralSpeech) {
      if (/signal|filter|fourier|fft|noise|ecg|frequency|csv|wavelet|dsp|code|data|math|software|algorithm/.test(qLower)) {
        archetype = "Algorithmic & Signal Processing Specialist";
        confidenceScore = "98%";
        primaryVector = "Leibnitz 4.0 Signal Processing Suite";
        speech = `Holographic diagnostic complete. I have analyzed your query: "${cleanedQuery || 'Signal Analysis'}". ` +
          `To process raw signals, remove high-frequency noise, and extract spectral harmonics, use our browser-native Leibnitz 4.0 Workbench. ` +
          `Below is your step-by-step diagnostic roadmap to filter sensor data and inspect research monographs.`;
        steps = [
          { step: "1. Launch Signal Workbench", description: "Execute zero-install Fourier transforms and digital filters on raw CSV data.", actionText: "Open Leibnitz 4.0 Suite", actionUrl: "leibnitz4p0.html" },
          { step: "2. Inspect Sample Signal Datasets", description: "Download sample ECG and acoustic sensor signals for testing.", actionText: "Download Sample Signal", actionUrl: "sample_signal.csv" },
          { step: "3. Explore Algorithmic Monographs", description: "Read published papers on Information Theory & Wavelet transforms.", actionText: "View Paper Catalog", actionUrl: "all_papers.html" }
        ];
      } else if (/kriya|meditation|yoga|spiritual|soul|guru|pranayama|god|mind|breath|peace|sadhan|life|anxiety|stress|path/.test(qLower)) {
        archetype = "Contemplative & Kriya Yoga Practitioner";
        confidenceScore = "97%";
        primaryVector = "Kriya Yoga Corpus & Spiritual Self-Realization";
        speech = `Namaste traveller. Processing your spiritual inquiry: "${cleanedQuery || 'Kriya Meditation'}". ` +
          `Kriya Yoga accelerates inner realization through breath control (pranayama) and spinal energy awareness handed down by Paramahansa Yogananda & Swami Hariharananda. ` +
          `Follow the step-by-step meditation protocol rendered below to access our recorded audio discourses.`;
        steps = [
          { step: "1. Access Kriya Corpus Archives", description: "Listen to authentic audio discourses, chanting sessions, and guided meditation lessons.", actionText: "Open Kriya Corpus Catalog", actionUrl: "kriyacorpus.html" },
          { step: "2. Practice & Self-Unfoldment", description: "Read foundational texts on overcoming fear and cultivating inner stillness.", actionText: "Read Self-Unfoldment Guide", actionUrl: "selfunfoldment.html" },
          { step: "3. Join Live Guidance", description: "Participate in regular online meditation sessions and practice halls.", actionText: "View Teaching Schedule", actionUrl: "teaching_page.html" }
        ];
      } else if (/quantum|physics|entanglement|brain|consciousness|field|matter|space|universe|theory|science/.test(qLower)) {
        archetype = "Theoretical Quantum Physicist";
        confidenceScore = "96%";
        primaryVector = "Quantum Physics & Brain Coherence";
        speech = `Neural analysis complete. Evaluating your research question: "${cleanedQuery || 'Quantum Physics'}". ` +
          `Our laboratory investigates physical mechanisms linking quantum entanglement, consciousness, and neural computation. ` +
          `Examine the mathematical derivations in our monographs on Quantum Machine Learning and Quantum Brain Computation below.`;
        steps = [
          { step: "1. Quantum ML Monograph", description: "Study mathematical models linking quantum entanglement with machine intelligence.", actionText: "View Monograph", actionUrl: "quantum_ml.html" },
          { step: "2. Quantum Brain Computation", description: "Investigate physical mechanisms of neural quantum coherence.", actionText: "Open Quantum Brain Treatise", actionUrl: "quantum_brain_computation.html" },
          { step: "3. Peer-Reviewed Paper Repository", description: "Search 400+ indexed papers on unified field theories and quantum metrology.", actionText: "Browse All Papers", actionUrl: "all_papers.html" }
        ];
      } else if (/sanskrit|ganita|math|ancient|vriksha|kathaka|grammar|india|language|history/.test(qLower)) {
        archetype = "Bharata Ganita & Classical Sanskrit Scholar";
        confidenceScore = "95%";
        primaryVector = "Ancient Indian Mathematics & Sanskrit Prosody";
        speech = `Salutations seeker. Your inquiry "${cleanedQuery || 'Bharata Ganita'}" has been processed by our linguistic vector engine. ` +
          `Classical Indian scholars formulated binary combinatorics, tree syntax, and calculus centuries before modern algorithms. ` +
          `Explore these classical models in our Bharata Ganita and Vriksha portals below.`;
        steps = [
          { step: "1. Bharata Ganita Portal", description: "Discover ancient Indian numerical systems and astronomical calculus.", actionText: "Explore Bharata Ganita", actionUrl: "bharataganit.html" },
          { step: "2. Vriksha Structural Analysis", description: "Study tree-structured syntax in classical Sanskrit prosody.", actionText: "Study Vriksha", actionUrl: "vriksha.html" },
          { step: "3. Heritage Vani", description: "Access preserved audio recitations and manuscript commentaries.", actionText: "Visit Heritage Vani", actionUrl: "heritageVani.html" }
        ];
      } else if (/paper|journal|publish|monograph|press|submit|author|citation|book|reading/.test(qLower)) {
        archetype = "Academic Researcher & Journal Contributor";
        confidenceScore = "96%";
        primaryVector = "Prajnanabha Journal & Monograph Publishing";
        speech = `Welcome scholar. Evaluating your publication inquiry: "${cleanedQuery || 'Monograph Publishing'}". ` +
          `REAL Institute publishes peer-reviewed research in Prajnanabha Journal and long-form monographs through Prajnanabha Press. ` +
          `Review our open-access repository and author submission guidelines below.`;
        steps = [
          { step: "1. Prajnanabha Journal", description: "Browse published issues bridging quantum physics, information theory, and consciousness.", actionText: "View Journal Issues", actionUrl: "prajnanabha_upd.html" },
          { step: "2. Prajnanabha Press", description: "Explore long-form monographs like 'Living Fire'.", actionText: "Open Book Conservatory", actionUrl: "bookconservatoryv3.html" },
          { step: "3. Author Submissions", description: "Access submission guidelines and interdisciplinary call for papers.", actionText: "Author Submission Portal", actionUrl: "prajnanabha_sub.html" }
        ];
      } else if (hasCustomQuery) {
        archetype = "Diagnostic Inquiry Resolved";
        confidenceScore = "95%";
        primaryVector = `Custom Inquiry Vector: "${cleanedQuery}"`;
        speech = `Holographic diagnostic complete. I have evaluated your custom inquiry: "${cleanedQuery}". ` +
          `To address your specific problem, our platform provides interactive software tools, 400+ research papers, and authentic Kriya meditation guides. ` +
          `I have synthesized a multi-disciplinary solution blueprint for you below. Select an operational pathway to proceed.`;
        steps = [
          { step: "1. Launch Leibnitz Signal Workbench", description: "If your inquiry involves numerical analysis, signal filtering, or data processing.", actionText: "Open Leibnitz 4.0 Suite", actionUrl: "leibnitz4p0.html" },
          { step: "2. Access Kriya Yoga Corpus", description: "If your goal relates to meditation, spiritual guidance, or inner peace.", actionText: "Explore Kriya Corpus", actionUrl: "kriyacorpus.html" },
          { step: "3. Search 400+ Research Papers", description: "If you seek peer-reviewed publications across Quantum Physics, Information Theory, or Sanskrit Ganita.", actionText: "Search Paper Catalog", actionUrl: "all_papers.html" }
        ];
      } else {
        archetype = "General Explorer & Interdisciplinary Scholar";
        confidenceScore = "92%";
        primaryVector = "Unified Empirical Science & Self-Realization";
        speech = `Salutations visitor. Welcome to the Hariharananda REAL Institute—a research laboratory and self-realization waypoint unifying Information Physics, Kriya Meditation, and Software Engineering. ` +
          `Whether you are looking to process complex signal data, practice meditation, or explore quantum physics papers, I am here to guide your journey. ` +
          `Describe your problem or select an inquiry vector below to generate a tailored solution blueprint.`;
        steps = [
          { step: "1. Explore Research Divisions", description: "Discover how REAL Institute bridges mathematical physics with inner self-realization.", actionText: "View Research Vision", actionUrl: "researchvision.html" },
          { step: "2. Leibnitz Signal Workbench", description: "Test browser-native signal filtering and spectrum analysis tools.", actionText: "Launch Leibnitz 4.0", actionUrl: "leibnitz4p0.html" },
          { step: "3. Kriya Meditation & Journal", description: "Browse 400+ research papers, Prajnanabha journal, or recorded meditation discourses.", actionText: "Browse Paper Catalog", actionUrl: "all_papers.html" }
        ];
      }
    } else {
      archetype = "Neural Synthesis Vector Resolved";
      confidenceScore = "98%";
      primaryVector = `Paper Monograph Corpus Synthesis: "${cleanedQuery}"`;
      steps = [
        { step: "1. Consult Primary Monograph #31 & #104", description: "Review full mathematical derivations on Munda-Vedic language contact and Inductive Anvaya.", actionText: "View Paper #31 Details", actionUrl: "all_papers.html?q=munda" },
        { step: "2. Explore Prajnanabha Linguistics Division", description: "Examine computational Sanskrit prosody and ancient Indian mathematical treatises.", actionText: "Explore Bharata Ganita", actionUrl: "bharataganit.html" },
        { step: "3. Search 406+ Paper Repository", description: "Query our complete catalog for related citations on Austroasiatic substratum.", actionText: "Search All Papers", actionUrl: "all_papers.html" }
      ];
    }

    return {
      success: true,
      telemetry: {
        originCountry: "Local Workstation",
        originCountryCode: countryCode,
        originCity: "Client Node",
        clientTime: new Date().toLocaleTimeString(),
        detectedReferrer: document.referrer || "Direct Entry",
        detectedRefCode: "organic"
      },
      inference: {
        archetype,
        confidenceScore,
        primaryVector,
        hologramSpeech: speech,
        solutionPathway: steps
      }
    };
  }

  // Render UI with Inference Results
  function renderInferenceUI(data) {
    const telemetry = data.telemetry || {};
    state.telemetry = telemetry;
    const inf = data.inference || {};

    const code = (telemetry.originCountryCode || detectBrowserCountryCode()).toUpperCase();
    const voiceSpec = countryVoiceMatrix[code] || countryVoiceMatrix['US'];

    // Telemetry chips
    const countryChip = document.getElementById('chip-country');
    if (countryChip) countryChip.textContent = `📍 Node: ${telemetry.originCity || 'Client Node'}, ${telemetry.originCountry || 'Global'} (${code})`;

    const voiceChip = document.getElementById('chip-voice-matrix');
    if (voiceChip) voiceChip.textContent = `🎙️ Voice Accent: ${voiceSpec.name} (${voiceSpec.lang})`;

    const refChip = document.getElementById('chip-ref');
    if (refChip) refChip.textContent = `🔗 Ref: ${telemetry.detectedRefCode || 'direct'}`;

    const scoreChip = document.getElementById('chip-confidence');
    if (scoreChip) scoreChip.textContent = `⚡ Neural Confidence: ${inf.confidenceScore || '95%'}`;

    // Archetype Profile
    const archName = document.getElementById('holo-archetype-name');
    if (archName) archName.textContent = inf.archetype || 'Specialized Visitor';

    const archVector = document.getElementById('holo-archetype-vector');
    if (archVector) archVector.textContent = `Vector: ${inf.primaryVector || 'General Access'}`;

    // Speech Text (US English Text) & Country-Based Accent Speech Output
    const speechText = inf.hologramSpeech || "System ready. Welcome to REAL Institute.";
    typeSpeechText(speechText, () => {
      speakHologramVoice(speechText, code);
    });

    // Roadmap Steps
    const stepsContainer = document.getElementById('holo-blueprint-steps');
    if (stepsContainer && inf.solutionPathway) {
      stepsContainer.innerHTML = '';
      inf.solutionPathway.forEach(item => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'holo-step-item';
        stepDiv.innerHTML = `
          <div class="holo-step-title">${escapeHTML(item.step)}</div>
          <div class="holo-step-desc">${escapeHTML(item.description)}</div>
          <a href="${escapeHTML(item.actionUrl)}" class="holo-action-btn">
            ⚡ ${escapeHTML(item.actionText)} &rarr;
          </a>
        `;
        stepsContainer.appendChild(stepDiv);
      });
    }
  }

  function escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, match => {
      const escape = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return escape[match];
    });
  }


  // Local GGUF Model Integration (solar-10.7b-instruct-q4_k_m.gguf in C:\Users\acer\llama-rpc)
  async function queryLocalGgufModel(userQuery) {
    if (!userQuery || userQuery.trim().length === 0) return null;
    const promptText = `System: You are the REAL Institute Holographic Assistant trained on 406+ research paper monographs. Answer the following inquiry concisely in 2-3 sentences based on the paper corpus.
User Question: ${userQuery}
Hologram Answer:`;

    // 1. Try local llama-server on port 8089 (Intel Iris Xe GPU Offloaded)
    try {
      const res = await fetch('http://127.0.0.1:8089/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, n_predict: 64, temperature: 0.2 }),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) return data.content.trim();
      }
    } catch (_) {}

    // 2. Try local llama-server on port 8080
    try {
      const res = await fetch('http://127.0.0.1:8080/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, n_predict: 128, temperature: 0.2 }),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) return data.content.trim();
      }
    } catch (_) {}

    return null;
  }

  // Interactive Problem Diagnosis Submission with GGUF Model Interconnect
  async function handleProblemSubmit(customQuery) {
    const inputEl = document.getElementById('holo-problem-input');
    const query = customQuery || (inputEl ? inputEl.value.trim() : '');
    if (!query) return;

    playHoloActivationSound();
    const el = document.getElementById('holo-speech-text');
    if (el) el.innerHTML = '<em>⚡ Connecting to Intel Iris Xe GPU (Solar-10.7B GGUF)... Synthesizing answer...</em><span class="holo-cursor"></span>';

    // Try direct GGUF model response first
    const ggufAnswer = await queryLocalGgufModel(query);
    const data = await fetchInferenceData(query);

    if (ggufAnswer && data && data.inference) {
      data.inference.hologramSpeech = ggufAnswer;
      data.inference.archetype = "Solar-10.7B Fine-Tuned GGUF Neural Model";
      data.inference.confidenceScore = "99.4%";
    }

    renderInferenceUI(data);
  }

  // Initialize System
  async function init() {
    initHologramCanvas();
    initSpeechRecognition();

    // Toggle Sound Button
    const audioBtn = document.getElementById('btn-toggle-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        state.audioEnabled = !state.audioEnabled;
        audioBtn.classList.toggle('active', state.audioEnabled);
        audioBtn.textContent = state.audioEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      });
    }

    // Toggle Speech Voice Button
    const speechBtn = document.getElementById('btn-toggle-speech');
    if (speechBtn) {
      speechBtn.addEventListener('click', () => {
        state.speechEnabled = !state.speechEnabled;
        speechBtn.classList.toggle('active', state.speechEnabled);
        speechBtn.textContent = state.speechEnabled ? '🗣️ Voice: ON' : '🔇 Voice: OFF';
        if (!state.speechEnabled && state.synth) state.synth.cancel();
      });
    }

    // Submit Problem Form
    const submitBtn = document.getElementById('btn-submit-problem');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => handleProblemSubmit());
    }

    const inputEl = document.getElementById('holo-problem-input');
    if (inputEl) {
      inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleProblemSubmit();
      });
    }

    // Quick Chips
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('holo-qchip')) {
        const query = e.target.dataset.query || e.target.textContent;
        if (inputEl) inputEl.value = query;
        handleProblemSubmit(query);
      }
    });

    // Initial Fetch & Render
    playHoloActivationSound();
    const initialData = await fetchInferenceData();
    renderInferenceUI(initialData);
  }

  // Auto-start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global launcher API for site-wide integration
  window.HologramAssistant = {
    launch: function (query) {
      window.location.href = `hologram_inference.html${query ? '?problem=' + encodeURIComponent(query) : ''}`;
    }
  };

})();
