class PresentationViewer {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 0;
        this.slides = [];
        this.presentationFolder = '';
        this.presentationTitle = '';
        
        this.slideFrame = document.getElementById('slideFrame');
        this.currentSlideSpan = document.getElementById('currentSlide');
        this.totalSlidesSpan = document.getElementById('totalSlides');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.dashboardBtn = document.getElementById('dashboardBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.errorMessage = document.getElementById('errorMessage');
        this.slideThumbnails = document.getElementById('slideThumbnails');
        this.presentationTitleEl = document.getElementById('presentationTitle');

        this.init();
    }

    async init() {
        // Get presentation info from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.presentationFolder = urlParams.get('folder') || 'demo-presentation';
        this.presentationTitle = urlParams.get('title') || 'Presentation';
        
        // Set the presentation title in the navigation
        this.presentationTitleEl.textContent = this.presentationTitle;
        document.title = this.presentationTitle + ' - HTML Presentation';

        try {
            await this.loadSlides();
            this.setupEventListeners();
            this.updateNavigation();
            if (this.totalSlides > 0) {
                this.showSlide(1);
            } else {
                this.showError();
            }
        } catch (error) {
            console.error('Error initializing presentation:', error);
            this.showError();
        }
    }

    async loadSlides() {
        const possibleSlides = [];
        
        // First try to load from config file
        try {
            const configResponse = await fetch(`slides/${this.presentationFolder}/config.json`);
            if (configResponse.ok) {
                const config = await configResponse.json();
                if (config.slides && config.slides.length > 0) {
                    // Use slides from config
                    config.slides.forEach((slide, index) => {
                        possibleSlides.push({
                            number: slide.number || index + 1,
                            path: slide.path.startsWith('slides/') ? slide.path : `slides/${this.presentationFolder}/${slide.path}`,
                            title: slide.title || `Slide ${index + 1}`
                        });
                    });
                }
            }
        } catch (error) {
            console.log('No config file found, scanning for slides...');
        }

        // If no slides from config, scan for numbered files
        if (possibleSlides.length === 0) {
            for (let i = 1; i <= 20; i++) {
                const patterns = [
                    `slides/${this.presentationFolder}/${i.toString().padStart(2, '0')}.html`,
                    `slides/${this.presentationFolder}/${i.toString().padStart(2, '0')}-*.html`
                ];

                for (const pattern of patterns) {
                    try {
                        const testPaths = pattern.includes('*') ? 
                            [
                                pattern.replace('*', 'slide'),
                                pattern.replace('*', 'intro'),
                                pattern.replace('*', 'welcome'),
                                pattern.replace('*', 'content')
                            ] : 
                            [pattern];
                        
                        for (const testPath of testPaths) {
                            const response = await fetch(testPath);
                            if (response.ok) {
                                const slideInfo = {
                                    number: i,
                                    path: testPath,
                                    title: this.extractTitleFromPath(testPath)
                                };
                                possibleSlides.push(slideInfo);
                                break;
                            }
                        }
                    } catch (error) {
                        continue;
                    }
                    
                    if (possibleSlides.find(s => s.number === i)) {
                        break; // Found slide for this number, move to next
                    }
                }
            }
        }

        // Fallback to demo slides if nothing found and we're looking for demo-presentation
        if (possibleSlides.length === 0 && this.presentationFolder === 'demo-presentation') {
            const demoSlides = [
                { number: 1, path: 'slides/01-welcome.html', title: 'Welcome' },
                { number: 2, path: 'slides/02-features.html', title: 'Features' },
                { number: 3, path: 'slides/03-usage.html', title: 'How to Use' },
                { number: 4, path: 'slides/04-conclusion.html', title: 'Conclusion' }
            ];

            for (const slide of demoSlides) {
                try {
                    const response = await fetch(slide.path);
                    if (response.ok) {
                        possibleSlides.push(slide);
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        this.slides = possibleSlides.sort((a, b) => a.number - b.number);
        this.totalSlides = this.slides.length;
        this.totalSlidesSpan.textContent = this.totalSlides;

        // Generate thumbnails if slides exist
        if (this.totalSlides > 0) {
            this.generateThumbnails();
        }
    }

    extractTitleFromPath(path) {
        const filename = path.split('/').pop().replace('.html', '');
        // Remove number prefix and clean up the title
        return filename.replace(/^\d+[-_]?/, '').replace(/[-_]/g, ' ').trim() || `Slide ${this.slides.length + 1}`;
    }

    generateThumbnails() {
        this.slideThumbnails.innerHTML = '';
        this.slides.forEach((slide, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            thumbnail.innerHTML = `
                <div class="thumbnail-number">${slide.number}</div>
                <div class="thumbnail-title">${slide.title}</div>
            `;
            thumbnail.addEventListener('click', () => this.showSlide(index + 1));
            this.slideThumbnails.appendChild(thumbnail);
        });
    }

    setupEventListeners() {
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.previousSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        this.dashboardBtn.addEventListener('click', () => this.goToDashboard());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Fullscreen toggle
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Handle iframe load events
        this.slideFrame.addEventListener('load', () => this.onSlideLoaded());
        this.slideFrame.addEventListener('error', () => this.onSlideError());
    }

    handleKeyDown(event) {
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ': // Spacebar
                event.preventDefault();
                this.nextSlide();
                break;
            case 'Home':
                event.preventDefault();
                this.showSlide(1);
                break;
            case 'End':
                event.preventDefault();
                this.showSlide(this.totalSlides);
                break;
            case 'f':
            case 'F':
                if (!event.ctrlKey && !event.altKey) {
                    event.preventDefault();
                    this.toggleFullscreen();
                }
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    // ESC also goes back to dashboard
                    this.goToDashboard();
                }
                break;
            case 'h':
            case 'H':
                if (!event.ctrlKey && !event.altKey) {
                    event.preventDefault();
                    this.goToDashboard();
                }
                break;
        }
    }

    showSlide(slideNumber) {
        if (slideNumber < 1 || slideNumber > this.totalSlides) {
            return;
        }

        this.currentSlide = slideNumber;
        this.currentSlideSpan.textContent = this.currentSlide;

        const slide = this.slides[slideNumber - 1];
        if (slide) {
            this.hideError();
            this.showLoading();
            this.slideFrame.src = slide.path;
        }

        this.updateNavigation();
        this.updateThumbnails();
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides) {
            this.showSlide(this.currentSlide + 1);
        }
    }

    previousSlide() {
        if (this.currentSlide > 1) {
            this.showSlide(this.currentSlide - 1);
        }
    }

    goToDashboard() {
        window.location.href = 'index.html';
    }

    updateNavigation() {
        this.prevBtn.disabled = this.currentSlide <= 1;
        this.nextBtn.disabled = this.currentSlide >= this.totalSlides;
    }

    updateThumbnails() {
        const thumbnails = this.slideThumbnails.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.classList.toggle('active', index + 1 === this.currentSlide);
        });
    }

    onSlideLoaded() {
        this.hideLoading();
        this.hideError();
    }

    onSlideError() {
        this.hideLoading();
        this.showError(`Failed to load slide ${this.currentSlide}`);
    }

    showLoading() {
        this.loadingMessage.style.display = 'flex';
    }

    hideLoading() {
        this.loadingMessage.style.display = 'none';
    }

    showError(message = 'No slides found in this presentation.') {
        this.errorMessage.querySelector('p').textContent = message;
        this.errorMessage.style.display = 'flex';
        this.slideFrame.style.display = 'none';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
        this.slideFrame.style.display = 'block';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            });
        } else {
            document.exitFullscreen().then(() => {
                this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            });
        }
    }

    // Public method to reload slides (useful for development)
    async reloadSlides() {
        await this.loadSlides();
        if (this.totalSlides > 0) {
            this.showSlide(Math.min(this.currentSlide, this.totalSlides));
        } else {
            this.showError();
        }
    }
}

// Initialize presentation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.presentationViewer = new PresentationViewer();
});