/**
 * Unit Tests for PresentationViewer Class
 */

describe('PresentationViewer - Initialization', () => {
    let viewer;
    let mockElements;

    beforeEach(() => {
        // Reset DOM elements
        mockElements = {
            slideFrame: document.getElementById('slideFrame'),
            currentSlideSpan: document.getElementById('currentSlide'),
            totalSlidesSpan: document.getElementById('totalSlides'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            dashboardBtn: document.getElementById('dashboardBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            loadingMessage: document.getElementById('loadingMessage'),
            errorMessage: document.getElementById('errorMessage'),
            slideThumbnails: document.getElementById('slideThumbnails'),
            presentationTitleEl: document.getElementById('presentationTitle')
        };

        // Reset element states
        Object.values(mockElements).forEach(el => {
            if (el) {
                el.textContent = '';
                el.innerHTML = '';
                el.style.display = '';
                el.disabled = false;
            }
        });

        // Mock URL parameters
        delete window.URLSearchParams;
        window.URLSearchParams = class {
            constructor(search) {
                this.params = new Map();
                if (search === '?folder=test-presentation&title=Test%20Presentation') {
                    this.params.set('folder', 'test-presentation');
                    this.params.set('title', 'Test Presentation');
                }
            }
            get(key) {
                return this.params.get(key);
            }
        };
    });

    it('should initialize with default values', () => {
        viewer = new PresentationViewer();
        
        expect(viewer.currentSlide).toBe(1);
        expect(viewer.totalSlides).toBe(0);
        expect(viewer.slides).toEqual([]);
        expect(viewer.presentationFolder).toBe('demo-presentation');
        expect(viewer.presentationTitle).toBe('Presentation');
    });

    it('should parse URL parameters correctly', () => {
        // Mock URL with parameters
        Object.defineProperty(window, 'location', {
            value: {
                search: '?folder=test-presentation&title=Test%20Presentation'
            },
            configurable: true
        });

        viewer = new PresentationViewer();
        
        expect(viewer.presentationFolder).toBe('test-presentation');
        expect(viewer.presentationTitle).toBe('Test Presentation');
    });

    it('should set DOM elements correctly', () => {
        viewer = new PresentationViewer();
        
        expect(viewer.slideFrame).toBe(mockElements.slideFrame);
        expect(viewer.currentSlideSpan).toBe(mockElements.currentSlideSpan);
        expect(viewer.totalSlidesSpan).toBe(mockElements.totalSlidesSpan);
    });
});

describe('PresentationViewer - Slide Management', () => {
    let viewer;
    let restoreFetch;

    beforeEach(() => {
        viewer = new PresentationViewer();
        
        // Mock successful slide loading
        restoreFetch = mockFetch({
            'slides/test-presentation/config.json': {
                ok: true,
                data: {
                    slides: [
                        { number: 1, path: '01-intro.html', title: 'Introduction' },
                        { number: 2, path: '02-content.html', title: 'Content' },
                        { number: 3, path: '03-conclusion.html', title: 'Conclusion' }
                    ]
                }
            },
            'slides/test-presentation/01-intro.html': { ok: true },
            'slides/test-presentation/02-content.html': { ok: true },
            'slides/test-presentation/03-conclusion.html': { ok: true }
        });
    });

    afterEach(() => {
        if (restoreFetch) restoreFetch();
    });

    it('should load slides from config.json', async () => {
        viewer.presentationFolder = 'test-presentation';
        await viewer.loadSlides();

        expect(viewer.slides).toHaveLength(3);
        expect(viewer.totalSlides).toBe(3);
        expect(viewer.slides[0].title).toBe('Introduction');
        expect(viewer.slides[1].title).toBe('Content');
        expect(viewer.slides[2].title).toBe('Conclusion');
    });

    it('should handle missing config.json gracefully', async () => {
        restoreFetch();
        restoreFetch = mockFetch({
            'slides/test-presentation/config.json': { ok: false, status: 404 },
            'slides/test-presentation/01.html': { ok: true },
            'slides/test-presentation/02.html': { ok: true }
        });

        viewer.presentationFolder = 'test-presentation';
        await viewer.loadSlides();

        expect(viewer.slides.length).toBeGreaterThan(0);
    });

    it('should extract titles from file paths correctly', () => {
        const title1 = viewer.extractTitleFromPath('slides/demo/01-welcome.html');
        const title2 = viewer.extractTitleFromPath('slides/demo/02_features.html');
        const title3 = viewer.extractTitleFromPath('slides/demo/03-usage-guide.html');

        expect(title1).toBe('welcome');
        expect(title2).toBe('features');
        expect(title3).toBe('usage guide');
    });

    it('should generate thumbnails for slides', () => {
        viewer.slides = [
            { number: 1, title: 'Slide 1' },
            { number: 2, title: 'Slide 2' }
        ];

        viewer.generateThumbnails();

        const thumbnails = document.getElementById('slideThumbnails');
        expect(thumbnails.children.length).toBe(2);
        expect(thumbnails.children[0].textContent).toContain('1');
        expect(thumbnails.children[0].textContent).toContain('Slide 1');
    });
});

describe('PresentationViewer - Navigation', () => {
    let viewer;

    beforeEach(() => {
        viewer = new PresentationViewer();
        viewer.slides = [
            { number: 1, path: 'slide1.html', title: 'Slide 1' },
            { number: 2, path: 'slide2.html', title: 'Slide 2' },
            { number: 3, path: 'slide3.html', title: 'Slide 3' }
        ];
        viewer.totalSlides = 3;
        viewer.currentSlide = 2; // Start at middle slide
    });

    it('should navigate to next slide', () => {
        const initialSlide = viewer.currentSlide;
        viewer.nextSlide();
        expect(viewer.currentSlide).toBe(initialSlide + 1);
    });

    it('should navigate to previous slide', () => {
        const initialSlide = viewer.currentSlide;
        viewer.previousSlide();
        expect(viewer.currentSlide).toBe(initialSlide - 1);
    });

    it('should not navigate beyond first slide', () => {
        viewer.currentSlide = 1;
        viewer.previousSlide();
        expect(viewer.currentSlide).toBe(1);
    });

    it('should not navigate beyond last slide', () => {
        viewer.currentSlide = 3;
        viewer.nextSlide();
        expect(viewer.currentSlide).toBe(3);
    });

    it('should show specific slide by number', () => {
        viewer.showSlide(1);
        expect(viewer.currentSlide).toBe(1);
        
        viewer.showSlide(3);
        expect(viewer.currentSlide).toBe(3);
    });

    it('should ignore invalid slide numbers', () => {
        const initialSlide = viewer.currentSlide;
        
        viewer.showSlide(0);
        expect(viewer.currentSlide).toBe(initialSlide);
        
        viewer.showSlide(10);
        expect(viewer.currentSlide).toBe(initialSlide);
    });

    it('should update navigation buttons correctly', () => {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        // Test first slide
        viewer.currentSlide = 1;
        viewer.updateNavigation();
        expect(prevBtn.disabled).toBe(true);
        expect(nextBtn.disabled).toBe(false);

        // Test last slide
        viewer.currentSlide = 3;
        viewer.updateNavigation();
        expect(prevBtn.disabled).toBe(false);
        expect(nextBtn.disabled).toBe(true);

        // Test middle slide
        viewer.currentSlide = 2;
        viewer.updateNavigation();
        expect(prevBtn.disabled).toBe(false);
        expect(nextBtn.disabled).toBe(false);
    });
});

describe('PresentationViewer - Keyboard Events', () => {
    let viewer;

    beforeEach(() => {
        viewer = new PresentationViewer();
        viewer.slides = [
            { number: 1, path: 'slide1.html', title: 'Slide 1' },
            { number: 2, path: 'slide2.html', title: 'Slide 2' },
            { number: 3, path: 'slide3.html', title: 'Slide 3' }
        ];
        viewer.totalSlides = 3;
        viewer.currentSlide = 2;
    });

    it('should handle arrow key navigation', () => {
        const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });

        viewer.handleKeyDown(leftEvent);
        expect(viewer.currentSlide).toBe(1);

        viewer.handleKeyDown(rightEvent);
        expect(viewer.currentSlide).toBe(2);
    });

    it('should handle spacebar for next slide', () => {
        const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
        viewer.handleKeyDown(spaceEvent);
        expect(viewer.currentSlide).toBe(3);
    });

    it('should handle Home and End keys', () => {
        const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
        const endEvent = new KeyboardEvent('keydown', { key: 'End' });

        viewer.handleKeyDown(homeEvent);
        expect(viewer.currentSlide).toBe(1);

        viewer.handleKeyDown(endEvent);
        expect(viewer.currentSlide).toBe(3);
    });

    it('should handle fullscreen toggle with F key', () => {
        const fEvent = new KeyboardEvent('keydown', { key: 'f' });
        
        // Mock fullscreen API
        document.fullscreenElement = null;
        document.documentElement.requestFullscreen = () => Promise.resolve();

        // This should not throw an error
        expect(() => viewer.handleKeyDown(fEvent)).not.toThrow();
    });
});

