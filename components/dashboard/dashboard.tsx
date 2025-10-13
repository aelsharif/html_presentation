'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Presentation, DashboardFilters, DiscoveryResult } from '@/lib/types';
import { PresentationGrid } from './presentation-grid';
import { RefreshCw, Search, Grid3X3, List } from 'lucide-react';

interface DashboardProps {
  initialPresentations: Presentation[];
  initialFilters: DashboardFilters;
  discoveryResult: DiscoveryResult;
}

export function Dashboard({ 
  initialPresentations, 
  initialFilters, 
  discoveryResult 
}: DashboardProps) {
  const router = useRouter();
  
  const [presentations, setPresentations] = useState<Presentation[]>(initialPresentations);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter presentations based on search
  const filteredPresentations = useMemo(() => {
    if (!searchTerm.trim()) {
      return presentations;
    }

    const search = searchTerm.toLowerCase();
    return presentations.filter(presentation => 
      presentation.title.toLowerCase().includes(search) ||
      presentation.description?.toLowerCase().includes(search) ||
      presentation.author?.toLowerCase().includes(search) ||
      presentation.folder.toLowerCase().includes(search)
    );
  }, [presentations, searchTerm]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would make an API call
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresentationSelect = (presentation: Presentation) => {
    router.push(`/presentation/${presentation.folder}/slide/1`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-medium text-white">
              Presentation Dashboard
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{presentations.length} Presentations</span>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search presentations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-white">
              Available Presentations
            </h2>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Refresh presentations"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {filteredPresentations.length > 0 ? (
            <PresentationGrid
              presentations={filteredPresentations}
              onPresentationSelect={handlePresentationSelect}
              viewMode={viewMode}
            />
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-500 mb-4">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {searchTerm ? 'No presentations found' : 'No presentations available'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm 
                  ? `No presentations match "${searchTerm}". Try a different search term.`
                  : "Add some presentation folders to the slides/ directory to get started."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}