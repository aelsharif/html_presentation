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
            // Known presentation folders to check
            const knownPresentations = [
                'demo-presentation',
                'sample-presentation',
                'business-presentation',
                'tutorial-presentation'
            ];

            const presentations = [];

            // Check each known presentation folder
            for (const presentationName of knownPresentations) {
                try {
                    const configResponse = await fetch(`slides/${presentationName}/config.json`);
                    if (configResponse.ok) {
                        const config = await configResponse.json();
                        
                        // Count slides in the presentation
                        const slideCount = await this.countSlides(presentationName);
                        
                        presentations.push({
                            id: presentationName,
                            name: presentationName,
                            title: config.title || presentationName,
                            description: config.description || 'No description available',
                            author: config.author || 'Unknown',
                            created: config.created || new Date().toISOString().split('T')[0],
                            slideCount: slideCount,
                            thumbnail: config.thumbnail || null,
                            folder: presentationName
                        });
                    }
                } catch (error) {
                    // Presentation doesn't exist, skip
                    continue;
                }
            }

            // If no presentations found, create a default demo
            if (presentations.length === 0) {
                presentations.push({
                    id: 'demo-presentation',
                    name: 'demo-presentation',
                    title: 'HTML Presentation Demo',
                    description: 'A sample presentation demonstrating the features of the HTML presentation system',
                    author: 'System',
                    created: new Date().toISOString().split('T')[0],
                    slideCount: 4,
                    thumbnail: null,
                    folder: 'demo-presentation'
                });
            }

            this.presentations = presentations;
            this.filteredPresentations = [...presentations];
            this.updatePresentationCount();

        } catch (error) {
            console.error('Error loading presentations:', error);
            this.presentations = [];
            this.filteredPresentations = [];
        }

        this.hideLoading();
    }

    async countSlides(presentationFolder) {
        let count = 0;
        
        // Try to count slides by checking numbered files
        for (let i = 1; i <= 20; i++) {
            const patterns = [
                `slides/${presentationFolder}/${i.toString().padStart(2, '0')}.html`,
                `slides/${presentationFolder}/${i.toString().padStart(2, '0')}-*.html`
            ];

            for (const pattern of patterns) {
                try {
                    const testPath = pattern.includes('*') ? pattern.replace('*', 'slide') : pattern;
                    const response = await fetch(testPath, { method: 'HEAD' });
                    if (response.ok) {
                        count++;
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        return count || 1; // At least 1 slide assumed
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
        if (this.filteredPresentations.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        const presentationsHTML = this.filteredPresentations.map(presentation => 
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
        if (presentation) {
            // Use URL parameters to pass presentation info
            window.location.href = `presentation.html?folder=${encodeURIComponent(presentation.folder)}&title=${encodeURIComponent(presentation.title)}`;
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
        this.presentationCount.textContent = this.presentations.length;
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