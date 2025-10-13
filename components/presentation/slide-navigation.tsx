'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home,
  Maximize, 
  Minimize
} from 'lucide-react';
import { NavigationState } from '@/lib/types';

interface SlideNavigationProps {
  presentation: {
    folder: string;
    title: string;
    slideCount: number;
  };
  navigation: NavigationState;
  onNavigate: (slideNumber: number) => void;
  onToggleFullscreen: () => void;
  isFullscreen?: boolean;
  className?: string;
}

export function SlideNavigation({
  presentation,
  navigation,
  onNavigate,
  onToggleFullscreen,
  isFullscreen = false,
  className
}: SlideNavigationProps) {
  // Keyboard navigation is handled by PresentationViewer to avoid conflicts

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm border-b border-gray-800 ${className || ''}`}>
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left Section - Back Button */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>

        {/* Center Section - Navigation Controls */}
        <div className="flex items-center gap-4">
          {/* Previous Button */}
          <button
            onClick={() => onNavigate(navigation.currentSlide - 1)}
            disabled={!navigation.canGoPrevious}
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous slide (← or ↑)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Slide Counter */}
          <div className="flex items-center gap-3">
            <span className="text-white font-medium text-lg">
              {navigation.currentSlide} / {navigation.totalSlides}
            </span>
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center gap-1">
            {Array.from({ length: navigation.totalSlides }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => onNavigate(i + 1)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i + 1 === navigation.currentSlide
                    ? 'bg-green-500 w-6'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onNavigate(navigation.currentSlide + 1)}
            disabled={!navigation.canGoNext}
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next slide (→ or ↓)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Section - Presentation Title & Fullscreen */}
        <div className="flex items-center gap-4">
          {/* Presentation Title */}
          <div className="text-white font-medium text-sm hidden md:block">
            {presentation.title}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}