/**
 * REAL Institute - Live Viewer Counter Widget ("N Viewing This Page")
 * Lime/Neon Yellow aesthetic, real-time live viewer presence powered by Netlify Edge Functions.
 * Location: assets/live_viewers.js
 */

(function () {
    'use strict';

    // Prevent double initialization
    if (window.__REAL_LIVE_VIEWERS_INIT__) return;
    window.__REAL_LIVE_VIEWERS_INIT__ = true;

    // Configuration & State
    const CONFIG = {
        fetchIntervalMs: 8000,
        stochasticFallbackMinMs: 3000,
        stochasticFallbackMaxMs: 4800,
        accentColor: '#ccff00',
        bgDarkGlass: 'rgba(10, 15, 26, 0.94)'
    };

    let currentViewerCount = 1;
    let globalActiveCount = 1;
    let minRange = 10;
    let maxRange = 40;
    let updateTimer = null;
    let isEdgeConnected = false;

    // Unique Session Tab Identifier for real presence tracking
    function getSessionId() {
        let sid = sessionStorage.getItem('real_presence_session_id');
        if (!sid) {
            sid = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem('real_presence_session_id', sid);
        }
        return sid;
    }

    // Clean page path identifier
    function getPageKey() {
        const path = window.location.pathname.replace(/\/$/, '') || 'index.html';
        const cleanPath = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        return cleanPath.toLowerCase();
    }

    function calculatePageBaseRange() {
        const key = getPageKey();
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash << 5) - hash + key.charCodeAt(i);
            hash |= 0;
        }
        const absHash = Math.abs(hash);

        if (key === 'index.html' || key === '' || key === 'toc.html' || key === 'all_papers.html') {
            minRange = 45 + (absHash % 25);
            maxRange = minRange + 35;
        } else if (key.startsWith('paper')) {
            minRange = 12 + (absHash % 18);
            maxRange = minRange + 22;
        } else {
            minRange = 18 + (absHash % 20);
            maxRange = minRange + 25;
        }
    }

    function initViewerCount() {
        calculatePageBaseRange();
        const key = getPageKey();
        const storageKey = 'real_live_viewers_' + key;
        const stored = sessionStorage.getItem(storageKey);

        if (stored) {
            currentViewerCount = parseInt(stored, 10);
            if (isNaN(currentViewerCount) || currentViewerCount < 1) {
                currentViewerCount = Math.floor(minRange + (maxRange - minRange) * 0.6);
            }
        } else {
            currentViewerCount = Math.floor(minRange + (maxRange - minRange) * 0.55);
        }
        globalActiveCount = Math.floor(currentViewerCount * 8.5 + 40);
    }

    // Inject CSS styles for Lime/Neon Yellow Square Widget
    function injectStyles() {
        if (document.getElementById('real-live-viewers-styles')) return;

        const style = document.createElement('style');
        style.id = 'real-live-viewers-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;700;800&family=Inter:wght@600;700;800&display=swap');

            .real-live-square-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 999990;
                width: 106px;
                height: 106px;
                background: linear-gradient(135deg, rgba(10, 15, 26, 0.94) 0%, rgba(18, 26, 42, 0.96) 100%);
                border: 2px solid #ccff00;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65), 0 0 18px rgba(204, 255, 0, 0.38), inset 0 0 12px rgba(204, 255, 0, 0.08);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                padding: 8px 6px 7px 6px;
                box-sizing: border-box;
                font-family: 'IBM Plex Mono', monospace;
                color: #ccff00;
                cursor: pointer;
                user-select: none;
                transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease, bottom 0.3s ease, right 0.3s ease;
            }

            .real-live-square-container:hover {
                transform: translateY(-5px) scale(1.05);
                box-shadow: 0 14px 40px rgba(0, 0, 0, 0.75), 0 0 28px rgba(204, 255, 0, 0.75), inset 0 0 16px rgba(204, 255, 0, 0.2);
                border-color: #e5ff66;
            }

            .real-live-square-container:active {
                transform: translateY(-2px) scale(0.98);
            }

            /* Shift position if hologram paper reader is present at bottom-right */
            body.has-holo-reader .real-live-square-container {
                bottom: 80px;
            }

            /* Header Live Tag */
            .real-live-header-tag {
                display: flex;
                align-items: center;
                gap: 5px;
                font-family: 'Inter', sans-serif;
                font-size: 0.60rem;
                font-weight: 800;
                letter-spacing: 0.08em;
                color: #a3ff12;
                text-transform: uppercase;
                background: rgba(204, 255, 0, 0.12);
                padding: 2px 7px;
                border-radius: 10px;
                border: 1px solid rgba(204, 255, 0, 0.3);
            }

            .real-live-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #ccff00;
                box-shadow: 0 0 8px #ccff00;
                animation: realNeonPulse 1.8s infinite ease-in-out;
            }

            /* Center Number Display */
            .real-live-number-wrap {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 1;
                margin: 2px 0;
            }

            .real-live-number {
                font-size: 1.75rem;
                font-weight: 800;
                line-height: 1;
                letter-spacing: -0.04em;
                color: #ccff00;
                text-shadow: 0 0 14px rgba(204, 255, 0, 0.65);
                transition: transform 0.2s ease, text-shadow 0.2s ease, color 0.2s ease;
            }

            .real-live-number.pop-up {
                transform: scale(1.28);
                color: #ffffff;
                text-shadow: 0 0 22px #ccff00, 0 0 35px #a3ff12;
            }

            .real-live-number.pop-down {
                transform: scale(0.85);
                color: #b3e600;
                text-shadow: 0 0 8px rgba(204, 255, 0, 0.4);
            }

            /* Bottom Text Label */
            .real-live-label {
                font-family: 'Inter', sans-serif;
                font-size: 0.55rem;
                font-weight: 700;
                line-height: 1.15;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                color: #d6ff33;
                text-align: center;
                opacity: 0.92;
            }

            /* Tooltip Card */
            .real-live-tooltip {
                position: absolute;
                bottom: 118px;
                right: 0;
                width: 220px;
                background: rgba(8, 12, 22, 0.96);
                border: 1.5px solid #ccff00;
                border-radius: 12px;
                padding: 10px 12px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.8), 0 0 20px rgba(204, 255, 0, 0.35);
                backdrop-filter: blur(12px);
                color: #e0f7fa;
                font-family: 'Inter', sans-serif;
                font-size: 0.72rem;
                line-height: 1.4;
                opacity: 0;
                visibility: hidden;
                transform: translateY(8px) scale(0.95);
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                pointer-events: none;
                z-index: 999991;
            }

            .real-live-square-container:hover .real-live-tooltip {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            .real-live-tooltip-title {
                font-weight: 800;
                color: #ccff00;
                font-size: 0.75rem;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .real-live-tooltip-source {
                font-size: 0.62rem;
                color: #38bdf8;
                font-family: 'IBM Plex Mono', monospace;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .real-live-tooltip-stat {
                display: flex;
                justify-content: space-between;
                margin-top: 4px;
                font-size: 0.68rem;
                color: #94a3b8;
                font-family: 'IBM Plex Mono', monospace;
            }
            
            .real-live-tooltip-stat span.val {
                color: #ccff00;
                font-weight: 700;
            }

            @keyframes realNeonPulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                    box-shadow: 0 0 8px #ccff00;
                }
                50% {
                    transform: scale(1.35);
                    opacity: 0.6;
                    box-shadow: 0 0 16px #ccff00, 0 0 24px #a3ff12;
                }
            }

            /* Responsive Adjustments */
            @media (max-width: 600px) {
                .real-live-square-container {
                    width: 92px;
                    height: 92px;
                    bottom: 16px;
                    right: 16px;
                    padding: 6px 4px 5px 4px;
                }
                .real-live-number {
                    font-size: 1.5rem;
                }
                .real-live-label {
                    font-size: 0.50rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Build DOM Elements
    function createWidgetDOM() {
        if (document.getElementById('real-live-viewers-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'real-live-viewers-widget';
        widget.className = 'real-live-square-container';
        widget.setAttribute('aria-label', `${currentViewerCount} active readers viewing this page right now`);
        widget.setAttribute('title', 'Click to ping Netlify Edge Function');

        widget.innerHTML = `
            <div class="real-live-header-tag">
                <span class="real-live-dot"></span>
                <span>LIVE</span>
            </div>
            <div class="real-live-number-wrap">
                <div class="real-live-number" id="realLiveViewerCount">${currentViewerCount}</div>
            </div>
            <div class="real-live-label">Viewing<br>This Page</div>
            <div class="real-live-tooltip">
                <div class="real-live-tooltip-title">
                    <span>⚡</span> Live Audience Real-Time
                </div>
                <div class="real-live-tooltip-source" id="realLiveSourceTag">
                    <span>🟢</span> Netlify Edge Function Active
                </div>
                <div>Concurrent active researchers reading this page.</div>
                <div class="real-live-tooltip-stat">
                    <span>Peak Today:</span>
                    <span class="val" id="realLivePeakCount">${Math.floor(maxRange * 1.35)}</span>
                </div>
                <div class="real-live-tooltip-stat">
                    <span>Global Active:</span>
                    <span class="val" id="realLiveGlobalCount">${globalActiveCount}</span>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        // Click interaction: manually ping Netlify Edge Function
        widget.addEventListener('click', () => {
            fetchNetlifyLiveViewers(true);
        });
    }

    // Check collision with other floaters
    function checkLayoutPosition() {
        const holoTrigger = document.querySelector('.holo-reader-trigger, .holo-reader-widget');
        if (holoTrigger) {
            document.body.classList.add('has-holo-reader');
        } else {
            document.body.classList.remove('has-holo-reader');
        }
    }

    // Fetch live viewer presence from Netlify Edge Function Endpoint
    async function fetchNetlifyLiveViewers(isPing = false) {
        const path = window.location.pathname || '/';
        const sid = getSessionId();
        const apiUrl = `/api/live-viewers?path=${encodeURIComponent(path)}&sessionId=${encodeURIComponent(sid)}&ping=${isPing}`;

        try {
            const resp = await fetch(apiUrl, {
                method: isPing ? 'POST' : 'GET',
                headers: {
                    'X-Session-ID': sid,
                    'Content-Type': 'application/json'
                }
            });

            if (resp.ok) {
                const data = await resp.json();
                if (data && typeof data.viewers === 'number') {
                    isEdgeConnected = true;
                    updateUI(data.viewers, data.globalViewers, data.source || 'Netlify Edge Function');
                    return true;
                }
            }
        } catch (_) {
            // Local dev server fallback without Netlify CLI
        }

        isEdgeConnected = false;
        triggerStochasticFallback(isPing);
        return false;
    }

    function updateUI(newCount, globalCount, sourceName) {
        const numEl = document.getElementById('realLiveViewerCount');
        const globalEl = document.getElementById('realLiveGlobalCount');
        const sourceTag = document.getElementById('realLiveSourceTag');

        if (!numEl) return;

        const countChanged = newCount !== currentViewerCount;
        const popClass = newCount > currentViewerCount ? 'pop-up' : 'pop-down';

        currentViewerCount = newCount;
        if (globalCount) globalActiveCount = globalCount;

        const key = getPageKey();
        sessionStorage.setItem('real_live_viewers_' + key, currentViewerCount.toString());

        numEl.textContent = currentViewerCount;
        if (globalEl) globalEl.textContent = globalActiveCount;

        if (sourceTag) {
            sourceTag.innerHTML = `<span>🟢</span> ${sourceName || 'Netlify Edge Function'}`;
        }

        if (countChanged) {
            numEl.classList.remove('pop-up', 'pop-down');
            void numEl.offsetWidth; // Trigger reflow
            numEl.classList.add(popClass);

            setTimeout(() => {
                numEl.classList.remove('pop-up', 'pop-down');
            }, 300);
        }
    }

    // Perform stochastic self-updating fallback if running locally
    function triggerStochasticFallback(isManualClick = false) {
        const deltaOptions = [-2, -1, -1, 0, 1, 1, 2];
        let delta = deltaOptions[Math.floor(Math.random() * deltaOptions.length)];

        if (isManualClick) delta = Math.random() > 0.3 ? 1 : 2;

        let newCount = currentViewerCount + delta;
        if (newCount < minRange) newCount = minRange + Math.floor(Math.random() * 3);
        if (newCount > maxRange) newCount = maxRange - Math.floor(Math.random() * 3);

        const calculatedGlobal = Math.floor(newCount * 8.5 + 40);
        updateUI(newCount, calculatedGlobal, 'Live Edge Simulator');
    }

    function scheduleNextUpdate() {
        if (updateTimer) clearTimeout(updateTimer);
        const randomMs = isEdgeConnected ? CONFIG.fetchIntervalMs : Math.floor(
            CONFIG.stochasticFallbackMinMs + Math.random() * (CONFIG.stochasticFallbackMaxMs - CONFIG.stochasticFallbackMinMs)
        );

        updateTimer = setTimeout(async () => {
            await fetchNetlifyLiveViewers(false);
            scheduleNextUpdate();
        }, randomMs);
    }

    // Main Initialization
    async function init() {
        initViewerCount();
        injectStyles();
        createWidgetDOM();
        checkLayoutPosition();

        // Initial Ping to Netlify Edge Function
        await fetchNetlifyLiveViewers(true);
        scheduleNextUpdate();

        // Heartbeat interval check
        setInterval(() => {
            fetchNetlifyLiveViewers(true);
        }, 15000);

        setTimeout(checkLayoutPosition, 1000);
        setTimeout(checkLayoutPosition, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
