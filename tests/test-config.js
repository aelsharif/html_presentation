/**
 * Test Configuration and Utilities
 */

// Test configuration
const TEST_CONFIG = {
    timeout: 5000, // Default test timeout in milliseconds
    retries: 3, // Number of retries for flaky tests
    parallel: false, // Run tests in parallel (not supported yet)
    verbose: true, // Show detailed output
    
    // Mock data for consistent testing
    mockPresentations: [
        {
            id: 'demo-presentation',
            title: 'Demo Presentation',
            description: 'A comprehensive demonstration of the presentation system',
            author: 'Demo Team',
            created: '2024-01-01',
            slideCount: 4,
            folder: 'demo-presentation',
            thumbnail: null
        },
        {
            id: 'business-presentation',
            title: 'Business Strategy 2024',
            description: 'Annual business strategy and planning presentation',
            author: 'Business Team',
            created: '2024-01-15',
            slideCount: 3,
            folder: 'business-presentation',
            thumbnail: null
        },
        {
            id: 'tutorial-presentation',
            title: 'Web Development Tutorial',
            description: 'Complete guide to modern web development',
            author: 'Tech Team',
            created: '2024-02-10',
            slideCount: 2,
            folder: 'tutorial-presentation',
            thumbnail: null
        }
    ],

    mockSlides: {
        'demo-presentation': [
            { number: 1, path: '01-welcome.html', title: 'Welcome' },
            { number: 2, path: '02-features.html', title: 'Features' },
            { number: 3, path: '03-usage.html', title: 'How to Use' },
            { number: 4, path: '04-conclusion.html', title: 'Conclusion' }
        ],
        'business-presentation': [
            { number: 1, path: '01-overview.html', title: 'Executive Overview' },
            { number: 2, path: '02-market-analysis.html', title: 'Market Analysis' },
            { number: 3, path: '03-strategy.html', title: 'Strategic Roadmap' }
        ],
        'tutorial-presentation': [
            { number: 1, path: '01-introduction.html', title: 'Introduction' },
            { number: 2, path: '02-html-basics.html', title: 'HTML Fundamentals' }
        ]
    }
};

// Test utilities
const TestUtils = {
    // Create a mock DOM element
    createElement(tagName, attributes = {}, textContent = '') {
        const element = document.createElement(tagName);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        if (textContent) {
            element.textContent = textContent;
        }
        return element;
    },

    // Create a comprehensive mock fetch function
    createMockFetch(responses = {}) {
        const defaultResponses = {
            // Demo presentation config
            'slides/demo-presentation/config.json': {
                ok: true,
                data: {
                    title: 'Demo Presentation',
                    description: 'A comprehensive demonstration',
                    author: 'Demo Team',
                    created: '2024-01-01',
                    slides: TEST_CONFIG.mockSlides['demo-presentation']
                }
            },
            
            // Business presentation config
            'slides/business-presentation/config.json': {
                ok: true,
                data: {
                    title: 'Business Strategy 2024',
                    description: 'Annual business strategy',
                    author: 'Business Team',
                    created: '2024-01-15',
                    slides: TEST_CONFIG.mockSlides['business-presentation']
                }
            },
            
            // Tutorial presentation config
            'slides/tutorial-presentation/config.json': {
                ok: true,
                data: {
                    title: 'Web Development Tutorial',
                    description: 'Complete web dev guide',
                    author: 'Tech Team',
                    created: '2024-02-10',
                    slides: TEST_CONFIG.mockSlides['tutorial-presentation']
                }
            },

            // Mock slide files (all return ok: true)
            ...Object.entries(TEST_CONFIG.mockSlides).reduce((acc, [folder, slides]) => {
                slides.forEach(slide => {
                    acc[`slides/${folder}/${slide.path}`] = { ok: true };
                });
                return acc;
            }, {}),

            // Additional common patterns
            'slides/demo-presentation/01.html': { ok: true },
            'slides/demo-presentation/02.html': { ok: true },
            'slides/business-presentation/01.html': { ok: true },
            'slides/tutorial-presentation/01.html': { ok: true }
        };

        const allResponses = { ...defaultResponses, ...responses };
        
        return mockFetch(allResponses);
    },

    // Reset DOM to clean state
    resetDOM() {
        const elementsToReset = [
            'slideFrame', 'currentSlide', 'totalSlides', 'prevBtn', 'nextBtn',
            'dashboardBtn', 'fullscreenBtn', 'loadingMessage', 'errorMessage',
            'slideThumbnails', 'presentationTitle', 'searchInput', 'presentationsGrid',
            'loadingState', 'emptyState', 'presentationCount', 'gridView', 'listView', 'refreshBtn'
        ];

        elementsToReset.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '';
                element.textContent = '';
                element.value = '';
                element.style.display = '';
                element.disabled = false;
                element.className = element.className.split(' ').filter(cls => 
                    !['active', 'list-view'].includes(cls)
                ).join(' ');
            }
        });
    },

    // Wait for a condition to be true
    async waitFor(condition, timeout = 1000, interval = 50) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error(`Condition not met within ${timeout}ms`);
    },

    // Simulate user events
    simulateEvent(element, eventType, options = {}) {
        const event = new Event(eventType, { bubbles: true, ...options });
        Object.entries(options).forEach(([key, value]) => {
            event[key] = value;
        });
        element.dispatchEvent(event);
    },

    simulateKeyDown(element, key, options = {}) {
        const event = new KeyboardEvent('keydown', { 
            key, 
            bubbles: true, 
            ...options 
        });
        element.dispatchEvent(event);
    },

    simulateClick(element) {
        this.simulateEvent(element, 'click');
    },

    // Performance testing helper
    measurePerformance(fn) {
        const startTime = performance.now();
        const result = fn();
        const endTime = performance.now();
        
        return {
            result,
            duration: endTime - startTime
        };
    },

    // Async performance testing helper
    async measureAsyncPerformance(fn) {
        const startTime = performance.now();
        const result = await fn();
        const endTime = performance.now();
        
        return {
            result,
            duration: endTime - startTime
        };
    },

    // Memory usage helper (if available)
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    },

    // Generate test data
    generateMockPresentations(count = 10) {
        return Array.from({ length: count }, (_, i) => ({
            id: `test-presentation-${i}`,
            title: `Test Presentation ${i}`,
            description: `This is test presentation number ${i}`,
            author: `Test Author ${i % 3}`,
            created: `2024-01-${String(i + 1).padStart(2, '0')}`,
            slideCount: (i % 5) + 1,
            folder: `test-presentation-${i}`,
            thumbnail: i % 2 === 0 ? `thumb${i}.jpg` : null
        }));
    },

    generateMockSlides(count = 5) {
        return Array.from({ length: count }, (_, i) => ({
            number: i + 1,
            path: `${String(i + 1).padStart(2, '0')}-slide.html`,
            title: `Slide ${i + 1}`
        }));
    }
};

