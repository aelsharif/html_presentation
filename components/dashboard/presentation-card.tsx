'use client';

import React from 'react';
import { Presentation } from '@/lib/types';

interface PresentationCardProps {
  presentation: Presentation;
  onClick: () => void;
  gradientIndex: number;
}

export function PresentationCard({ presentation, onClick, gradientIndex }: PresentationCardProps) {
  // Gradient classes that match the image exactly
  const gradients = [
    'bg-gradient-to-br from-cyan-300 to-blue-400',     // Light blue
    'bg-gradient-to-br from-orange-400 to-yellow-400', // Orange-yellow  
    'bg-gradient-to-br from-pink-300 to-rose-400',     // Pink
    'bg-gradient-to-br from-blue-400 to-cyan-500',     // Blue
  ];

  const gradientClass = gradients[gradientIndex % gradients.length];

  return (
    <div
      onClick={onClick}
      className="group relative bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-xl border border-gray-700 hover:border-gray-600"
    >
      {/* Gradient Header */}
      <div className={`h-32 ${gradientClass} relative`}>
        {/* Slide Count Badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-black bg-opacity-20 text-white px-2 py-1 rounded text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v4H6V6z" clipRule="evenodd" />
            </svg>
            {presentation.slideCount}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-blue-400 transition-colors">
          {presentation.title}
        </h3>
        
        {/* Description */}
        {presentation.description && (
          <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
            {presentation.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span>{presentation.author || 'System Demo'}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>
              {presentation.created ? new Date(presentation.created).toLocaleDateString('en-US', { 
                month: 'numeric', 
                day: 'numeric',
                year: 'numeric'
              }) : '1/12/2025'}
            </span>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}