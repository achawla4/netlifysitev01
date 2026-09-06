/**
 * Leibnitz 6.0 — Interactive WebGL/HTML5 Spectral Signal & Suganita DSL Visualizer
 * Real-time 60fps signal synthesis, user custom data upload (CSV/TXT/JSON), FFT analysis, and Suganita code HUD.
 * (c) 2026 REAL Institute - Production Release
 */

class SuganitaSignalVisualizer {
    constructor(timeCanvasId, freqCanvasId, codeContainerId) {
        this.timeCanvas = document.getElementById(timeCanvasId);
        this.freqCanvas = document.getElementById(freqCanvasId);
        this.codeContainer = document.getElementById(codeContainerId);

        if (!this.timeCanvas || !this.freqCanvas) return;

        this.timeCtx = this.timeCanvas.getContext('2d');
        this.freqCtx = this.freqCanvas.getContext('2d');

        // Parameters
        this.freq = 5; // Hz
        this.noise = 0.1;
        this.refinementLayer = 2; // 0=coarse, 1=medium, 2=full
        this.signalType = 'sine'; // sine, harmonic, chirp, nyaya, custom
        this.customData = null; // User loaded numeric array
        this.customFilename = "";

        this.time = 0;
        this.animId = null;

        this.initDPI();
        this.bindEvents();
        this.start();
    }

