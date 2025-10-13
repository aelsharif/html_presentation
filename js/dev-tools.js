/**
 * Developer Tools for HTML Presentation System
 * Include this file during development to access helpful debugging tools
 */

(function() {
    'use strict';

    // Wait for presentation to be loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Add developer tools to window
        window.devTools = {
            
            // Get current presentation state
            getState: function() {
                if (window.presentation) {
                    return window.presentation.getSlideConfig();
                }
                return null;
            },

            // Jump to specific slide
            goToSlide: function(slideNumber) {
                if (window.presentation) {
                    window.presentation.showSlide(slideNumber);
                    console.log(`Navigated to slide ${slideNumber}`);
                } else {
                    console.error('Presentation not loaded');
                }
            },

            // Add a new slide dynamically
            addSlide: function(number, path, title) {
                if (window.presentation) {
                    window.presentation.addSlide(number, path, title);
                    console.log(`Added slide: ${number} - ${title}`);
                } else {
                    console.error('Presentation not loaded');
                }
            },

            // Reload all slides
            reload: function() {
                if (window.presentation) {
                    window.presentation.reloadSlides();
                    console.log('Slides reloaded');
                } else {
                    console.error('Presentation not loaded');
                }
            },

            // List all available slides
            listSlides: function() {
                const state = this.getState();
                if (state) {
                    console.table(state.slides);
                    return state.slides;
                }
                return [];
            },

            // Test slide navigation
            testNavigation: function() {
                console.log('Testing navigation...');
                const state = this.getState();
                if (state && state.totalSlides > 0) {
                    // Go through all slides quickly
                    for (let i = 1; i <= state.totalSlides; i++) {
                        setTimeout(() => {
                            this.goToSlide(i);
                        }, i * 1000);
                    }
                    console.log(`Will cycle through ${state.totalSlides} slides`);
                }
            },

            // Generate slide template
            generateSlideTemplate: function(slideNumber, title) {
                const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Slide ${slideNumber}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }

        .slide-content {
            max-width: 800px;
            width: 100%;
        }

        h1 {
            font-size: 3rem;
            margin-bottom: 30px;
            font-weight: 300;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .content {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 40px;
            opacity: 0.9;
        }

        @media (max-width: 768px) {
            body { padding: 20px; }
            h1 { font-size: 2rem; }
            .content { font-size: 1rem; }
        }
    </style>
</head>
<body>
    <div class="slide-content">
        <h1>${title}</h1>
        <div class="content">
            <!-- Add your slide content here -->
            <p>This is slide ${slideNumber}. Replace this content with your own.</p>
        </div>
    </div>
</body>
</html>`;
                
                console.log(`Template for slide ${slideNumber}:`);
                console.log(template);
                return template;
            },

            // Show help
            help: function() {
                console.log(`
🛠️  HTML Presentation Developer Tools

Available commands:
• devTools.getState()                    - Get current presentation state
• devTools.goToSlide(number)            - Navigate to specific slide
• devTools.addSlide(num, path, title)   - Add new slide dynamically  
• devTools.reload()                     - Reload all slides
• devTools.listSlides()                 - List all available slides
• devTools.testNavigation()             - Test slide navigation
• devTools.generateSlideTemplate(num, title) - Generate HTML template
• devTools.help()                       - Show this help message

Example usage:
devTools.listSlides();
devTools.goToSlide(2);
devTools.addSlide(5, 'slides/05-new.html', 'New Slide');

Open browser console to use these tools.
                `);
            }
        };

        // Show welcome message if console is available
        if (window.console) {
            setTimeout(() => {
                console.log('🛠️  HTML Presentation Developer Tools loaded!');
                console.log('Type "devTools.help()" for available commands.');
            }, 1000);
        }
    });

})();