class PresentationDashboard {
    constructor() {
        this.presentations = [];
        this.filteredPresentations = [];
        this.currentView = 'grid';
        
        // Discovery configuration - optimized for minimal 404s
        this.discoveryConfig = {
            mode: 'conservative',  // 'conservative' (minimal 404s) or 'comprehensive' (finds all)
            maxRequests: 30,       // Strict limit to prevent console spam
            priorityOnly: false    // Set to true to only check known priority folders
        };
        
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
            
            // Check cache first for faster subsequent loads
            const cachedFolders = this.getCachedFolders();
            if (cachedFolders && cachedFolders.length > 0) {
                console.log(`🔄 Using cached folders: ${cachedFolders.length} folders`);
                
                // Process cached folders in parallel for faster loading
                const cachedResults = await Promise.allSettled(
                    cachedFolders.map(folderName => this.loadPresentationData(folderName))
                );
                
                cachedResults.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        presentations.push(result.value);
                    }
                });
                
                // If we got presentations from cache, use them and refresh in background
                if (presentations.length > 0) {
                    this.presentations = presentations;
                    this.filteredPresentations = [...presentations];
                    this.updatePresentationCount();
                    this.hideLoading();
                    
                    // Refresh discovery in background
                    this.refreshDiscoveryInBackground();
                    return;
                }
            }
            
            // Perform fast discovery with aggressive optimization
            const discoveryPromise = this.discoverPresentationFoldersFast();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Discovery timeout')), 15000) // Allow time for comprehensive scan
            );
            
            let discoveredFolders = [];
            try {
                discoveredFolders = await Promise.race([discoveryPromise, timeoutPromise]);
                this.cacheFolders(discoveredFolders); // Cache results
            } catch (error) {
                console.warn('Presentation discovery timed out, using fallback method');
                // Fallback to just checking our known presentations
                discoveredFolders = ['demo-presentation', 'business-presentation', 'tutorial-presentation'];
            }
            
            // Process discovered folders in parallel for much faster loading
            const results = await Promise.allSettled(
                discoveredFolders.map(folderName => this.loadPresentationData(folderName))
            );
            
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    presentations.push(result.value);
                }
            });

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

    async discoverPresentationFoldersFast() {
        console.log(`🚀 Starting ${this.discoveryConfig.mode.toUpperCase()} presentation discovery...`);
        const startTime = performance.now();
        
        // Strategy 1: Try to get directory listing directly (fastest if supported)
        let discoveredFolders = await this.tryDirectoryListing();
        
        if (discoveredFolders.length > 0) {
            const endTime = performance.now();
            console.log(`🎯 Directory listing found ${discoveredFolders.length} folders in ${Math.round(endTime - startTime)}ms`);
            return discoveredFolders;
        }

        // Strategy 2: Mode-based scanning
        if (this.discoveryConfig.mode === 'conservative') {
            console.log('📁 Using CONSERVATIVE scan (minimal 404s, finds common folders)...');
            discoveredFolders = await this.conservativeScan();
        } else {
            console.log('📁 Using COMPREHENSIVE scan (more 404s, finds all folders)...');
            discoveredFolders = await this.comprehensiveParallelScan();
        }

        const endTime = performance.now();
        console.log(`🎯 ${this.discoveryConfig.mode} discovery complete: Found ${discoveredFolders.length} folders in ${Math.round(endTime - startTime)}ms`);
        return discoveredFolders;
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
        
        // Streamlined regex patterns - focus on most common only
        const corePatterns = [
            /^(presentation|presentations?)(-|_|\d|$)/i,
            /^(slide|slides)(-|_|\d|$)/i,
            /^(deck|demo)(-|_|\d|$)/i,
            /^(project)(-|_|\d|$)/i
        ];

        console.log('🔍 Starting optimized regex-based folder scanning...');

        // Dramatically reduced candidate generation (50 vs 600+)
        const candidateFolders = this.generateCandidateFolders();
        console.log(`📝 Generated ${candidateFolders.length} candidate folders to test (optimized)`);
        
        // Process candidates in parallel batches for speed
        const batchSize = 6;
        for (let i = 0; i < candidateFolders.length; i += batchSize) {
            const batch = candidateFolders.slice(i, i + batchSize);
            
            const batchChecks = batch.map(async (folderName) => {
                // Quick pattern check first
                const matchesPattern = corePatterns.some(pattern => pattern.test(folderName));
                if (!matchesPattern) return null;
                
                const exists = await this.folderExistsFast(folderName);
                return exists ? folderName : null;
            });
            
            const batchResults = await Promise.allSettled(batchChecks);
            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    foundFolders.push(result.value);
                    console.log(`🎯 Regex match found: ${result.value}`);
                }
            });
        }

        console.log(`📊 Optimized regex scan complete: Found ${foundFolders.length} additional folders`);
        return foundFolders;
    }

    generateCandidateFolders() {
        const candidates = [];
        
        // Drastically reduced set - focus on most common patterns only
        const coreNames = ['presentation', 'slide', 'deck', 'demo', 'project'];

        // Generate only the most likely variations (reduced from 600+ to ~50)
        for (const base of coreNames) {
            // Just 1-3 numbered versions (most common)
            for (let i = 1; i <= 3; i++) {
                candidates.push(`${base}${i}`);
                candidates.push(`${base}-${i}`);
            }
            
            // Only current year (most relevant)
            const currentYear = new Date().getFullYear();
            candidates.push(`${base}-${currentYear}`);
        }

        // Add a few high-probability patterns
        const highProbability = [
            'my-presentation', 'test-presentation', 'new-slides',
            'main-presentation', 'sample-slides', 'example-deck'
        ];
        
        candidates.push(...highProbability);
        return [...new Set(candidates)]; // Remove duplicates - now ~50 instead of 600+
    }

    async systematicRegexScan(patterns, foundFolders) {
        // Streamlined systematic scan - only check most likely patterns
        const coreBases = ['presentation', 'slide', 'deck', 'demo'];

        const variations = [];
        for (const base of coreBases) {
            // Only the most common variations
            variations.push(
                base,
                `${base}s`, // plural
                `${base}-1`, `${base}-2`,
                `${base}1`, `${base}2`
            );
        }

        // Process variations in parallel batches
        const batchSize = 8;
        for (let i = 0; i < variations.length; i += batchSize) {
            const batch = variations.slice(i, i + batchSize);
            
            const batchChecks = batch.map(async (variation) => {
                if (foundFolders.includes(variation)) return null;
                
                const exists = await this.folderExistsFast(variation);
                if (!exists) return null;
                
                // Double-check it matches our patterns
                const matchesPattern = patterns.some(pattern => pattern.test(variation));
                return matchesPattern ? variation : null;
            });
            
            const batchResults = await Promise.allSettled(batchChecks);
            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    foundFolders.push(result.value);
                    console.log(`🔍 Systematic scan found: ${result.value}`);
                }
            });
        }
    }

    async folderExistsFast(folderName) {
        // Ultra-fast check - try the most common file patterns
        const testPaths = [
            `slides/${folderName}/config.json`,
            `slides/${folderName}/01-welcome.html`,  // Common pattern like demo-presentation
            `slides/${folderName}/01.html`,
            `slides/${folderName}/index.html`
        ];
        
        try {
            // Check both paths simultaneously with silent 404 handling
            const promises = testPaths.map(async (testPath) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 300); // Faster timeout
                
                try {
                    const response = await fetch(testPath, { 
                        signal: controller.signal,
                        method: 'GET',
                        // Add headers to potentially reduce server logging
                        headers: {
                            'Cache-Control': 'no-cache'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    // Only return true for actual success (200-299)
                    return response.status >= 200 && response.status < 300;
                } catch (error) {
                    clearTimeout(timeoutId);
                    // Silently handle all errors (including 404s)
                    return false;
                }
            });
            
            // Return true if ANY path succeeds
            const results = await Promise.allSettled(promises);
            return results.some(result => result.status === 'fulfilled' && result.value);
            
        } catch (error) {
            return false;
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
                    const timeoutMs = quickCheck ? 1000 : 2000; // Reduced timeouts
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
                    
                    // Use GET directly since server returns 405 for HEAD
                    const response = await fetch(path, { 
                        signal: controller.signal,
                        method: 'GET'
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        return true;
                    }
                } catch (error) {
                    // Continue to next path on any error
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

    async smartPatternScan() {
        console.log('🔍 Starting smart pattern scan...');
        const foundFolders = [];
        
        // Reduced set of most likely patterns based on common naming conventions
        const smartPatterns = [
            // Direct numbered variations (most common)
            'presentation1', 'presentation2', 'presentation3',
            'slides1', 'slides2', 'slides3',
            'deck1', 'deck2', 'demo1', 'demo2',
            
            // Hyphenated variations
            'presentation-demo', 'presentation-test', 'presentation-new',
            'slides-demo', 'slides-test', 'demo-slides',
            
            // Year-based (most likely current year)
            `presentation-${new Date().getFullYear()}`,
            `slides-${new Date().getFullYear()}`,
            `${new Date().getFullYear()}-presentation`,
            
            // Project patterns
            'project-demo', 'project-presentation', 'project1',
            
            // Common prefixes with separators
            'my-slides', 'test-presentation', 'main-presentation',
            'new-presentation', 'final-presentation'
        ];

        // Check patterns in parallel batches to avoid overwhelming the server
        const batchSize = 8; // Process 8 at a time
        for (let i = 0; i < smartPatterns.length; i += batchSize) {
            const batch = smartPatterns.slice(i, i + batchSize);
            
            const batchChecks = batch.map(async (pattern) => {
                const exists = await this.folderExistsFast(pattern);
                return exists ? pattern : null;
            });
            
            const batchResults = await Promise.allSettled(batchChecks);
            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    foundFolders.push(result.value);
                    console.log(`✅ Smart scan found: ${result.value}`);
                }
            });
            
            // Small delay between batches to be nice to the server
            if (i + batchSize < smartPatterns.length) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        console.log(`📊 Smart scan complete: Found ${foundFolders.length} additional folders`);
        return foundFolders;
    }

    // Caching methods for faster subsequent loads
    getCachedFolders() {
        try {
            const cached = localStorage.getItem('presentation_folders_cache');
            if (cached) {
                const data = JSON.parse(cached);
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                
                if (data.timestamp > fiveMinutesAgo) {
                    return data.folders;
                }
            }
        } catch (error) {
            console.log('Cache read error:', error);
        }
        return null;
    }

    cacheFolders(folders) {
        try {
            const cacheData = {
                folders: folders,
                timestamp: Date.now()
            };
            localStorage.setItem('presentation_folders_cache', JSON.stringify(cacheData));
            console.log(`📦 Cached ${folders.length} folders for faster loading`);
        } catch (error) {
            console.log('Cache write error:', error);
        }
    }

    async tryDirectoryListing() {
        try {
            // Try to fetch the slides directory index
            console.log('🔍 Attempting directory listing of slides/...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch('slides/', { 
                signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const html = await response.text();
                const folders = this.extractFoldersFromHTML(html);
                
                if (folders.length > 0) {
                    console.log(`✅ Directory listing found ${folders.length} potential folders:`, folders);
                    
                    // Verify these are actual presentation folders in parallel
                    const verificationPromises = folders.map(async (folder) => {
                        const isValid = await this.folderExistsFast(folder);
                        return isValid ? folder : null;
                    });
                    
                    const verificationResults = await Promise.allSettled(verificationPromises);
                    const validFolders = verificationResults
                        .filter(result => result.status === 'fulfilled' && result.value)
                        .map(result => result.value);
                    
                    return validFolders;
                }
            }
        } catch (error) {
            console.log('📁 Directory listing not available:', error.message);
        }
        
        return [];
    }

    extractFoldersFromHTML(html) {
        const folders = [];
        
        // Common patterns for directory listings
        const patterns = [
            // Apache/Nginx style
            /<a href="([^"]+)\/">/g,
            // IIS style
            /<A HREF="([^"]+)\/">/gi,
            // Generic link patterns
            /href="([^"\/]+)\/"[^>]*>([^<]+)/gi
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const folderName = match[1];
                
                // Filter out parent directory and hidden folders
                if (folderName && 
                    folderName !== '..' && 
                    folderName !== '.' && 
                    !folderName.startsWith('.') &&
                    folderName.match(/^[a-zA-Z0-9_-]+$/)) {
                    
                    folders.push(folderName);
                }
            }
        }
        
        return [...new Set(folders)]; // Remove duplicates
    }

    async comprehensiveParallelScan() {
        const discoveredFolders = [];
        
        // Strategy 1: Known patterns (high priority, parallel)
        console.log('📂 Step 1/4: Scanning known presentation patterns...');
        const knownPatterns = await this.scanKnownPatterns();
        discoveredFolders.push(...knownPatterns);
        
        // Early exit if we found folders and not in intensive mode
        if (discoveredFolders.length >= 3 && this.discoveryConfig.earlyExit && !this.discoveryConfig.intensiveMode) {
            console.log(`🎯 Found ${discoveredFolders.length} folders in first scan. Skipping intensive discovery to reduce 404 errors.`);
            console.log('💡 To find more presentations: Set discoveryConfig.intensiveMode = true or refresh manually.');
            return [...new Set(discoveredFolders)];
        }
        
        // Strategy 2: Conservative alphabet scan (only if few folders found)
        console.log('📂 Step 2/4: Conservative alphabet scan (limited to reduce 404s)...');
        const alphabetScan = await this.conservativeAlphabetScan(discoveredFolders);
        discoveredFolders.push(...alphabetScan);
        
        // Strategy 3: Word combinations (only if still few found)
        if (discoveredFolders.length < 2) {
            console.log('📂 Step 3/4: Scanning word combinations...');
            const wordCombinations = await this.scanWordCombinations(discoveredFolders);
            discoveredFolders.push(...wordCombinations);
        }
        
        // Strategy 4: Limited brute force (only as absolute last resort)
        if (discoveredFolders.length === 0) {
            console.log('📂 Step 4/4: Limited brute force scan (last resort)...');
            const bruteForceFolders = await this.limitedBruteForce(discoveredFolders);
            discoveredFolders.push(...bruteForceFolders);
        }
        
        return [...new Set(discoveredFolders)]; // Remove duplicates
    }

    async scanKnownPatterns() {
        console.log('🔍 Scanning known presentation patterns (optimized for fewer 404s)...');
        
        // Priority 1: Absolute highest priority (known existing folders)
        const absolutePriority = [
            'demo-presentation', 'business-presentation', 'tutorial-presentation'
        ];
        
        console.log('🎯 Testing critical folders:', absolutePriority);
        
        // Priority 2: Year-based patterns (most likely to exist)
        const currentYear = new Date().getFullYear();
        const yearBasedPatterns = [
            `project-${currentYear}`, `presentation-${currentYear}`, `slides-${currentYear}`, 
            `project-${currentYear - 1}`, `presentation-${currentYear - 1}`,
            `${currentYear}`, `${currentYear-1}`
        ];
        
        // Priority 3: Essential common patterns only (reduced set)
        const commonPatterns = [
            'presentation', 'presentations', 'slides', 'slide', 
            'demo', 'project', 'test', 'main'
        ];
        
        // Priority 4: Only most likely numbered patterns (reduced from 50 to 15)
        const numberedPatterns = [
            'presentation-1', 'presentation-2', 'presentation-3',
            'slides-1', 'slides-2', 'slides-3',
            'project-1', 'project-2', 'demo-1', 'demo-2'
        ];
        
        const foundFolders = [];
        let totalRequests = 0;
        
        // Scan in priority order with adaptive termination
        const priorityGroups = [
            { name: "Critical", patterns: absolutePriority, batchSize: 3, delay: 0 },
            { name: "Year-based", patterns: yearBasedPatterns, batchSize: 4, delay: 10 },
            { name: "Common", patterns: commonPatterns, batchSize: 4, delay: 15 },
            { name: "Numbered", patterns: numberedPatterns, batchSize: 5, delay: 25 }
        ];
        
        for (const group of priorityGroups) {
            console.log(`🔍 ${group.name} scan: ${group.patterns.length} patterns...`);
            
            for (let i = 0; i < group.patterns.length; i += group.batchSize) {
                const batch = group.patterns.slice(i, i + group.batchSize);
                
                const batchPromises = batch.map(async (pattern) => {
                    const exists = await this.folderExistsFast(pattern);
                    totalRequests += 2; // Each check tries 2 files
                    return exists ? pattern : null;
                });
                
                const results = await Promise.allSettled(batchPromises);
                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        foundFolders.push(result.value);
                        console.log(`✅ Found: ${result.value}`);
                    }
                });
                
                // Early termination if we found a good number
                if (foundFolders.length >= 5 && group.name !== "Critical") {
                    console.log(`🎯 Found ${foundFolders.length} folders, skipping remaining ${group.name} patterns to reduce 404s`);
                    break;
                }
                
                // Delay between batches
                if (i + group.batchSize < group.patterns.length && group.delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, group.delay));
                }
            }
            
            // Skip less important groups if we have enough folders
            if (foundFolders.length >= 4 && group.name === "Year-based") {
                console.log(`🎯 Found ${foundFolders.length} folders, skipping lower-priority scans to reduce network requests`);
                break;
            }
        }
        
        console.log(`✅ Pattern scan complete: ${foundFolders.length} folders found with ~${totalRequests} requests`);
        return foundFolders;
    }

    async conservativeAlphabetScan(excludeFolders) {
        console.log('🔍 Conservative alphabet scan (limited to reduce 404s)...');
        
        const candidates = [];
        
        // Only most common single letters (reduced from 26 to 8)
        const commonLetters = ['a', 'b', 'c', 'd', 'm', 'p', 't', 'x'];
        candidates.push(...commonLetters);
        
        // Only most likely numbered combinations (reduced from 130 to 20)
        const likelyNumbers = ['a1', 'b1', 'c1', 'd1', 'p1', 't1', 'x1', 'z1', 'a2', 'b2'];
        candidates.push(...likelyNumbers);
        
        // Filter out already found folders
        const newCandidates = candidates.filter(c => !excludeFolders.includes(c));
        
        console.log(`🔍 Testing ${newCandidates.length} conservative candidates (vs ${26*5} in full scan)`);
        
        // Process in smaller batches with delays to be server-friendly
        const batchSize = 5;
        const foundFolders = [];
        
        for (let i = 0; i < newCandidates.length; i += batchSize) {
            const batch = newCandidates.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (candidate) => {
                const exists = await this.folderExistsFast(candidate);
                return exists ? candidate : null;
            });
            
            const results = await Promise.allSettled(batchPromises);
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    foundFolders.push(result.value);
                    console.log(`✅ Conservative scan found: ${result.value}`);
                }
            });
            
            // Small delay to be server-friendly
            if (i + batchSize < newCandidates.length) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        console.log(`✅ Conservative scan found: ${foundFolders.length} additional folders`);
        return foundFolders;
    }

    async scanWordCombinations(excludeFolders) {
        console.log('🔍 Conservative word combinations scan...');
        
        // Reduced sets to minimize requests
        const words = ['my', 'new', 'final', 'temp']; // Reduced from 12 to 4
        const bases = ['presentation', 'slides', 'project']; // Reduced from 5 to 3
        
        const combinations = [];
        
        // Only most common word + base combinations
        for (const word of words) {
            for (const base of bases) {
                combinations.push(`${word}-${base}`);
                combinations.push(`${base}-${word}`);
                // Skip underscore variants to reduce requests by 50%
            }
        }
        
        // Filter out already found
        const newCombinations = combinations.filter(c => !excludeFolders.includes(c));
        
        console.log(`🔍 Testing ${newCombinations.length} word combinations (reduced from ${12*5*4} possible)`);
        
        // Process in smaller batches with delays
        const batchSize = 6;
        const foundFolders = [];
        
        for (let i = 0; i < newCombinations.length; i += batchSize) {
            const batch = newCombinations.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (combination) => {
                const exists = await this.folderExistsFast(combination);
                return exists ? combination : null;
            });
            
            const results = await Promise.allSettled(batchPromises);
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    foundFolders.push(result.value);
                    console.log(`✅ Word combination found: ${result.value}`);
                }
            });
            
            // Delay between batches
            if (i + batchSize < newCombinations.length) {
                await new Promise(resolve => setTimeout(resolve, 75));
            }
        }
        
        console.log(`✅ Word combinations found: ${foundFolders.length} additional folders`);
        return foundFolders;
    }

    async limitedBruteForce(excludeFolders) {
        console.log('🔍 Limited brute force scan (only essential patterns)...');
        
        // Very limited set - only the most essential patterns that weren't covered
        const essentialCandidates = [
            // Numbers only
            '1', '2', '3', '4', '5',
            // Very common abbreviations
            'tmp', 'temp', 'new', 'old', 'web', 'app', 'api',
            // Common single/double letters
            'aa', 'bb', 'cc', 'dd', 'xx', 'yy', 'zz'
        ];
        
        // Filter out already found
        const newCandidates = essentialCandidates.filter(c => !excludeFolders.includes(c));
        
        console.log(`🔍 Testing only ${newCandidates.length} essential candidates (vs 1000+ in full brute force)`);
        
        const foundFolders = [];
        
        // Process in small batches with delays
        const batchSize = 3;
        
        for (let i = 0; i < newCandidates.length; i += batchSize) {
            const batch = newCandidates.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (candidate) => {
                const exists = await this.folderExistsFast(candidate);
                return exists ? candidate : null;
            });
            
            const results = await Promise.allSettled(batchPromises);
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    foundFolders.push(result.value);
                    console.log(`🎯 Limited brute force found: ${result.value}`);
                }
            });
            
            // Delay between batches
            if (i + batchSize < newCandidates.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`✅ Limited brute force found: ${foundFolders.length} additional folders`);
        return foundFolders;
    }

    async conservativeScan() {
        const discoveredFolders = [];
        let requestCount = 0;
        
        // Step 1: Test only the most essential known folders (minimizes 404s)
        const essentialFolders = [
            'demo-presentation', 'business-presentation', 'tutorial-presentation',
            'project-2024', 'presentation', 'slides', 'demo', 'project'
        ];
        
        console.log(`🔍 Conservative Step 1: Testing ${essentialFolders.length} essential folders...`);
        
        for (const folder of essentialFolders) {
            console.log(`🔎 Testing: ${folder}...`);
            const exists = await this.folderExistsFast(folder);
            requestCount += 2; // Each check tries 2 files
            
            if (exists) {
                discoveredFolders.push(folder);
                console.log(`✅ Found: ${folder}`);
            } else {
                console.log(`❌ Not found: ${folder}`);
            }
            
            // Stop if we hit request limit
            if (requestCount >= this.discoveryConfig.maxRequests) {
                console.log(`🛑 Request limit reached (${requestCount}), stopping discovery`);
                break;
            }
        }
        
        // Step 2: If we found very few, try a minimal set of additional patterns
        if (discoveredFolders.length <= 1 && requestCount < this.discoveryConfig.maxRequests) {
            console.log('🔍 Conservative Step 2: Testing minimal additional patterns...');
            
            const minimalAdditional = [
                'presentation-1', 'slides-1', 'demo-1', 'project-1',
                'my-presentation', 'new-presentation', 'test-presentation'
            ];
            
            for (const folder of minimalAdditional) {
                if (requestCount >= this.discoveryConfig.maxRequests) break;
                
                const exists = await this.folderExistsFast(folder);
                requestCount += 2;
                
                if (exists) {
                    discoveredFolders.push(folder);
                    console.log(`✅ Found: ${folder}`);
                }
            }
        }
        
        console.log(`✅ Conservative scan complete: ${discoveredFolders.length} folders found with ${requestCount} requests`);
        return discoveredFolders;
    }

    async refreshDiscoveryInBackground() {
        // Refresh discovery without blocking UI
        setTimeout(async () => {
            try {
                const freshFolders = await this.discoverPresentationFoldersFast();
                this.cacheFolders(freshFolders);
                console.log('🔄 Background refresh completed');
            } catch (error) {
                console.log('Background refresh failed:', error);
            }
        }, 1000);
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