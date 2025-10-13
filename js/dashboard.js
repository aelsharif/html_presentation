class PresentationDashboard {
    constructor() {
        this.presentations = [];
        this.filteredPresentations = [];
        this.currentView = 'grid';
        this.searchInput = document.getElementById('searchInput');
        this.presentationsGrid = document.getElementById('presentationsGrid');
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.presentationCount = document.getElementById('presentationCount');
        this.gridViewBtn = document.getElementById('gridView');
        this.listViewBtn = document.getElementById('listView');
        this.refreshBtn = document.getElementById('refreshBtn');

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadPresentations();
        this.renderPresentations();
    }

    setupEventListeners() {
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.filterPresentations(e.target.value);
        });

        // View toggle
        this.gridViewBtn.addEventListener('click', () => this.setView('grid'));
        this.listViewBtn.addEventListener('click', () => this.setView('list'));

        // Refresh button
        this.refreshBtn.addEventListener('click', () => this.refreshPresentations());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.searchInput.focus();
            }
        });
    }

    async loadPresentations() {
        this.showLoading();

        try {
            const presentations = [];

            // Add a timeout to the entire discovery process
            const discoveryPromise = this.discoverPresentationFolders();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Discovery timeout')), 15000) // 15 second timeout
            );

            let discoveredFolders = [];
            try {
                discoveredFolders = await Promise.race([discoveryPromise, timeoutPromise]);
            } catch (error) {
                console.warn('Presentation discovery timed out, using fallback method');
                // Fallback to just checking our known presentations
                discoveredFolders = ['demo-presentation', 'business-presentation', 'tutorial-presentation'];
            }

            // Process each discovered folder
            for (const folderName of discoveredFolders) {
                try {
                    const presentationData = await this.loadPresentationData(folderName);
                    if (presentationData) {
                        presentations.push(presentationData);
                    }
                } catch (error) {
                    console.log(`Skipping invalid presentation folder: ${folderName}`, error);
                    continue;
                }
            }

            // If no presentations found, create a default demo
            if (presentations.length === 0) {
                const defaultDemo = await this.createDefaultPresentation();
                if (defaultDemo) {
                    presentations.push(defaultDemo);
                }
            }

            this.presentations = presentations;
            this.filteredPresentations = [...presentations];
            this.updatePresentationCount();

            // Log discovery results for debugging
            console.log(`Presentation Discovery Summary:`, {
                totalFoldersFound: presentations.length,
                validPresentations: presentations.filter(p => p.slideCount > 0 && p.id !== 'placeholder').length,
                presentations: presentations.map(p => ({
                    folder: p.folder,
                    title: p.title,
                    slideCount: p.slideCount
                }))
            });

        } catch (error) {
            console.error('Error loading presentations:', error);
            this.presentations = [];
            this.filteredPresentations = [];
        }

        this.hideLoading();
    }

    async discoverPresentationFolders() {
        const discoveredFolders = [];

        // Strategy 1: Try known existing folder names first (most likely to succeed)
        const priorityNames = [
            'demo-presentation',
            'business-presentation',
            'tutorial-presentation'
        ];

        console.log('🔍 Starting presentation discovery...');

        for (const folderName of priorityNames) {
            if (await this.folderExists(folderName)) {
                discoveredFolders.push(folderName);
                console.log(`✅ Found: ${folderName}`);
            }
        }

        // Strategy 2: Try other common patterns (limited set to avoid too many requests)
        const commonPatterns = [
            'sample-presentation',
            'my-presentation',
            'presentation-1',
            'presentation-2',
            'slides-1',
            'slides-2',
            'deck-1',
            'project-presentation'
        ];

        for (const pattern of commonPatterns) {
            if (!discoveredFolders.includes(pattern) && await this.folderExists(pattern)) {
                discoveredFolders.push(pattern);
                console.log(`✅ Found: ${pattern}`);
            }
        }

        // Strategy 3: Enhanced regex-based prefix scanning
        const regexPatterns = await this.scanFoldersWithRegexPatterns();
        for (const folderName of regexPatterns) {
            if (!discoveredFolders.includes(folderName)) {
                discoveredFolders.push(folderName);
                console.log(`✅ Found (regex): ${folderName}`);
            }
        }

        console.log(`🎯 Discovery complete: Found ${discoveredFolders.length} presentation folders`);
        return discoveredFolders;
    }

    async scanFoldersWithRegexPatterns() {
        const foundFolders = [];

        // Define regex patterns for common presentation folder naming conventions
        const prefixPatterns = [
            // Core presentation patterns
            /^(pres|presentation|presentations?)(-|_|\d|$)/i,
            /^(slide|slides)(-|_|\d|$)/i,
            /^(deck|decks?)(-|_|\d|$)/i,
            /^(talk|talks?)(-|_|\d|$)/i,
            /^(demo|demos?)(-|_|\d|$)/i,
            /^(show|shows?)(-|_|\d|$)/i,

            // Project and content patterns
            /^(project|projects?)(-|_|\d|$)/i,
            /^(content|contents?)(-|_|\d|$)/i,
            /^(material|materials?)(-|_|\d|$)/i,
            /^(training|course|tutorial)(-|_|\d|$)/i,

            // Event and topic patterns
            /^(meeting|conference|workshop)(-|_|\d|$)/i,
            /^(report|reports?)(-|_|\d|$)/i,
            /^(pitch|pitches?)(-|_|\d|$)/i,
            /^(intro|introduction)(-|_|\d|$)/i,
            /^(final|conclusion)(-|_|\d|$)/i,

            // Date-based patterns
            /^(202[0-9]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(-|_)/i,

            // Generic numbered patterns
            /^[a-z]+\d+$/i,
            /^[a-z]+-\d+$/i,
            /^[a-z]+_\d+$/i
        ];

        console.log('🔍 Starting regex-based folder scanning...');

        // Generate potential folder names based on patterns and test them
        const candidateFolders = this.generateCandidateFolders();
        console.log(`📝 Generated ${candidateFolders.length} candidate folders to test`);

        for (const folderName of candidateFolders) {
            // Check if folder name matches any of our patterns
            const matchesPattern = prefixPatterns.some(pattern => pattern.test(folderName));

            if (matchesPattern && await this.folderExists(folderName, true)) { // Quick check for regex scanning
                foundFolders.push(folderName);
                console.log(`🎯 Regex match found: ${folderName}`);
            }
        }

        // Also try systematic generation based on regex patterns
        await this.systematicRegexScan(prefixPatterns, foundFolders);

        console.log(`📊 Regex scan complete: Found ${foundFolders.length} additional folders`);
        return foundFolders;
    }

    generateCandidateFolders() {
        const candidates = [];

        // Common base names
        const baseNames = [
            'presentation', 'slide', 'deck', 'talk', 'demo', 'show',
            'project', 'content', 'material', 'training', 'course',
            'meeting', 'workshop', 'report', 'pitch', 'intro', 'final'
        ];

        // Generate variations
        for (const base of baseNames) {
            // Simple numbered versions
            for (let i = 1; i <= 5; i++) {
                candidates.push(`${base}${i}`);
                candidates.push(`${base}-${i}`);
                candidates.push(`${base}_${i}`);
                candidates.push(`${base}s${i}`); // plural version
                candidates.push(`${base}s-${i}`);
            }

            // Lettered versions
            for (const letter of ['a', 'b', 'c']) {
                candidates.push(`${base}-${letter}`);
                candidates.push(`${base}_${letter}`);
            }

            // Date suffixes
            const currentYear = new Date().getFullYear();
            candidates.push(`${base}-${currentYear}`);
            candidates.push(`${base}-${currentYear - 1}`);
            candidates.push(`${base}_${currentYear}`);
        }

        // Add year-based patterns
        const years = [2023, 2024, 2025];
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

        for (const year of years) {
            candidates.push(`${year}-presentation`);
            candidates.push(`presentation-${year}`);

            for (let i = 0; i < 3; i++) { // Just first 3 months to limit requests
                candidates.push(`${months[i]}-${year}`);
                candidates.push(`${year}-${months[i]}`);
            }
        }

        return [...new Set(candidates)]; // Remove duplicates
    }

    async systematicRegexScan(patterns, foundFolders) {
        // Generate folder names systematically based on regex patterns
        const prefixBases = [
            'pres', 'presentation', 'slide', 'slides', 'deck', 'talk', 'demo',
            'project', 'content', 'training', 'meeting', 'workshop', 'report'
        ];

        for (const base of prefixBases) {
            // Test variations that would match our regex patterns
            const variations = [
                base,
                `${base}s`, // plural
                `${base}-1`, `${base}-2`, `${base}-3`,
                `${base}_1`, `${base}_2`, `${base}_3`,
                `${base}1`, `${base}2`, `${base}3`,
                `${base}-presentation`,
                `${base}-slides`,
                `${base}-content`
            ];

            for (const variation of variations) {
                if (!foundFolders.includes(variation) && await this.folderExists(variation, true)) { // Quick check for systematic scan
                    // Double-check it matches our patterns
                    const matchesPattern = patterns.some(pattern => pattern.test(variation));
                    if (matchesPattern) {
                        foundFolders.push(variation);
                        console.log(`🔍 Systematic scan found: ${variation}`);
                    }
                }
            }
        }
    }

    async folderExists(folderName, quickCheck = false) {
        try {
            // For quick checks during regex scanning, test fewer paths
            const testPaths = quickCheck ? [
                `slides/${folderName}/config.json`,        // Highest priority - config file
                `slides/${folderName}/01.html`             // Most common pattern
            ] : [
                `slides/${folderName}/config.json`,        // Highest priority - config file
                `slides/${folderName}/01-welcome.html`,    // Our demo pattern
                `slides/${folderName}/01.html`,            // Simple numbered
                `slides/${folderName}/01-slide.html`,      // Named pattern
                `slides/${folderName}/01-intro.html`       // Common intro pattern
            ];

            for (const path of testPaths) {
                try {
                    // Shorter timeout for quick checks
                    const timeoutMs = quickCheck ? 1500 : 3000;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                    const response = await fetch(path, {
                        signal: controller.signal,
                        method: 'HEAD' // Try HEAD first for faster response
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        return true;
                    }
                } catch (error) {
                    // If HEAD fails with 405, try GET (but only for non-quick checks)
                    if (error.name !== 'AbortError' && !quickCheck) {
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 2000);

                            const response = await fetch(path, { signal: controller.signal });
                            clearTimeout(timeoutId);

                            if (response.ok) {
                                return true;
                            }
                        } catch (getError) {
                            // Continue to next path
                            continue;
                        }
                    }
                    continue;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    async loadPresentationData(folderName) {
        try {
            // Try to load config.json first
            const configResponse = await fetch(`slides/${folderName}/config.json`);
            let config = {};

            if (configResponse.ok) {
                config = await configResponse.json();
            } else {
                // Generate default config if no config.json exists
                config = {
                    title: this.generateTitleFromFolderName(folderName),
                    description: `Auto-discovered presentation from ${folderName} folder`,
                    author: 'Unknown',
                    created: new Date().toISOString().split('T')[0]
                };
            }

            // Count slides in the presentation
            const slideCount = await this.countSlides(folderName);

            // Only return if we found at least one slide
            if (slideCount > 0) {
                return {
                    id: folderName,
                    name: folderName,
                    title: config.title || this.generateTitleFromFolderName(folderName),
                    description: config.description || 'No description available',
                    author: config.author || 'Unknown',
                    created: config.created || new Date().toISOString().split('T')[0],
                    slideCount: slideCount,
                    thumbnail: config.thumbnail || null,
                    folder: folderName
                };
            }
        } catch (error) {
            console.error(`Error loading presentation data for ${folderName}:`, error);
        }
        return null;
    }

    generateTitleFromFolderName(folderName) {
        let title = folderName;

        // Handle different separators (hyphens, underscores)
        title = title.replace(/[-_]/g, ' ');

        // Split into words and capitalize each word
        title = title.split(/\s+/)
            .map(word => {
                // Handle special cases for common abbreviations
                const upperWord = word.toLowerCase();
                if (['pres', 'demo', 'intro'].includes(upperWord)) {
                    return this.expandAbbreviation(upperWord);
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');

        // Add space between letters and numbers
        title = title.replace(/([a-z])(\d)/gi, '$1 $2');
        title = title.replace(/(\d)([a-z])/gi, '$1 $2');

        // Handle camelCase
        title = title.replace(/([a-z])([A-Z])/g, '$1 $2');

        // Clean up multiple spaces
        title = title.replace(/\s+/g, ' ').trim();

        // Add "Presentation" suffix if it doesn't already contain presentation-related words
        const presentationWords = ['presentation', 'slide', 'deck', 'talk', 'demo', 'show'];
        const hasPresWord = presentationWords.some(word =>
            title.toLowerCase().includes(word)
        );

        if (!hasPresWord) {
            title += ' Presentation';
        }

        return title;
    }

    expandAbbreviation(abbrev) {
        const expansions = {
            'pres': 'Presentation',
            'demo': 'Demo',
            'intro': 'Introduction',
            'proj': 'Project',
            'cont': 'Content',
            'meet': 'Meeting',
            'work': 'Workshop',
            'train': 'Training'
        };

        return expansions[abbrev] || abbrev.charAt(0).toUpperCase() + abbrev.slice(1);
    }

    async createDefaultPresentation() {
        // Try to create/find a demo presentation if none exist
        const demoFolderExists = await this.folderExists('demo-presentation');

        if (demoFolderExists) {
            return await this.loadPresentationData('demo-presentation');
        }

        // Return a placeholder if no presentations exist at all
        return {
            id: 'placeholder',
            name: 'placeholder',
            title: 'No Presentations Found',
            description: 'Create presentation folders in the slides/ directory to get started',
            author: 'System',
            created: new Date().toISOString().split('T')[0],
            slideCount: 0,
            thumbnail: null,
            folder: 'placeholder'
        };
    }

    async countSlides(presentationFolder) {
        let count = 0;

        // Strategy 1: Check config.json for slide count
        try {
            const configResponse = await fetch(`slides/${presentationFolder}/config.json`);
            if (configResponse.ok) {
                const config = await configResponse.json();
                if (config.slides && Array.isArray(config.slides)) {
                    return config.slides.length;
                }
            }
        } catch (error) {
            // Continue with other strategies
        }

        // Strategy 2: Try to count slides by checking numbered files
        const slidePatterns = [
            // Standard numbered patterns
            (i) => `slides/${presentationFolder}/${i.toString().padStart(2, '0')}.html`,
            (i) => `slides/${presentationFolder}/${i}.html`,
            // Named patterns
            (i) => `slides/${presentationFolder}/${i.toString().padStart(2, '0')}-slide.html`,
            (i) => `slides/${presentationFolder}/${i.toString().padStart(2, '0')}-intro.html`,
            (i) => `slides/${presentationFolder}/${i.toString().padStart(2, '0')}-content.html`,
            (i) => `slides/${presentationFolder}/${i.toString().padStart(2, '0')}-welcome.html`,
            (i) => `slides/${presentationFolder}/slide${i}.html`,
            (i) => `slides/${presentationFolder}/slide-${i}.html`
        ];

        // Check up to 50 potential slides
        for (let i = 1; i <= 50; i++) {
            let foundSlideForNumber = false;

            for (const patternFunc of slidePatterns) {
                try {
                    const testPath = patternFunc(i);
                    const response = await fetch(testPath);
                    if (response.ok) {
                        count++;
                        foundSlideForNumber = true;
                        break; // Found slide for this number, try next number
                    }
                } catch (error) {
                    continue;
                }
            }

            // If we didn't find a slide for this number, check a few more before giving up
            if (!foundSlideForNumber && i > 5) {
                // Allow some gaps, but if we haven't found anything in the last 5 numbers, stop
                let foundInNext5 = false;
                for (let j = i + 1; j <= i + 5 && j <= 50; j++) {
                    for (const patternFunc of slidePatterns) {
                        try {
                            const testPath = patternFunc(j);
                            const response = await fetch(testPath);
                            if (response.ok) {
                                foundInNext5 = true;
                                break;
                            }
                        } catch (error) {
                            continue;
                        }
                    }
                    if (foundInNext5) break;
                }

                if (!foundInNext5) {
                    break; // No more slides found, stop counting
                }
            }
        }

        // Strategy 3: If still no slides found, try common single file names
        if (count === 0) {
            const singleFileNames = [
                'index.html',
                'slide.html',
                'presentation.html',
                'main.html',
                'content.html'
            ];

            for (const fileName of singleFileNames) {
                try {
                    const response = await fetch(`slides/${presentationFolder}/${fileName}`);
                    if (response.ok) {
                        count = 1;
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        return Math.max(count, 0); // Return actual count, can be 0 if no slides found
    }

    filterPresentations(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredPresentations = this.presentations.filter(presentation =>
            presentation.title.toLowerCase().includes(term) ||
            presentation.description.toLowerCase().includes(term) ||
            presentation.author.toLowerCase().includes(term)
        );
        this.renderPresentations();
    }

    setView(viewType) {
        this.currentView = viewType;

        // Update button states
        this.gridViewBtn.classList.toggle('active', viewType === 'grid');
        this.listViewBtn.classList.toggle('active', viewType === 'list');

        // Update grid class
        this.presentationsGrid.classList.toggle('list-view', viewType === 'list');
    }

    renderPresentations() {
        // Filter out placeholder presentations with 0 slides
        const validPresentations = this.filteredPresentations.filter(p =>
            p.slideCount > 0 && p.id !== 'placeholder'
        );

        if (validPresentations.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        const presentationsHTML = validPresentations.map(presentation =>
            this.createPresentationCard(presentation)
        ).join('');

        this.presentationsGrid.innerHTML = presentationsHTML;

        // Add click listeners to cards
        this.presentationsGrid.querySelectorAll('.presentation-card').forEach(card => {
            card.addEventListener('click', () => {
                const presentationId = card.dataset.presentationId;
                this.openPresentation(presentationId);
            });
        });
    }

    createPresentationCard(presentation) {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
        ];

        const gradient = gradients[Math.abs(presentation.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % gradients.length];

        return `
            <div class="presentation-card" data-presentation-id="${presentation.id}">
                <div class="presentation-thumbnail" style="background: ${gradient}">
                    ${presentation.thumbnail ?
            `<img src="${presentation.thumbnail}" alt="${presentation.title}" style="width: 100%; height: 100%; object-fit: cover;">` :
            `<div class="default-icon"><i class="fas fa-presentation-screen"></i></div>`
        }
                    <div class="slide-count-badge">
                        <i class="fas fa-images"></i> ${presentation.slideCount}
                    </div>
                </div>
                <div class="presentation-info">
                    <h3 class="presentation-title">${presentation.title}</h3>
                    <p class="presentation-description">${presentation.description}</p>
                    <div class="presentation-meta">
                        <div class="presentation-author">
                            <i class="fas fa-user"></i>
                            <span>${presentation.author}</span>
                        </div>
                        <div class="presentation-date">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(presentation.created).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    openPresentation(presentationId) {
        // Navigate to presentation viewer with the selected presentation
        const presentation = this.presentations.find(p => p.id === presentationId);
        if (presentation && presentation.slideCount > 0) {
            // Use URL parameters to pass presentation info
            window.location.href = `presentation.html?folder=${encodeURIComponent(presentation.folder)}&title=${encodeURIComponent(presentation.title)}`;
        } else if (presentation && presentation.slideCount === 0) {
            // Show a message for presentations with no slides
            alert(`The presentation "${presentation.title}" has no slides. Please add HTML files to the ${presentation.folder} folder.`);
        } else {
            // Presentation not found
            console.error('Presentation not found:', presentationId);
        }
    }

    async refreshPresentations() {
        this.refreshBtn.querySelector('i').classList.add('fa-spin');
        await this.loadPresentations();
        this.renderPresentations();

        setTimeout(() => {
            this.refreshBtn.querySelector('i').classList.remove('fa-spin');
        }, 500);
    }

    updatePresentationCount() {
        const validPresentations = this.presentations.filter(p => p.slideCount > 0 && p.id !== 'placeholder');
        this.presentationCount.textContent = validPresentations.length;

        // Update the header with more detailed info
        if (validPresentations.length !== this.presentations.length) {
            const totalFolders = this.presentations.length - (this.presentations.find(p => p.id === 'placeholder') ? 1 : 0);
            console.log(`Found ${totalFolders} presentation folders, ${validPresentations.length} with slides`);
        }
    }

    showLoading() {
        this.loadingState.style.display = 'flex';
        this.presentationsGrid.style.display = 'none';
        this.emptyState.style.display = 'none';
    }

    hideLoading() {
        this.loadingState.style.display = 'none';
        this.presentationsGrid.style.display = 'grid';
    }

    showEmptyState() {
        this.emptyState.style.display = 'flex';
        this.presentationsGrid.style.display = 'none';
    }

    hideEmptyState() {
        this.emptyState.style.display = 'none';
        this.presentationsGrid.style.display = 'grid';
    }
}

// Modal functions
function showHelp() {
    document.getElementById('helpModal').style.display = 'block';
}

function showAbout() {
    alert('HTML Presentation System v2.0\nA modern, web-based presentation platform supporting multiple presentations with dashboard navigation.');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new PresentationDashboard();
});

// Keyboard shortcuts for modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="block"]');
        if (openModal) {
            openModal.style.display = 'none';
        }
    }
});