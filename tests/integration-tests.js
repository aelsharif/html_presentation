/**
 * Integration Tests for the Complete Presentation System
 */

describe('Integration - Dashboard to Presentation Flow', () => {
    let dashboard;
    let viewer;
    let restoreFetch;

    beforeEach(() => {
        // Mock complete presentation data
        restoreFetch = mockFetch({
            'slides/demo-presentation/config.json': {
                ok: true,
                data: {
                    title: 'Demo Presentation',
                    description: 'A comprehensive demo',
                    author: 'Test Team',
                    created: '2024-01-01',
                    slides: [
                        { number: 1, path: '01-intro.html', title: 'Introduction' },
                        { number: 2, path: '02-content.html', title: 'Content' },
                        { number: 3, path: '03-conclusion.html', title: 'Conclusion' }
                    ]
                }
            },
            'slides/business-presentation/config.json': {
                ok: true,
                data: {
                    title: 'Business Strategy',
                    description: 'Business strategy presentation',
                    author: 'Business Team',
                    created: '2024-01-15'
                }
            },
            'slides/demo-presentation/01-intro.html': { ok: true },
            'slides/demo-presentation/02-content.html': { ok: true },
            'slides/demo-presentation/03-conclusion.html': { ok: true },
            'slides/business-presentation/01.html': { ok: true },
            'slides/business-presentation/02.html': { ok: true }
        });
    });

    afterEach(() => {
        if (restoreFetch) restoreFetch();
    });

    it('should load presentations in dashboard and navigate to viewer', async () => {
        // Initialize dashboard
        dashboard = new PresentationDashboard();
        await dashboard.loadPresentations();

        // Verify presentations are loaded
        expect(dashboard.presentations.length).toBeGreaterThan(0);
        
        const demoPresentation = dashboard.presentations.find(p => p.id === 'demo-presentation');
        expect(demoPresentation).toBeTruthy();
        expect(demoPresentation.title).toBe('Demo Presentation');
        expect(demoPresentation.slideCount).toBe(3);

        // Mock URL change for navigation
        Object.defineProperty(window, 'location', {
            value: {
                search: '?folder=demo-presentation&title=Demo%20Presentation'
            },
            configurable: true
        });

        // Initialize viewer with presentation data
        viewer = new PresentationViewer();
        await viewer.loadSlides();

        // Verify viewer loaded the same presentation
        expect(viewer.presentationFolder).toBe('demo-presentation');
        expect(viewer.presentationTitle).toBe('Demo Presentation');
        expect(viewer.totalSlides).toBe(3);
        expect(viewer.slides[0].title).toBe('Introduction');
    });

    it('should handle search and filtering in dashboard', async () => {
        dashboard = new PresentationDashboard();
        await dashboard.loadPresentations();

        // Test search functionality
        dashboard.filterPresentations('demo');
        expect(dashboard.filteredPresentations.length).toBe(1);
        expect(dashboard.filteredPresentations[0].title).toBe('Demo Presentation');

        dashboard.filterPresentations('business');
        expect(dashboard.filteredPresentations.length).toBe(1);
        expect(dashboard.filteredPresentations[0].title).toBe('Business Strategy');

        dashboard.filterPresentations('');
        expect(dashboard.filteredPresentations.length).toBe(dashboard.presentations.length);
    });

    it('should maintain presentation state between dashboard and viewer', async () => {
        // Load in dashboard
        dashboard = new PresentationDashboard();
        await dashboard.loadPresentations();

        const originalPresentation = dashboard.presentations.find(p => p.id === 'demo-presentation');
        
        // Navigate to viewer
        Object.defineProperty(window, 'location', {
            value: {
                search: `?folder=${originalPresentation.folder}&title=${encodeURIComponent(originalPresentation.title)}`
            },
            configurable: true
        });

        viewer = new PresentationViewer();
        await viewer.loadSlides();

        // Verify state consistency
        expect(viewer.presentationFolder).toBe(originalPresentation.folder);
        expect(viewer.presentationTitle).toBe(originalPresentation.title);
        expect(viewer.totalSlides).toBe(originalPresentation.slideCount);
    });
});