describe('PresentationViewer - Error Handling', () => {
    let viewer;

    beforeEach(() => {
        viewer = new PresentationViewer();
    });

    it('should show error when no slides are found', () => {
        viewer.slides = [];
        viewer.totalSlides = 0;
        
        viewer.showError();
        
        const errorMessage = document.getElementById('errorMessage');
        expect(errorMessage.style.display).toBe('flex');
    });

    it('should show custom error messages', () => {
        const customMessage = 'Custom error message';
        viewer.showError(customMessage);
        
        const errorMessageP = document.querySelector('#errorMessage p');
        expect(errorMessageP.textContent).toBe(customMessage);
    });

    it('should hide error when showing slides', () => {
        viewer.hideError();
        
        const errorMessage = document.getElementById('errorMessage');
        const slideFrame = document.getElementById('slideFrame');
        
        expect(errorMessage.style.display).toBe('none');
        expect(slideFrame.style.display).toBe('block');
    });

    it('should handle slide loading errors', () => {
        viewer.onSlideError();
        
        const errorMessage = document.getElementById('errorMessage');
        expect(errorMessage.style.display).toBe('flex');
    });
});

describe('PresentationViewer - UI State Management', () => {
    let viewer;

    beforeEach(() => {
        viewer = new PresentationViewer();
    });

    it('should show loading state', () => {
        viewer.showLoading();
        
        const loadingMessage = document.getElementById('loadingMessage');
        expect(loadingMessage.style.display).toBe('flex');
    });

    it('should hide loading state', () => {
        viewer.hideLoading();
        
        const loadingMessage = document.getElementById('loadingMessage');
        expect(loadingMessage.style.display).toBe('none');
    });

    it('should update slide counter display', () => {
        viewer.currentSlide = 2;
        viewer.totalSlides = 5;
        
        const currentSlideSpan = document.getElementById('currentSlide');
        const totalSlidesSpan = document.getElementById('totalSlides');
        
        viewer.showSlide(2);
        
        expect(currentSlideSpan.textContent).toBe('2');
        expect(totalSlidesSpan.textContent).toBe('0'); // Set during loadSlides
    });

    it('should update thumbnail active states', () => {
        viewer.slides = [
            { number: 1, title: 'Slide 1' },
            { number: 2, title: 'Slide 2' }
        ];
        viewer.generateThumbnails();
        
        viewer.currentSlide = 1;
        viewer.updateThumbnails();
        
        const thumbnails = document.querySelectorAll('#slideThumbnails .thumbnail');
        expect(thumbnails[0].classList.contains('active')).toBe(true);
        expect(thumbnails[1].classList.contains('active')).toBe(false);
    });
});

