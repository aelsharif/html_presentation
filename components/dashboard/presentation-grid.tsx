'use client';

import React from 'react';
import { Presentation } from '@/lib/types';
import { PresentationCard } from './presentation-card';

interface PresentationGridProps {
  presentations: Presentation[];
  onPresentationSelect: (presentation: Presentation) => void;
  viewMode?: 'grid' | 'list';
}

export function PresentationGrid({ 
  presentations, 
  onPresentationSelect, 
  viewMode = 'grid' 
}: PresentationGridProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {presentations.map((presentation, index) => (
          <div
            key={presentation.id}
            onClick={() => onPresentationSelect(presentation)}
            className="flex items-center p-4 bg-gray-800 hover:bg-gray-750 rounded-lg cursor-pointer group transition-colors border border-gray-700 hover:border-gray-600"
          >
            {/* Gradient Badge */}
            <div 
              className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${getGradientClass(index)}`}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">{presentation.slideCount}</div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg truncate group-hover:text-blue-400 transition-colors">
                {presentation.title}
              </h3>
              
              {presentation.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-1">
                  {presentation.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {presentation.author && (
                  <span>👤 {presentation.author}</span>
                )}
                {presentation.created && (
                  <span>📅 {new Date(presentation.created).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid view - matching the image exactly
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {presentations.map((presentation, index) => (
        <PresentationCard
          key={presentation.id}
          presentation={presentation}
          onClick={() => onPresentationSelect(presentation)}
          gradientIndex={index}
        />
      ))}
    </div>
  );
}

// Helper function to get gradient classes that match the image
function getGradientClass(index: number): string {
  const gradients = [
    'bg-gradient-to-br from-cyan-300 to-blue-400',     // Light blue (HTML Demo)
    'bg-gradient-to-br from-orange-400 to-yellow-400', // Orange-yellow (Business)
    'bg-gradient-to-br from-pink-300 to-rose-400',     // Pink (Web Dev)
    'bg-gradient-to-br from-blue-400 to-cyan-500',     // Blue (Project)
  ];
  return gradients[index % gradients.length];
}