// Export for use in tests
if (typeof window !== 'undefined') {
    window.TEST_CONFIG = TEST_CONFIG;
    window.TestUtils = TestUtils;
}

// Enhanced expect matchers
if (typeof window !== 'undefined' && window.testFramework) {
    const originalExpect = window.expect;
    
    window.expect = function(actual) {
        const base = originalExpect(actual);
        
        return {
            ...base,
            
            // DOM-specific matchers
            toBeVisible() {
                const element = actual;
                if (!element || !element.style) {
                    throw new Error('Expected a DOM element');
                }
                
                const isVisible = element.style.display !== 'none' && 
                                element.style.visibility !== 'hidden';
                
                if (!isVisible) {
                    throw new Error(`Expected element to be visible`);
                }
            },

            toBeHidden() {
                const element = actual;
                if (!element || !element.style) {
                    throw new Error('Expected a DOM element');
                }
                
                const isHidden = element.style.display === 'none' || 
                               element.style.visibility === 'hidden';
                
                if (!isHidden) {
                    throw new Error(`Expected element to be hidden`);
                }
            },

            toHaveClass(className) {
                const element = actual;
                if (!element || !element.classList) {
                    throw new Error('Expected a DOM element');
                }
                
                if (!element.classList.contains(className)) {
                    throw new Error(`Expected element to have class "${className}"`);
                }
            },

            // Performance matchers
            toBePerformant(maxDuration = 100) {
                if (typeof actual !== 'number') {
                    throw new Error('Expected a number (duration in ms)');
                }
                
                if (actual > maxDuration) {
                    throw new Error(`Expected duration ${actual}ms to be less than ${maxDuration}ms`);
                }
            },

            // Array matchers
            toBeArrayOfLength(length) {
                if (!Array.isArray(actual)) {
                    throw new Error('Expected an array');
                }
                
                if (actual.length !== length) {
                    throw new Error(`Expected array length ${actual.length} to be ${length}`);
                }
            },

            // Async matchers
            async toEventuallyBe(expected, timeout = 1000) {
                await TestUtils.waitFor(() => actual() === expected, timeout);
            }
        };
    };
}

console.log('Test configuration and utilities loaded successfully!');