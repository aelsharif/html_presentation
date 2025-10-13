'use client';

import React from 'react';
import { Presentation } from '@/lib/types';
import { FileX, Loader } from 'lucide-react';

interface SlideRendererProps {
  presentation: Presentation;
  slideNumber: number;
  onLoad?: () => void;
  onLoadStart?: () => void;
  isFullscreen?: boolean;
  className?: string;
}

export function SlideRenderer({
  presentation,
  slideNumber,
  onLoad,
  onLoadStart,
  isFullscreen = false,
  className
}: SlideRendererProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Generate slide URL based on slideNumber
  const generateSlideUrl = React.useCallback((number: number) => {
    // Try different common slide naming patterns
    const patterns = [
      `${number.toString().padStart(2, '0')}-*.html`, // 01-welcome.html
      `${number}.html`, // 1.html
      `slide-${number}.html`, // slide-1.html
      `slide${number}.html`, // slide1.html
    ];

    // For now, use the most common pattern: 01-*.html
    // In a real implementation, this would come from the presentation service
    const paddedNumber = number.toString().padStart(2, '0');
    return `/slides/${presentation.folder}/${paddedNumber}-slide.html`;
  }, [presentation.folder]);

  // Get slide from presentation config or generate URL
  const getSlideUrl = React.useCallback(() => {
    // If presentation has slides config, use it
    if (presentation.slides && presentation.slides[slideNumber - 1]) {
      const slide = presentation.slides[slideNumber - 1];
      return `/slides/${presentation.folder}/${slide.path}`;
    }
    
    // Otherwise, try common patterns
    const patterns = [
      `${slideNumber.toString().padStart(2, '0')}-welcome.html`,
      `${slideNumber.toString().padStart(2, '0')}-features.html`,
      `${slideNumber.toString().padStart(2, '0')}-usage.html`,
      `${slideNumber.toString().padStart(2, '0')}-conclusion.html`,
      `${slideNumber.toString().padStart(2, '0')}-slide.html`,
      `${slideNumber}.html`,
      `slide-${slideNumber}.html`,
      `slide${slideNumber}.html`,
    ];
    
    // For demo, use the known pattern based on slide number
    const slideNames = ['welcome', 'features', 'usage', 'conclusion', 'slide'];
    const slideName = slideNames[slideNumber - 1] || 'slide';
    const paddedNumber = slideNumber.toString().padStart(2, '0');
    
    return `/slides/${presentation.folder}/${paddedNumber}-${slideName}.html`;
  }, [presentation, slideNumber]);

  const slideUrl = getSlideUrl();

  // Handle iframe load events
  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      console.error(`Failed to load slide ${slideNumber} from ${slideUrl}`);
    };

    // Set loading state when starting to load
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [slideUrl, slideNumber, onLoad, onLoadStart]);

  // Handle iframe content enhancement
  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || isLoading || hasError) return;

    try {
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Add viewport meta tag if missing
      if (!iframeDoc.querySelector('meta[name="viewport"]')) {
        const viewport = iframeDoc.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0';
        iframeDoc.head?.appendChild(viewport);
      }

      // Add responsive styles if needed
      if (!iframeDoc.querySelector('style[data-presentation-system]')) {
        const style = iframeDoc.createElement('style');
        style.setAttribute('data-presentation-system', 'true');
        style.textContent = `
          body {
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }
          * {
            box-sizing: border-box;
          }
        `;
        iframeDoc.head?.appendChild(style);
      }
    } catch (error) {
      // Ignore cross-origin errors
      console.warn('Could not enhance iframe content:', error);
    }
  }, [isLoading, hasError, slideUrl]);

  if (hasError) {
    return (
      <div className={`slide-content flex flex-col items-center justify-center min-h-[400px] bg-gray-800 rounded-lg ${className || ''}`}>
        <FileX className="w-16 h-16 text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">
          Slide Not Found
        </h3>
        <p className="text-gray-400 text-center max-w-md">
          Could not load slide {slideNumber} from {presentation.title}
        </p>
        <div className="mt-4 text-sm text-gray-500 font-mono">
          Tried: {slideUrl}
        </div>
      </div>
    );
  }

  return (
    <div className={`slide-container relative w-full h-full ${className || ''}`}>
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-400">Loading slide {slideNumber}...</p>
          </div>
        </div>
      )}

      {/* Slide Iframe */}
      <iframe
        ref={iframeRef}
        src={slideUrl}
        className={`w-full h-full min-h-[400px] border-0 rounded-lg bg-white ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
        title={`Slide ${slideNumber} - ${presentation.title}`}
        sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
        loading="eager"
        style={{
          minHeight: isFullscreen ? '100vh' : '70vh',
          maxHeight: isFullscreen ? '100vh' : '80vh',
        }}
      />

      {/* Slide Info Overlay (hidden in fullscreen) */}
      {!isFullscreen && !isLoading && !hasError && (
        <div className="absolute bottom-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-lg text-sm">
          Slide {slideNumber} of {presentation.slideCount}
        </div>
      )}
    </div>
  );
}