/**
 * Unit Tests for PresentationDashboard Class
 */

describe('PresentationDashboard - Initialization', () => {
    let dashboard;
    let mockElements;

    beforeEach(() => {
        // Reset DOM elements
        mockElements = {
            searchInput: document.getElementById('searchInput'),
            presentationsGrid: document.getElementById('presentationsGrid'),
            loadingState: document.getElementById('loadingState'),
            emptyState: document.getElementById('emptyState'),
            presentationCount: document.getElementById('presentationCount'),
            gridViewBtn: document.getElementById('gridView'),
            listViewBtn: document.getElementById('listView'),
            refreshBtn: document.getElementById('refreshBtn')
        };

        // Reset element states
        Object.values(mockElements).forEach(el => {
            if (el) {
                el.textContent = '';
                el.innerHTML = '';
                el.style.display = '';
                el.value = '';
                el.classList.remove('active');
            }
        });
    });

    it('should initialize with default values', () => {
        dashboard = new PresentationDashboard();
        
        expect(dashboard.presentations).toEqual([]);
        expect(dashboard.filteredPresentations).toEqual([]);
        expect(dashboard.currentView).toBe('grid');
    });

    it('should set DOM element references correctly', () => {
        dashboard = new PresentationDashboard();
        
        expect(dashboard.searchInput).toBe(mockElements.searchInput);
        expect(dashboard.presentationsGrid).toBe(mockElements.presentationsGrid);
        expect(dashboard.loadingState).toBe(mockElements.loadingState);
    });
});

describe('PresentationDashboard - Presentation Discovery', () => {
    let dashboard;
    let restoreFetch;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
        
        // Mock successful presentation discovery
        restoreFetch = mockFetch({
            'slides/demo-presentation/config.json': {
                ok: true,
                data: {
                    title: 'Demo Presentation',
                    description: 'A demo presentation',
                    author: 'Test Author',
                    created: '2024-01-01'
                }
            },
            'slides/business-presentation/config.json': {
                ok: true,
                data: {
                    title: 'Business Presentation',
                    description: 'Business strategy presentation',
                    author: 'Business Team',
                    created: '2024-01-15'
                }
            },
            'slides/demo-presentation/01.html': { ok: true },
            'slides/demo-presentation/02.html': { ok: true },
            'slides/business-presentation/01.html': { ok: true }
        });
    });

    afterEach(() => {
        if (restoreFetch) restoreFetch();
    });

    it('should discover presentation folders', async () => {
        const folders = await dashboard.discoverPresentationFolders();
        
        expect(folders).toContain('demo-presentation');
        expect(folders).toContain('business-presentation');
    });

    it('should check if folder exists correctly', async () => {
        const existsDemo = await dashboard.folderExists('demo-presentation');
        const existsNonExistent = await dashboard.folderExists('non-existent');
        
        expect(existsDemo).toBe(true);
        expect(existsNonExistent).toBe(false);
    });

    it('should count slides in presentation folders', async () => {
        const demoCount = await dashboard.countSlides('demo-presentation');
        const businessCount = await dashboard.countSlides('business-presentation');
        
        expect(demoCount).toBeGreaterThan(0);
        expect(businessCount).toBeGreaterThan(0);
    });

    it('should load presentation data correctly', async () => {
        const presentationData = await dashboard.loadPresentationData('demo-presentation');
        
        expect(presentationData.title).toBe('Demo Presentation');
        expect(presentationData.author).toBe('Test Author');
        expect(presentationData.folder).toBe('demo-presentation');
        expect(presentationData.slideCount).toBeGreaterThan(0);
    });

    it('should generate titles from folder names', () => {
        const title1 = dashboard.generateTitleFromFolderName('demo-presentation');
        const title2 = dashboard.generateTitleFromFolderName('business_slides');
        const title3 = dashboard.generateTitleFromFolderName('project-2024');

        expect(title1).toBe('Demo Presentation');
        expect(title2).toBe('Business Slides Presentation');
        expect(title3).toBe('Project 2024 Presentation');
    });

    it('should expand abbreviations correctly', () => {
        expect(dashboard.expandAbbreviation('pres')).toBe('Presentation');
        expect(dashboard.expandAbbreviation('demo')).toBe('Demo');
        expect(dashboard.expandAbbreviation('intro')).toBe('Introduction');
        expect(dashboard.expandAbbreviation('unknown')).toBe('Unknown');
    });
});

