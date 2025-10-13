'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { Grid3X3 } from 'lucide-react';
import { SlideNavigation } from './slide-navigation';
import { SlideThumbnails } from './slide-thumbnails';
import { SlideRenderer } from './slide-renderer';
import { Presentation, NavigationState } from '@/lib/types';

interface PresentationViewerProps {
  presentation: Presentation;
  initialSlide?: number;
}

export function PresentationViewer({ presentation, initialSlide = 1 }: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync current slide with initial slide prop (for external navigation)
  useEffect(() => {
    if (initialSlide !== currentSlide) {
      console.log(`🔄 Syncing slide: ${currentSlide} → ${initialSlide}`);
      setCurrentSlide(initialSlide);
    }
  }, [initialSlide]);

  // Navigation state
  const navigation: NavigationState = {
    currentSlide,
    totalSlides: presentation.slideCount,
    canGoNext: currentSlide < presentation.slideCount,
    canGoPrevious: currentSlide > 1,
    isFullscreen,
    isLoading
  };

  // Handle slide navigation
  const handleNavigate = useCallback((slideNumber: number) => {
    console.log(`🎯 Navigate: ${currentSlide} → ${slideNumber} (max: ${presentation.slideCount})`);
    
    if (slideNumber >= 1 && slideNumber <= presentation.slideCount && slideNumber !== currentSlide) {
      setCurrentSlide(slideNumber);
      
      // Update URL without causing a re-render using replaceState
      const newUrl = `/presentation/${presentation.folder}/slide/${slideNumber}/`;
      window.history.replaceState({}, '', newUrl);
    } else {
      console.log(`❌ Invalid navigation: slide ${slideNumber} (current: ${currentSlide}, max: ${presentation.slideCount})`);
    }
  }, [currentSlide, presentation.folder, presentation.slideCount]);

  // Fullscreen management - MOVED BEFORE useEffect to fix dependency order
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        // Fallback for browsers that don't support fullscreen
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, [isFullscreen]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // Prevent default behavior for all our handled keys
      const handledKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End', 'f', 'F', 'Escape', 't', 'T'];
      if (handledKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          if (currentSlide > 1) {
            handleNavigate(currentSlide - 1);
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ': // Spacebar
          if (currentSlide < presentation.slideCount) {
            handleNavigate(currentSlide + 1);
          }
          break;
        case 'Home':
          if (currentSlide !== 1) {
            handleNavigate(1);
          }
          break;
        case 'End':
          if (currentSlide !== presentation.slideCount) {
            handleNavigate(presentation.slideCount);
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          }
          break;
        case 't':
        case 'T':
          setShowThumbnails(prev => !prev);
          break;
      }
    };

    // Use capture phase to ensure we handle the event first
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [currentSlide, presentation.slideCount, handleNavigate, toggleFullscreen, exitFullscreen, isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle slide loading
  const handleSlideLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleSlideLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);



  return (
    <div className={`presentation-viewer ${isFullscreen ? 'fullscreen' : ''} bg-gray-900 text-white min-h-screen`}>
      {/* Fixed Navigation Bar */}
      <SlideNavigation
        presentation={presentation}
        navigation={navigation}
        onNavigate={handleNavigate}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      {/* Main Content Area - Adjusted for fixed nav */}
      <div className={`flex ${isFullscreen ? 'h-screen' : 'h-screen pt-16'} relative`}>
        {/* Thumbnail Sidebar */}
        {showThumbnails && !isFullscreen && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 flex-shrink-0">
            <SlideThumbnails
              slides={presentation.slides || []}
              currentSlide={currentSlide}
              onSlideSelect={handleNavigate}
              isVisible={true}
            />
          </div>
        )}

        {/* Slide Content */}
        <main className="flex-1 flex flex-col">
          {/* Slide Renderer */}
          <div className="flex-1 relative">
            <SlideRenderer
              presentation={presentation}
              slideNumber={currentSlide}
              onLoad={handleSlideLoad}
              onLoadStart={handleSlideLoadStart}
              isFullscreen={isFullscreen}
            />
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading slide...</span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Thumbnail Toggle - Hidden in fullscreen */}
      {!isFullscreen && (
        <button
          onClick={() => setShowThumbnails(!showThumbnails)}
          className={`fixed top-20 right-4 z-40 p-3 rounded-lg transition-all duration-300 ${
            showThumbnails 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white backdrop-blur-sm'
          }`}
          title="Toggle Thumbnails (T)"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
      )}

      {/* Fullscreen Navigation Hint */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 bg-gray-800/90 text-white px-3 py-2 rounded-lg text-sm opacity-75 hover:opacity-100 transition-opacity">
          Press <kbd className="bg-gray-700 px-1 rounded">ESC</kbd> to exit fullscreen
        </div>
      )}
    </div>
  );
}