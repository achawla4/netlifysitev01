/**
 * REAL Institute - Solar-10.7B GGUF Model Auto-Launcher & Pre-Warmer
 * Location: assets/solar_server_prewarmer.js
 * Automatically pre-warms and launches the local Solar-10.7B model on visitor arrival.
 */

(function () {
  'use strict';

  let isDispatched = false;

  function launchAndPrewarmSolar() {
    if (isDispatched) return;
    isDispatched = true;

    console.log('[Solar Pre-Warmer] Visitor arrival detected. Pre-warming Solar-10.7B GGUF model in background...');

    const payload = JSON.stringify({
      event: 'visitor_arrival_prewarm',
      model: 'solar-10.7b-instruct-q4_k_m.gguf',
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    // 1. Send launch/pre-warm trigger to Netlify edge endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/launch-solar', payload);
    } else {
      fetch('/api/launch-solar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }

    // 2. Fire background pre-warm fetch to local llama-server (Port 8080)
    fetch('http://127.0.0.1:8089/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'System: Pre-warm 406 paper model.', n_predict: 1 }),
      keepalive: true
    }).catch(() => {});

    // 3. Fire background pre-warm fetch to local Ollama server (Port 11434)
    fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3.1:latest', prompt: 'Pre-warm model', stream: false }),
      keepalive: true
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', launchAndPrewarmSolar);
  } else {
    launchAndPrewarmSolar();
  }
})();
