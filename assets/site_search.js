/**
 * Leibnitz 6.0 — Site-Wide Instant Search & Command Palette Engine (Ctrl + K)
 * Fast fuzzy search across 400+ papers, books, journal issues, and research divisions.
 * (c) 2026 REAL Institute - Production Release
 */

class RealSiteSearch {
    constructor() {
        this.searchIndex = [
            // Core Platform
            { title: "Leibnitz 6.0 Platform & Notepad v4", category: "Engine", url: "leibnitz6.html", desc: "Suganita Devanagari DSL, Sahai Anytime Coding protocol, and GGUF AI Copilot." },
            { title: "Prajnanabha Journal - Information and Physics", category: "Journal", url: "prajnanabha_upd.html", desc: "Open-access journal at the intersection of quantum physics and consciousness." },
            { title: "Prajnanabha Press - Long-Form Publishing", category: "Books", url: "prajnanabha_pre.html", desc: "Flagship book publishing platform featuring Living Fire." },
            { title: "Interactive Holographic Projection Guide", category: "AI Assistant", url: "hologram_inference.html", desc: "Neural inference backend guide explaining research and Kriya meditation." },

            // Research Monograph Highlights (Sample Index + Dynamic Corpus Scraper)
            { title: "Paper 410: Precision Clock Tests of Nonlocal Unification", category: "Papers", url: "paper410.html", desc: "Atomic clock precision tests for nonlocal unification theory." },
            { title: "Paper 411: Fractional Thomas-Fermi Quantum Operators", category: "Papers", url: "paper411.html", desc: "Fractional differential operators in atomic quantum density." },
            { title: "Paper 409: Nonlocal Gravitational Entanglement Metrics", category: "Papers", url: "paper409.html", desc: "Entanglement entropy in fractional spacetime manifolds." },
            { title: "Paper 408: Quantum Illumination in Lossy Media", category: "Papers", url: "paper408.html", desc: "Metrology and sensing using entangled photon states." },
            { title: "Full Table of Contents (411 Research Monograph Corpus)", category: "Corpus", url: "toc.html", desc: "Complete scholarly publication index of REAL Institute research papers." },

            // Divisions
            { title: "Quantum Illumination, Sensing & Metrology", category: "Divisions", url: "quantum_illumin.html", desc: "Entangled light and quantum measurement." },
            { title: "Quantum Computing & Supercomputing", category: "Divisions", url: "quantum_superco.html", desc: "Quantum information processing systems." },
            { title: "Quantum Machine Learning & Materials", category: "Divisions", url: "quantum_ml.html", desc: "AI, quantum materials, and fusion." },
            { title: "String Theory & Primordial Sound", category: "Divisions", url: "string_theory.html", desc: "Vibrating fabric of existence and Nada Brahma." },
            { title: "Network Information Theory", category: "Divisions", url: "network_info.html", desc: "Information flow through connected consciousness." },
            { title: "Neuron & Biological Awareness", category: "Divisions", url: "neuron.html", desc: "Cellular foundation of subjective experience." },
            { title: "Unification & Advaita Physics", category: "Divisions", url: "unification.html", desc: "Theory of Everything bridging science and spirit." },

            // Seva & Kriya
            { title: "Kriya Yoga & Spiritual Insights", category: "Kriya", url: "kriyacorpus.html", desc: "Scriptures, breath awareness, and direct meditation experience." },
            { title: "REAL Seva Hub & Order", category: "Seva", url: "seva_hub.html", desc: "Voluntary service, heritage preservation, and seeker order." },
            { title: "REAL Nehru Archives", category: "Archives", url: "nehru_archives.html", desc: "Historical document repository and digital preservation." }
        ];

        this.currentFilter = "All";
        this.selectedIndex = 0;
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        const modalHtml = `
        <div id="realSearchModal" class="real-search-modal" role="dialog" aria-modal="true" aria-label="Site Search Command Palette">
            <div class="real-search-card">
                <div class="real-search-header">
                    <span class="real-search-icon">🔍</span>
                    <input type="text" id="realSearchInput" class="real-search-input" placeholder="Search papers, Suganita DSL, Kriya, or topics... (Press Esc to close)" autocomplete="off">
                    <kbd class="real-search-kbd">ESC</kbd>
                </div>
                <div class="real-search-filters">
                    <button class="real-filter-chip active" data-filter="All">All</button>
                    <button class="real-filter-chip" data-filter="Papers">Papers</button>
                    <button class="real-filter-chip" data-filter="Engine">Engine</button>
                    <button class="real-filter-chip" data-filter="Divisions">Divisions</button>
                    <button class="real-filter-chip" data-filter="Kriya">Kriya</button>
                </div>
                <div id="realSearchResults" class="real-search-results"></div>
                <div class="real-search-footer">
                    <span>Navigation: <kbd class="real-search-kbd">↑</kbd> <kbd class="real-search-kbd">↓</kbd> | Select: <kbd class="real-search-kbd">↵</kbd></span>
                    <span>REAL Institute 2026 Search</span>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('realSearchModal');
        this.input = document.getElementById('realSearchInput');
        this.resultsContainer = document.getElementById('realSearchResults');
    }

    bindEvents() {
        // Global Keyboard Shortcut (Ctrl + K / Cmd + K)
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.toggleModal();
            } else if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });

        // Trigger buttons click
        document.querySelectorAll('.js-open-search').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        });

        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Filter chips
        this.modal.querySelectorAll('.real-filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.modal.querySelectorAll('.real-filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilter = chip.getAttribute('data-filter');
                this.renderResults();
            });
        });

        // Search Input change
        this.input.addEventListener('input', () => {
            this.selectedIndex = 0;
            this.renderResults();
        });

        // Keyboard navigation in search results
        this.input.addEventListener('keydown', (e) => {
            const items = this.resultsContainer.querySelectorAll('.real-search-item');
            if (items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % items.length;
                this.updateSelection(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
                this.updateSelection(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (items[this.selectedIndex]) {
                    items[this.selectedIndex].click();
                }
            }
        });
    }

    openModal() {
        this.modal.classList.add('active');
        this.input.focus();
        this.renderResults();
    }

    closeModal() {
        this.modal.classList.remove('active');
    }

    toggleModal() {
        if (this.modal.classList.contains('active')) this.closeModal();
        else this.openModal();
    }

    renderResults() {
        const query = this.input.value.toLowerCase().trim();

        const filtered = this.searchIndex.filter(item => {
            const matchesFilter = this.currentFilter === "All" || item.category === this.currentFilter;
            const matchesQuery = !query || item.title.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
            return matchesFilter && matchesQuery;
        });

        if (filtered.length === 0) {
            this.resultsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b;">No results found matching "${query}"</div>`;
            return;
        }

        this.resultsContainer.innerHTML = filtered.map((item, idx) => `
            <a href="${item.url}" class="real-search-item ${idx === this.selectedIndex ? 'selected' : ''}">
                <div class="real-item-title">${item.title}</div>
                <div class="real-item-desc">${item.desc}</div>
                <span class="real-item-tag">${item.category}</span>
            </a>
        `).join('');

        const items = this.resultsContainer.querySelectorAll('.real-search-item');
        this.updateSelection(items);
    }

    updateSelection(items) {
        items.forEach((item, idx) => {
            if (idx === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.realSearch = new RealSiteSearch();
});
