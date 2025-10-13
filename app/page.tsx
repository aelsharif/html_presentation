import React from 'react';
import { Metadata } from 'next';
import { PresentationService } from '@/lib/presentation-service';
import { Dashboard } from '@/components/dashboard/dashboard';

export const metadata: Metadata = {
  title: 'Presentation Dashboard | HTML Presentation System',
  description: 'Browse and manage your HTML presentations with advanced discovery and search capabilities.',
  keywords: ['presentations', 'HTML', 'slides', 'dashboard', 'viewer'],
  authors: [{ name: 'HTML Presentation System' }],
  openGraph: {
    title: 'HTML Presentation System',
    description: 'Modern presentation system with zero 404 errors and advanced discovery.',
    type: 'website',
  },
};

export const dynamic = 'force-static';

export default async function HomePage() {
  try {
    // Server-side presentation discovery - NO 404 ERRORS!
    const service = new PresentationService();
    const discoveryResult = await service.discoverPresentations();
    
    return (
      <main className="min-h-screen bg-gray-900">
        <Dashboard 
          initialPresentations={discoveryResult.presentations}
          initialFilters={{
            search: '',
            author: '',
            sortBy: 'title',
            sortOrder: 'asc',
            viewMode: 'grid'
          }}
          discoveryResult={discoveryResult}
        />
      </main>
    );
  } catch (error) {
    console.error('Failed to load presentations:', error);
    
    return (
      <main className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-500 mb-4">
              Error Loading Presentations
            </h1>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <div className="bg-gray-800 p-4 rounded-lg max-w-lg mx-auto text-left">
              <p className="font-medium mb-2 text-white">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                <li>Ensure the <code className="bg-gray-700 px-1 rounded text-white">slides/</code> directory exists</li>
                <li>Check that presentation folders contain valid HTML files</li>
                <li>Verify file permissions allow reading</li>
                <li>Check server logs for detailed error information</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    );
  }
}