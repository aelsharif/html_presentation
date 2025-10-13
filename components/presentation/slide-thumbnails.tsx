'use client';

import React from 'react';
import { SlideConfig } from '@/lib/types';
import { FileText, X } from 'lucide-react';

interface SlideThumbnailsProps {
  slides: SlideConfig[];
  currentSlide: number;
  onSlideSelect: (slideNumber: number) => void;
  className?: string;
  isVisible?: boolean;
}

export function SlideThumbnails({
  slides,
  currentSlide,
  onSlideSelect,
  className,
  isVisible = true
}: SlideThumbnailsProps) {
  const thumbnailsRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to current slide
  React.useEffect(() => {
    if (!thumbnailsRef.current) return;

    const activeThumb = thumbnailsRef.current.querySelector(`[data-slide="${currentSlide}"]`);
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentSlide]);

  if (!isVisible) return null;

  return (
    <div className={`h-full bg-gray-800 flex flex-col ${className || ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">
            Slides ({slides.length})
          </h3>
        </div>
      </div>

      {/* Thumbnails */}
      <div 
        ref={thumbnailsRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {slides.map((slide) => (
          <button
            key={slide.number}
            data-slide={slide.number}
            onClick={() => onSlideSelect(slide.number)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
              currentSlide === slide.number
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200'
            }`}
          >
            <div className="space-y-2">
              {/* Slide preview */}
              <div className={`aspect-video w-full rounded bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center relative overflow-hidden ${
                currentSlide === slide.number ? 'ring-2 ring-blue-300' : ''
              }`}>
                <FileText className="w-8 h-8 text-gray-400" />
                
                {/* Slide number badge */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                  {slide.number}
                </div>
              </div>

              {/* Slide info */}
              <div className="space-y-1">
                <h4 className={`text-sm font-medium line-clamp-2 ${
                  currentSlide === slide.number
                    ? 'text-white'
                    : 'text-gray-200 group-hover:text-white'
                }`}>
                  {slide.title || `Slide ${slide.number}`}
                </h4>
                
                {slide.description && (
                  <p className={`text-xs line-clamp-2 ${
                    currentSlide === slide.number
                      ? 'text-blue-100'
                      : 'text-gray-400 group-hover:text-gray-300'
                  }`}>
                    {slide.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer with current slide info */}
      <div className="p-4 border-t border-gray-700 bg-gray-850">
        <div className="text-xs text-gray-400 mb-2">
          Current: Slide {currentSlide} of {slides.length}
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentSlide / slides.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}