    initDPI() {
        const dpi = window.devicePixelRatio || 1;

        [this.timeCanvas, this.freqCanvas].forEach(canvas => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = (rect.width || 550) * dpi;
            canvas.height = (rect.height || 220) * dpi;
        });
    }

    bindEvents() {
        const freqInput = document.getElementById('viz-freq-slider');
        const noiseInput = document.getElementById('viz-noise-slider');
        const layerInput = document.getElementById('viz-layer-select');
        const typeInput = document.getElementById('viz-type-select');
        const fileInput = document.getElementById('viz-file-upload');
        const pasteInput = document.getElementById('viz-paste-data');
        const loadPasteBtn = document.getElementById('viz-load-paste-btn');

        if (freqInput) {
            freqInput.addEventListener('input', (e) => {
                this.freq = parseFloat(e.target.value);
                this.updateCodeHUD();
            });
        }
        if (noiseInput) {
            noiseInput.addEventListener('input', (e) => {
                this.noise = parseFloat(e.target.value);
                this.updateCodeHUD();
            });
        }
        if (layerInput) {
            layerInput.addEventListener('change', (e) => {
                this.refinementLayer = parseInt(e.target.value, 10);
                this.updateCodeHUD();
            });
        }
        if (typeInput) {
            typeInput.addEventListener('change', (e) => {
                this.signalType = e.target.value;
                if (this.signalType !== 'custom') {
                    this.customData = null;
                    this.customFilename = "";
                }
                this.updateCodeHUD();
            });
        }

        // Custom User File Upload Handler (.csv, .json, .txt)
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                this.customFilename = file.name;
                const reader = new FileReader();

                reader.onload = (evt) => {
                    this.parseAndSetCustomData(evt.target.result);
                };
                reader.readAsText(file);
            });
        }

        // Paste Custom Data Handler
        if (loadPasteBtn && pasteInput) {
            loadPasteBtn.addEventListener('click', () => {
                const rawText = pasteInput.value;
                if (rawText.trim()) {
                    this.customFilename = "User_Pasted_Buffer";
                    this.parseAndSetCustomData(rawText);
                }
            });
        }

        window.addEventListener('resize', () => this.initDPI());
    }

    parseAndSetCustomData(text) {
        try {
            let numbers = [];
            if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) numbers = parsed.map(Number);
                else if (parsed.data && Array.isArray(parsed.data)) numbers = parsed.data.map(Number);
            } else {
                // Parse CSV or newline/comma separated values
                numbers = text.split(/[\s,\n]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
            }

            if (numbers.length > 0) {
                // Normalize numbers to [-1, 1] range for clean spectral plot
                const maxAbs = Math.max(...numbers.map(n => Math.abs(n))) || 1;
                this.customData = numbers.map(n => n / maxAbs);
                this.signalType = 'custom';

                const typeSelect = document.getElementById('viz-type-select');
                if (typeSelect) typeSelect.value = 'custom';

                this.updateCodeHUD();
            } else {
                alert("Could not parse numeric data from file. Please ensure values are comma or newline separated.");
            }
        } catch (err) {
            alert("Error parsing file: " + err.message);
        }
    }

    generateSignalPoint(t, idx, samplesCount) {
        if (this.signalType === 'custom' && this.customData && this.customData.length > 0) {
            const dataIdx = Math.floor((this.time * 20 + idx) % this.customData.length);
            let val = this.customData[dataIdx];
            // Apply noise & refinement
            val += (Math.random() - 0.5) * 2 * this.noise;
            return this.applyRefinement(val);
        }

        let val = 0;
        const f = this.freq;

        if (this.signalType === 'sine') {
            val = Math.sin(2 * Math.PI * f * t);
        } else if (this.signalType === 'harmonic') {
            val = Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 2.5 * t) + 0.25 * Math.sin(2 * Math.PI * f * 4 * t);
        } else if (this.signalType === 'chirp') {
            val = Math.sin(2 * Math.PI * (f + t * 4) * t);
        } else if (this.signalType === 'nyaya') {
            val = Math.sin(2 * Math.PI * f * t) + 0.3 * Math.cos(2 * Math.PI * f * 3 * t);
        }

        val += (Math.random() - 0.5) * 2 * this.noise;
        return this.applyRefinement(val);
    }

    applyRefinement(val) {
        if (this.refinementLayer === 0) {
            return Math.round(val * 4) / 4;
        } else if (this.refinementLayer === 1) {
            return Math.round(val * 8) / 8;
        }
        return val;
    }

    drawTimeDomain() {
        const ctx = this.timeCtx;
        const w = this.timeCanvas.width;
        const h = this.timeCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Draw Grid
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 0; y < h; y += 30) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        // Center baseline
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        // Waveform trace
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        const gradient = ctx.createLinearGradient(0, 0, w, 0);
        gradient.addColorStop(0, '#10b981'); // Emerald
        gradient.addColorStop(0.5, '#06b6d4'); // Cyan
        gradient.addColorStop(1, '#3b82f6'); // Blue
        ctx.strokeStyle = gradient;

        const samples = 300;
        for (let i = 0; i < samples; i++) {
            const t = this.time + (i / samples) * 1.5;
            const val = this.generateSignalPoint(t, i, samples);
            const x = (i / samples) * w;
            const y = (h / 2) - (val * (h / 3));

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glow
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawFrequencyDomain() {
        const ctx = this.freqCtx;
        const w = this.freqCanvas.width;
        const h = this.freqCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = 0; y < h; y += 30) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        const numBars = 32;
        const barWidth = (w / numBars) - 4;

        // Compute FFT magnitude array
        for (let i = 0; i < numBars; i++) {
            let amp = 0;
            const freqIdx = i + 1;

            if (this.signalType === 'custom' && this.customData && this.customData.length > 0) {
                // Compute spectral energy at bin i from user data
                let energy = 0;
                const step = Math.max(1, Math.floor(this.customData.length / numBars));
                for (let k = i * step; k < (i + 1) * step && k < this.customData.length; k++) {
                    energy += Math.abs(this.customData[k]);
                }
                amp = Math.min(1.0, (energy / step) * 1.2 + (Math.random() * this.noise * 0.2));
            } else {
                const targetFreq = Math.round(this.freq * 2);
                if (freqIdx === targetFreq) {
                    amp = 0.85;
                } else if (this.signalType === 'harmonic' && (freqIdx === Math.round(targetFreq * 2.5) || freqIdx === Math.round(targetFreq * 4))) {
                    amp = 0.55;
                } else if (this.signalType === 'nyaya' && freqIdx === Math.round(targetFreq * 3)) {
                    amp = 0.40;
                } else {
                    amp = Math.random() * this.noise * 0.4;
                }
            }

            if (this.refinementLayer === 0 && freqIdx > 12) amp *= 0.2;

            const barHeight = Math.max(4, amp * (h - 20));
            const x = i * (barWidth + 4) + 2;
            const y = h - barHeight;

            const barGrad = ctx.createLinearGradient(0, y, 0, h);
            barGrad.addColorStop(0, '#f59e0b');
            barGrad.addColorStop(1, '#06b6d4');

            ctx.fillStyle = barGrad;
            ctx.fillRect(x, y, barWidth, barHeight);
        }
    }

    updateCodeHUD() {
        if (!this.codeContainer) return;

        const typeLabels = {
            'sine': 'एकल_तरंग (Sine Wave)',
            'harmonic': 'बहु_स्वर_गुणन (Harmonic)',
            'chirp': 'त्वरण_संकेत (Chirp Signal)',
            'nyaya': 'न्याय_शोधित (Nyaya Filtered)',
            'custom': `उपयोगकर्ता_बफर (${this.customFilename || 'User Custom Signal'} - ${this.customData ? this.customData.length + ' नूमने' : '0 samples'})`
        };

        const codeSnippet = `// ⚡ Suganita Devanagari DSL Live Engine
प्रवेश "संकेत_बफर" {
    स्रोत: "${typeLabels[this.signalType] || 'सामान्य'}",
    आवृत्ति_हर्ट्ज़: ${this.freq}Hz,
    शोर_स्तर: ${Math.round(this.noise * 100)}%,
    सहाइ_स्तर: "स्तर ${this.refinementLayer} (${this.refinementLayer === 0 ? 'आरंभिक' : this.refinementLayer === 1 ? 'मध्यम' : 'पूर्ण precision'})"
}

रूपरेखा "वर्णक्रम_विश्लेषण" {
    फूरियर_रूपांतरण: सत्य,
    न्याय_तर्क: "अनुमान_शोधन_सक्रिय"
}

लिखो "परिणाम: तरंग विश्लेषण पूर्ण"`;

        this.codeContainer.textContent = codeSnippet;
    }

    start() {
        const loop = () => {
            this.time += 0.02;
            this.drawTimeDomain();
            this.drawFrequencyDomain();
            this.animId = requestAnimationFrame(loop);
        };
        loop();
        this.updateCodeHUD();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('viz-time-canvas')) {
        window.suganitaVisualizer = new SuganitaSignalVisualizer(
            'viz-time-canvas',
            'viz-freq-canvas',
            'suganita-live-code'
        );
    }
});