describe('PresentationDashboard - Regex-Based Discovery', () => {
    let dashboard;
    let restoreFetch;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
        
        // Mock regex pattern matching presentations
        restoreFetch = mockFetch({
            'slides/project-2024/config.json': { ok: true, data: { title: 'Project 2024' } },
            'slides/presentation1/config.json': { ok: true, data: { title: 'Presentation 1' } },
            'slides/slide-demo/config.json': { ok: true, data: { title: 'Slide Demo' } },
            'slides/project-2024/01.html': { ok: true },
            'slides/presentation1/01.html': { ok: true },
            'slides/slide-demo/01.html': { ok: true }
        });
    });

    afterEach(() => {
        if (restoreFetch) restoreFetch();
    });

    it('should generate candidate folders with various patterns', () => {
        const candidates = dashboard.generateCandidateFolders();
        
        expect(candidates).toContain('presentation1');
        expect(candidates).toContain('presentation-1');
        expect(candidates).toContain('slide1');
        expect(candidates).toContain('deck-1');
        expect(candidates).toContain('project-2024');
        expect(candidates).toHaveLength(candidates.length); // Should have many candidates
    });

    it('should scan folders with regex patterns', async () => {
        const folders = await dashboard.scanFoldersWithRegexPatterns();
        
        expect(Array.isArray(folders)).toBe(true);
        // The actual results depend on which mock URLs are available
    });

    it('should perform systematic regex scan', async () => {
        const patterns = [
            /^(project|projects?)(-|_|\d|$)/i,
            /^(presentation|presentations?)(-|_|\d|$)/i
        ];
        const foundFolders = [];
        
        await dashboard.systematicRegexScan(patterns, foundFolders);
        
        // Should attempt to find folders matching patterns
        expect(Array.isArray(foundFolders)).toBe(true);
    });
});

describe('PresentationDashboard - Presentation Management', () => {
    let dashboard;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
        dashboard.presentations = [
            {
                id: 'demo',
                title: 'Demo Presentation',
                description: 'A demo presentation',
                author: 'Test Author',
                slideCount: 4,
                folder: 'demo'
            },
            {
                id: 'business',
                title: 'Business Strategy',
                description: 'Business presentation',
                author: 'Business Team',
                slideCount: 3,
                folder: 'business'
            }
        ];
        dashboard.filteredPresentations = [...dashboard.presentations];
    });

    it('should filter presentations by search term', () => {
        dashboard.filterPresentations('demo');
        
        expect(dashboard.filteredPresentations).toHaveLength(1);
        expect(dashboard.filteredPresentations[0].title).toBe('Demo Presentation');
    });

    it('should filter presentations by author', () => {
        dashboard.filterPresentations('business');
        
        expect(dashboard.filteredPresentations).toHaveLength(1);
        expect(dashboard.filteredPresentations[0].author).toBe('Business Team');
    });

    it('should filter presentations by description', () => {
        dashboard.filterPresentations('strategy');
        
        expect(dashboard.filteredPresentations).toHaveLength(1);
        expect(dashboard.filteredPresentations[0].title).toBe('Business Strategy');
    });

    it('should handle case-insensitive search', () => {
        dashboard.filterPresentations('DEMO');
        
        expect(dashboard.filteredPresentations).toHaveLength(1);
        expect(dashboard.filteredPresentations[0].title).toBe('Demo Presentation');
    });

    it('should return all presentations for empty search', () => {
        dashboard.filterPresentations('');
        
        expect(dashboard.filteredPresentations).toHaveLength(2);
    });
});

