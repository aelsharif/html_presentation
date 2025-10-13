/**
 * Simple Test Framework for HTML Presentation System
 */
class TestFramework {
    constructor() {
        this.testSuites = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        };
        this.currentSuite = null;
        this.isRunning = false;
    }

    // Create a new test suite
    describe(suiteName, setupFn) {
        const suite = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null,
            beforeAll: null,
            afterAll: null
        };

        this.currentSuite = suite;
        setupFn();
        this.testSuites.push(suite);
        this.currentSuite = null;
    }

    // Add a test case
    it(testName, testFn) {
        if (!this.currentSuite) {
            throw new Error('Tests must be defined inside a describe block');
        }

        this.currentSuite.tests.push({
            name: testName,
            fn: testFn,
            status: 'pending',
            error: null,
            duration: 0
        });
    }

    // Setup hooks
    beforeEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach = fn;
        }
    }

    afterEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterEach = fn;
        }
    }

    beforeAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll = fn;
        }
    }

    afterAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterAll = fn;
        }
    }

    // Assertion methods
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            toBeNull: () => {
                if (actual !== null) {
                    throw new Error(`Expected ${actual} to be null`);
                }
            },
            toBeUndefined: () => {
                if (actual !== undefined) {
                    throw new Error(`Expected ${actual} to be undefined`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Expected ${actual} to have length ${expected}, got ${actual.length}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            toThrow: () => {
                try {
                    actual();
                    throw new Error('Expected function to throw an error');
                } catch (error) {
                    // Expected to throw
                }
            }
        };
    }

    // Mock utilities
    createMock(methods = {}) {
        const mock = {
            calls: [],
            ...methods
        };

        // Wrap each method to track calls
        Object.keys(methods).forEach(key => {
            const originalMethod = methods[key];
            mock[key] = (...args) => {
                mock.calls.push({ method: key, args });
                return originalMethod?.(...args);
            };
        });

        return mock;
    }

    // Spy utilities
    spyOn(object, method) {
        const original = object[method];
        const spy = {
            calls: [],
            restore: () => {
                object[method] = original;
            }
        };

        object[method] = (...args) => {
            spy.calls.push(args);
            return original?.apply(object, args);
        };

        return spy;
    }

    // Run all tests
    async runAllTests() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.results = { total: 0, passed: 0, failed: 0, skipped: 0 };

        // Count total tests
        this.results.total = this.testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
        this.updateUI();

        let testsRun = 0;

        for (const suite of this.testSuites) {
            await this.runSuite(suite, () => {
                testsRun++;
                this.updateProgress(testsRun / this.results.total * 100);
            });
        }

        this.isRunning = false;
        this.updateUI();
        document.getElementById('runTestsBtn').disabled = false;
    }

    async runSuite(suite, onTestComplete) {
        // Run beforeAll hook
        if (suite.beforeAll) {
            try {
                await suite.beforeAll();
            } catch (error) {
                console.error(`Suite ${suite.name} beforeAll failed:`, error);
            }
        }

        for (const test of suite.tests) {
            // Run beforeEach hook
            if (suite.beforeEach) {
                try {
                    await suite.beforeEach();
                } catch (error) {
                    console.error(`Test ${test.name} beforeEach failed:`, error);
                }
            }

            await this.runTest(test);

            // Run afterEach hook
            if (suite.afterEach) {
                try {
                    await suite.afterEach();
                } catch (error) {
                    console.error(`Test ${test.name} afterEach failed:`, error);
                }
            }

            onTestComplete();
        }

        // Run afterAll hook
        if (suite.afterAll) {
            try {
                await suite.afterAll();
            } catch (error) {
                console.error(`Suite ${suite.name} afterAll failed:`, error);
            }
        }
    }

    async runTest(test) {
        const startTime = performance.now();
        
        try {
            await test.fn();
            test.status = 'passed';
            this.results.passed++;
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            this.results.failed++;
        }

        test.duration = performance.now() - startTime;
        this.updateUI();
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }

    updateUI() {
        // Update summary numbers
        document.getElementById('totalTests').textContent = this.results.total;
        document.getElementById('passedTests').textContent = this.results.passed;
        document.getElementById('failedTests').textContent = this.results.failed;

        // Generate test results HTML
        const resultsContainer = document.getElementById('testResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = this.testSuites.map(suite => `
            <div class="test-suite">
                <div class="suite-header">
                    📁 ${suite.name} (${suite.tests.length} tests)
                </div>
                ${suite.tests.map(test => `
                    <div class="test-case">
                        <div class="test-name">
                            ${test.name}
                            ${test.error ? `
                                <div class="test-details show">
                                    <div class="error-details">❌ ${test.error}</div>
                                    <div>Duration: ${test.duration.toFixed(2)}ms</div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="test-status ${test.status}">
                            ${test.status === 'passed' ? '✅ PASS' : 
                              test.status === 'failed' ? '❌ FAIL' : 
                              test.status === 'skipped' ? '⏭️ SKIP' : '⏳ PENDING'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }
}

// Global test framework instance
const testFramework = new TestFramework();

// Export global functions
window.describe = (name, fn) => testFramework.describe(name, fn);
window.it = (name, fn) => testFramework.it(name, fn);
window.beforeEach = (fn) => testFramework.beforeEach(fn);
window.afterEach = (fn) => testFramework.afterEach(fn);
window.beforeAll = (fn) => testFramework.beforeAll(fn);
window.afterAll = (fn) => testFramework.afterAll(fn);
window.expect = (actual) => testFramework.expect(actual);
window.runAllTests = () => {
    document.getElementById('runTestsBtn').disabled = true;
    testFramework.runAllTests();
};

// Mock fetch for testing
window.mockFetch = (responses = {}) => {
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
        if (responses[url]) {
            const response = responses[url];
            return {
                ok: response.ok !== false,
                status: response.status || 200,
                json: async () => response.data || {},
                text: async () => response.text || ''
            };
        }
        return originalFetch(url, options);
    };
    
    return () => {
        window.fetch = originalFetch;
    };
};

console.log('Test Framework loaded successfully!');