describe('PresentationViewer - Integration', () => {
    let viewer;
    let restoreFetch;

    beforeEach(() => {
        viewer = new PresentationViewer();
        
        restoreFetch = mockFetch({
            'slides/demo-presentation/config.json': {
                ok: true,
                data: {
                    slides: [
                        { number: 1, path: '01-intro.html', title: 'Introduction' }
                    ]
                }
            }
        });
    });

    afterEach(() => {
        if (restoreFetch) restoreFetch();
    });

    it('should reload slides and maintain current position', async () => {
        viewer.slides = [
            { number: 1, path: 'slide1.html', title: 'Slide 1' },
            { number: 2, path: 'slide2.html', title: 'Slide 2' }
        ];
        viewer.totalSlides = 2;
        viewer.currentSlide = 2;

        await viewer.reloadSlides();
        
        expect(viewer.totalSlides).toBe(1); // From mock config
        expect(viewer.currentSlide).toBe(1); // Adjusted to valid range
    });

    it('should handle dashboard navigation', () => {
        // Mock window.location
        let redirected = false;
        Object.defineProperty(window, 'location', {
            set: function(url) {
                redirected = url;
            },
            configurable: true
        });

        viewer.goToDashboard();
        
        expect(redirected).toBe('dashboard.html');
    });
});

console.log('PresentationViewer tests loaded successfully!');