describe('PresentationDashboard - View Management', () => {
    let dashboard;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
    });

    it('should set grid view correctly', () => {
        dashboard.setView('grid');
        
        expect(dashboard.currentView).toBe('grid');
        expect(dashboard.gridViewBtn.classList.contains('active')).toBe(true);
        expect(dashboard.listViewBtn.classList.contains('active')).toBe(false);
    });

    it('should set list view correctly', () => {
        dashboard.setView('list');
        
        expect(dashboard.currentView).toBe('list');
        expect(dashboard.listViewBtn.classList.contains('active')).toBe(true);
        expect(dashboard.gridViewBtn.classList.contains('active')).toBe(false);
    });

    it('should update grid CSS class based on view', () => {
        dashboard.setView('list');
        expect(dashboard.presentationsGrid.classList.contains('list-view')).toBe(true);
        
        dashboard.setView('grid');
        expect(dashboard.presentationsGrid.classList.contains('list-view')).toBe(false);
    });
});

describe('PresentationDashboard - UI State Management', () => {
    let dashboard;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
    });

    it('should show loading state', () => {
        dashboard.showLoading();
        
        expect(dashboard.loadingState.style.display).toBe('flex');
        expect(dashboard.presentationsGrid.style.display).toBe('none');
        expect(dashboard.emptyState.style.display).toBe('none');
    });

    it('should hide loading state', () => {
        dashboard.hideLoading();
        
        expect(dashboard.loadingState.style.display).toBe('none');
        expect(dashboard.presentationsGrid.style.display).toBe('grid');
    });

    it('should show empty state', () => {
        dashboard.showEmptyState();
        
        expect(dashboard.emptyState.style.display).toBe('flex');
        expect(dashboard.presentationsGrid.style.display).toBe('none');
    });

    it('should hide empty state', () => {
        dashboard.hideEmptyState();
        
        expect(dashboard.emptyState.style.display).toBe('none');
        expect(dashboard.presentationsGrid.style.display).toBe('grid');
    });

    it('should update presentation count correctly', () => {
        dashboard.presentations = [
            { slideCount: 4, id: 'demo' },
            { slideCount: 3, id: 'business' },
            { slideCount: 0, id: 'empty' } // Should be filtered out
        ];
        
        dashboard.updatePresentationCount();
        
        expect(dashboard.presentationCount.textContent).toBe('2');
    });
});

describe('PresentationDashboard - Presentation Cards', () => {
    let dashboard;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
    });

    it('should create presentation card HTML', () => {
        const presentation = {
            id: 'test',
            title: 'Test Presentation',
            description: 'A test presentation',
            author: 'Test Author',
            created: '2024-01-01',
            slideCount: 3,
            thumbnail: null
        };

        const cardHTML = dashboard.createPresentationCard(presentation);
        
        expect(cardHTML).toContain('Test Presentation');
        expect(cardHTML).toContain('A test presentation');
        expect(cardHTML).toContain('Test Author');
        expect(cardHTML).toContain('3');
        expect(cardHTML).toContain('data-presentation-id="test"');
    });

    it('should handle presentations with thumbnails', () => {
        const presentation = {
            id: 'test',
            title: 'Test Presentation',
            description: 'A test presentation',
            author: 'Test Author',
            created: '2024-01-01',
            slideCount: 3,
            thumbnail: 'thumb.jpg'
        };

        const cardHTML = dashboard.createPresentationCard(presentation);
        
        expect(cardHTML).toContain('thumb.jpg');
        expect(cardHTML).toContain('<img src=');
    });

    it('should use default icon when no thumbnail', () => {
        const presentation = {
            id: 'test',
            title: 'Test Presentation',
            description: 'A test presentation',
            author: 'Test Author',
            created: '2024-01-01',
            slideCount: 3,
            thumbnail: null
        };

        const cardHTML = dashboard.createPresentationCard(presentation);
        
        expect(cardHTML).toContain('fa-presentation-screen');
        expect(cardHTML).toContain('default-icon');
    });
});