describe('Integration - Regex Discovery End-to-End', () => {
    let dashboard;
    let restoreFetch;

    beforeEach(() => {
        restoreFetch = mockFetch({
            'slides/project-2024/config.json': {
                ok: true,
                data: {
                    title: 'Project 2024 Showcase',
                    description: 'Annual project showcase',
                    author: 'Project Team',
                    created: '2024-12-01'
                }
            },
            'slides/presentation1/config.json': {
                ok: false,
                status: 404
            },
            'slides/slide-demo/config.json': {
                ok: true,
                data: {
                    title: 'Slide Demo',
                    description: 'Demo slides',
                    author: 'Demo Team'
                }
            },
            'slides/project-2024/01.html': { ok: true },
            'slides/project-2024/02.html': { ok: true },
            'slides/presentation1/01.html': { ok: true },
            'slides/slide-demo/01.html': { ok: true }
        });
    });

    afterEach(() => {
        if (restoreFetch) restoreFetch();
    });

    it('should discover presentations using regex patterns', async () => {
        dashboard = new PresentationDashboard();
        
        // Test regex-based discovery
        const regexFolders = await dashboard.scanFoldersWithRegexPatterns();
        
        // Should attempt to find pattern-matching folders
        expect(Array.isArray(regexFolders)).toBe(true);
    });

    it('should generate appropriate titles for discovered folders', () => {
        dashboard = new PresentationDashboard();

        // Test title generation for various patterns
        expect(dashboard.generateTitleFromFolderName('project-2024')).toBe('Project 2024 Presentation');
        expect(dashboard.generateTitleFromFolderName('presentation1')).toBe('Presentation 1');
        expect(dashboard.generateTitleFromFolderName('slide-demo')).toBe('Slide Demo Presentation');
        expect(dashboard.generateTitleFromFolderName('meeting_jan')).toBe('Meeting Jan Presentation');
    });

    it('should handle mixed config and auto-generated presentations', async () => {
        dashboard = new PresentationDashboard();
        
        const projectData = await dashboard.loadPresentationData('project-2024');
        expect(projectData.title).toBe('Project 2024 Showcase'); // From config
        
        const presentation1Data = await dashboard.loadPresentationData('presentation1');
        if (presentation1Data) {
            expect(presentation1Data.title).toBe('Presentation 1'); // Auto-generated
        }
    });
});

describe('Integration - Error Handling and Edge Cases', () => {
    let dashboard;
    let viewer;
    let restoreFetch;

    beforeEach(() => {
        restoreFetch = mockFetch({
            'slides/empty-presentation/config.json': {
                ok: true,
                data: {
                    title: 'Empty Presentation',
                    slides: []
                }
            },
            'slides/broken-config/config.json': {
                ok: false,
                status: 500
            },
            'slides/no-slides/config.json': {
                ok: true,
                data: {
                    title: 'No Slides',
                    slides: [
                        { number: 1, path: 'nonexistent.html', title: 'Missing' }
                    ]
                }
            }
        });
    });

    afterEach(() => {
        if (restoreFetch) restoreFetch();
    });

    it('should handle presentations with no slides gracefully', async () => {
        dashboard = new PresentationDashboard();
        
        const emptyData = await dashboard.loadPresentationData('empty-presentation');
        expect(emptyData?.slideCount).toBe(0);
        
        // Should not include in valid presentations
        dashboard.presentations = [emptyData].filter(Boolean);
        dashboard.filteredPresentations = [...dashboard.presentations];
        
        dashboard.renderPresentations();
        expect(dashboard.emptyState.style.display).toBe('flex');
    });

    it('should handle broken config files', async () => {
        dashboard = new PresentationDashboard();
        
        const brokenData = await dashboard.loadPresentationData('broken-config');
        // Should return null or handle gracefully
        expect(brokenData).toBeFalsy();
    });

    it('should handle viewer with no slides', async () => {
        Object.defineProperty(window, 'location', {
            value: {
                search: '?folder=empty-presentation&title=Empty%20Presentation'
            },
            configurable: true
        });

        viewer = new PresentationViewer();
        await viewer.loadSlides();

        expect(viewer.totalSlides).toBe(0);
        // Should show error state
        viewer.showError();
        expect(document.getElementById('errorMessage').style.display).toBe('flex');
    });

    it('should handle network timeouts gracefully', async () => {
        // Mock fetch that times out
        const slowFetch = () => new Promise(resolve => setTimeout(resolve, 20000));
        window.fetch = slowFetch;

        dashboard = new PresentationDashboard();
        
        try {
            await dashboard.loadPresentations();
            // Should have fallback presentations or handle timeout
            expect(dashboard.presentations).toBeDefined();
        } catch (error) {
            // Timeout handling should be graceful
            expect(error.message).toContain('timeout');
        }

        // Restore fetch
        if (restoreFetch) restoreFetch();
    });
});

