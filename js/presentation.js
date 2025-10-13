class PresentationManager {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 0;
        this.slides = [];
        this.slideFrame = document.getElementById('slideFrame');
        this.currentSlideSpan = document.getElementById('currentSlide');
        this.totalSlidesSpan = document.getElementById('totalSlides');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.errorMessage = document.getElementById('errorMessage');
        this.slideThumbnails = document.getElementById('slideThumbnails');

        this.init();
    }

    async init() {
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
        // Start with known slide files to ensure we have working examples
        const defaultSlides = [
            { number: 1, path: 'slides/01-welcome.html', title: 'Welcome' },
            { number: 2, path: 'slides/02-features.html', title: 'Features' },
            { number: 3, path: 'slides/03-usage.html', title: 'How to Use' },
            { number: 4, path: 'slides/04-conclusion.html', title: 'Conclusion' }
        ];
        
        const possibleSlides = [];
        
        // Check if default slides exist by trying to load them
        for (const slide of defaultSlides) {
            try {
                const response = await fetch(slide.path);
                if (response.ok) {
                    possibleSlides.push(slide);
                }
            } catch (error) {
                // Slide doesn't exist, skip it silently
                continue;
            }
        }

        // If no default slides were found, add them anyway and let the iframe handle the error
        if (possibleSlides.length === 0) {
            possibleSlides.push(...defaultSlides);
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

    showError(message = 'No slides found. Please add slide files to the \'slides\' folder.') {
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

    // Public method to add custom slides
    addSlide(number, path, title) {
        const newSlide = { number, path, title };
        this.slides.push(newSlide);
        this.slides.sort((a, b) => a.number - b.number);
        this.totalSlides = this.slides.length;
        this.totalSlidesSpan.textContent = this.totalSlides;
        this.generateThumbnails();
    }

    // Public method to get slide configuration (useful for debugging)
    getSlideConfig() {
        return {
            currentSlide: this.currentSlide,
            totalSlides: this.totalSlides,
            slides: this.slides
        };
    }
}

// Initialize presentation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.presentation = new PresentationManager();
});

// Expose reload function globally for development
window.reloadPresentation = () => {
    if (window.presentation) {
        window.presentation.reloadSlides();
    }
};