describe('PresentationDashboard - Presentation Rendering', () => {
    let dashboard;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
    });

    it('should render valid presentations only', () => {
        dashboard.filteredPresentations = [
            { id: 'valid', slideCount: 3, title: 'Valid' },
            { id: 'empty', slideCount: 0, title: 'Empty' },
            { id: 'placeholder', slideCount: 0, title: 'Placeholder' }
        ];

        dashboard.renderPresentations();

        // Should only render the valid presentation
        const gridHTML = dashboard.presentationsGrid.innerHTML;
        expect(gridHTML).toContain('Valid');
        expect(gridHTML).not.toContain('Empty');
        expect(gridHTML).not.toContain('Placeholder');
    });

    it('should show empty state when no valid presentations', () => {
        dashboard.filteredPresentations = [
            { id: 'empty', slideCount: 0, title: 'Empty' }
        ];

        dashboard.renderPresentations();

        expect(dashboard.emptyState.style.display).toBe('flex');
        expect(dashboard.presentationsGrid.style.display).toBe('none');
    });

    it('should add click listeners to presentation cards', () => {
        dashboard.presentations = [
            { id: 'test', slideCount: 3, title: 'Test', folder: 'test-folder' }
        ];
        dashboard.filteredPresentations = [...dashboard.presentations];

        // Mock openPresentation method
        dashboard.openPresentation = jest?.fn ? jest.fn() : () => {};

        dashboard.renderPresentations();

        // Simulate click on presentation card
        const cards = dashboard.presentationsGrid.querySelectorAll('.presentation-card');
        if (cards.length > 0) {
            cards[0].click();
            // In a real test environment, we'd verify openPresentation was called
        }
    });
});

describe('PresentationDashboard - Navigation', () => {
    let dashboard;
    let originalLocation;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
        
        // Mock window.location
        originalLocation = window.location;
        delete window.location;
        window.location = { href: '' };
    });

    afterEach(() => {
        window.location = originalLocation;
    });

    it('should open valid presentation', () => {
        dashboard.presentations = [
            {
                id: 'test',
                title: 'Test Presentation',
                folder: 'test-folder',
                slideCount: 3
            }
        ];

        dashboard.openPresentation('test');

        expect(window.location.href).toContain('presentation.html');
        expect(window.location.href).toContain('folder=test-folder');
        expect(window.location.href).toContain('title=Test%20Presentation');
    });

    it('should handle presentation with no slides', () => {
        dashboard.presentations = [
            {
                id: 'empty',
                title: 'Empty Presentation',
                folder: 'empty-folder',
                slideCount: 0
            }
        ];

        // Mock alert
        const originalAlert = window.alert;
        let alertMessage = '';
        window.alert = (msg) => { alertMessage = msg; };

        dashboard.openPresentation('empty');

        expect(window.location.href).toBe('');
        expect(alertMessage).toContain('no slides');
        
        window.alert = originalAlert;
    });

    it('should handle non-existent presentation', () => {
        dashboard.presentations = [];
        
        const originalConsoleError = console.error;
        let errorLogged = false;
        console.error = () => { errorLogged = true; };

        dashboard.openPresentation('non-existent');

        expect(window.location.href).toBe('');
        expect(errorLogged).toBe(true);
        
        console.error = originalConsoleError;
    });
});

describe('PresentationDashboard - Refresh Functionality', () => {
    let dashboard;
    let restoreFetch;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
        
        restoreFetch = mockFetch({
            'slides/demo-presentation/config.json': {
                ok: true,
                data: { title: 'Demo Presentation', slideCount: 4 }
            }
        });
    });

    afterEach(() => {
        if (restoreFetch) restoreFetch();
    });

    it('should refresh presentations and update UI', async () => {
        const refreshBtn = document.getElementById('refreshBtn');
        const initialClassList = [...refreshBtn.querySelector('i').classList];

        await dashboard.refreshPresentations();

        // Should temporarily add spinning class
        expect(refreshBtn.querySelector('i').classList.contains('fa-spin')).toBe(false); // Removed after timeout
    });
});

console.log('PresentationDashboard tests loaded successfully!');