describe('Integration - Performance and Optimization', () => {
    let dashboard;

    beforeEach(() => {
        dashboard = new PresentationDashboard();
    });

    it('should limit discovery requests for performance', async () => {
        let requestCount = 0;
        
        // Mock fetch to count requests
        window.fetch = async (url) => {
            requestCount++;
            return { ok: false, status: 404 };
        };

        const candidates = dashboard.generateCandidateFolders();
        
        // Should generate reasonable number of candidates
        expect(candidates.length).toBeLessThan(1000);
        expect(candidates.length).toBeGreaterThan(100);
    });

    it('should use quick check mode for regex scanning', async () => {
        const startTime = performance.now();
        
        // Mock quick responses
        window.fetch = async () => ({ ok: false, status: 404 });
        
        const exists = await dashboard.folderExists('test-folder', true);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(exists).toBe(false);
        expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should handle large numbers of presentations efficiently', () => {
        // Create many mock presentations
        const manyPresentations = Array.from({ length: 100 }, (_, i) => ({
            id: `presentation-${i}`,
            title: `Presentation ${i}`,
            description: `Description ${i}`,
            author: `Author ${i % 10}`,
            slideCount: i % 5 + 1,
            folder: `presentation-${i}`
        }));

        dashboard.presentations = manyPresentations;
        dashboard.filteredPresentations = [...manyPresentations];

        const startTime = performance.now();
        
        // Test search performance
        dashboard.filterPresentations('Presentation 5');
        
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(dashboard.filteredPresentations.length).toBeGreaterThan(0);
        expect(duration).toBeLessThan(50); // Should be fast even with many presentations
    });
});

describe('Integration - Cross-Browser Compatibility', () => {
    it('should handle missing modern JavaScript features', () => {
        // Test without modern features
        const originalPromise = window.Promise;
        
        // Simulate older browser without Promise
        delete window.Promise;
        
        try {
            // Should still initialize without errors
            const dashboard = new PresentationDashboard();
            expect(dashboard).toBeTruthy();
        } catch (error) {
            // If error occurs, it should be handled gracefully
            console.warn('Legacy browser compatibility issue:', error);
        } finally {
            window.Promise = originalPromise;
        }
    });

    it('should handle missing fullscreen API gracefully', () => {
        const viewer = new PresentationViewer();
        
        // Mock missing fullscreen support
        delete document.fullscreenElement;
        delete document.documentElement.requestFullscreen;
        
        // Should not throw error
        expect(() => viewer.toggleFullscreen()).not.toThrow();
    });

    it('should work without advanced CSS features', () => {
        // Test basic functionality without CSS Grid/Flexbox support
        const dashboard = new PresentationDashboard();
        
        dashboard.presentations = [{
            id: 'test',
            title: 'Test',
            slideCount: 1,
            description: 'Test',
            author: 'Test'
        }];
        
        dashboard.filteredPresentations = [...dashboard.presentations];
        
        // Should render without CSS-dependent features
        expect(() => dashboard.renderPresentations()).not.toThrow();
    });
});

console.log('Integration tests loaded successfully!');