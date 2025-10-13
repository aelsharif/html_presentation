import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Presentation, SearchParams, DashboardFilters } from "./types";

/**
 * Utility for merging Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return 'Unknown date';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 7) {
      return formatDate(dateString);
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  } catch {
    return 'Unknown';
  }
}

/**
 * Generate presentation URL
 */
export function getPresentationUrl(folder: string, slideNumber?: number): string {
  const base = `/presentation/${encodeURIComponent(folder)}`;
  return slideNumber ? `${base}/slide/${slideNumber}` : base;
}

/**
 * Generate slide URL
 */
export function getSlideUrl(folder: string, slideNumber: number): string {
  return `/presentation/${encodeURIComponent(folder)}/slide/${slideNumber}`;
}

/**
 * Generate dashboard URL with filters
 */
export function getDashboardUrl(filters?: Partial<DashboardFilters>): string {
  if (!filters) return '/';
  
  const params = new URLSearchParams();
  
  if (filters.search) params.set('search', filters.search);
  if (filters.author) params.set('author', filters.author);
  if (filters.category) params.set('category', filters.category);
  if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  if (filters.viewMode && filters.viewMode !== 'grid') params.set('view', filters.viewMode);
  if (filters.sortBy && filters.sortBy !== 'title') params.set('sort', filters.sortBy);
  if (filters.sortOrder && filters.sortOrder !== 'asc') params.set('order', filters.sortOrder);
  
  const queryString = params.toString();
  return queryString ? `/?${queryString}` : '/';
}

/**
 * Parse search params from URL
 */
export function parseSearchParams(searchParams: URLSearchParams): DashboardFilters {
  return {
    search: searchParams.get('search') || '',
    author: searchParams.get('author') || '',
    category: searchParams.get('category') || '',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    viewMode: (searchParams.get('view') as 'grid' | 'list') || 'grid',
    sortBy: searchParams.get('sort') || 'title',
    sortOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc'
  };
}

/**
 * Filter presentations based on search criteria
 */
export function filterPresentations(
  presentations: Presentation[],
  filters: DashboardFilters
): Presentation[] {
  let filtered = [...presentations];

  // Text search
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.author.toLowerCase().includes(query) ||
      p.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Author filter
  if (filters.author) {
    filtered = filtered.filter(p => 
      p.author.toLowerCase().includes(filters.author.toLowerCase())
    );
  }

  // Category filter
  if (filters.category) {
    filtered = filtered.filter(p => p.category === filters.category);
  }

  // Tags filter
  if (filters.tags.length > 0) {
    filtered = filtered.filter(p => 
      p.tags?.some(tag => filters.tags.includes(tag))
    );
  }

  return filtered;
}

/**
 * Sort presentations
 */
export function sortPresentations(
  presentations: Presentation[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Presentation[] {
  const sorted = [...presentations];
  
  sorted.sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortBy) {
      case 'title':
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
        break;
      case 'author':
        aVal = a.author.toLowerCase();
        bVal = b.author.toLowerCase();
        break;
      case 'created':
        aVal = new Date(a.created).getTime();
        bVal = new Date(b.created).getTime();
        break;
      case 'modified':
        aVal = new Date(a.lastModified || a.created).getTime();
        bVal = new Date(b.lastModified || b.created).getTime();
        break;
      case 'slideCount':
        aVal = a.slideCount;
        bVal = b.slideCount;
        break;
      default:
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Validate presentation folder name
 */
export function validateFolderName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Folder name is required' };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Folder name must be less than 100 characters' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { isValid: false, error: 'Folder name can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { isValid: true };
}

/**
 * Generate random presentation colors
 */
export function generatePresentationColors(seed: string): string[] {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-teal-500',
    'from-green-500 to-blue-500',
    'from-yellow-500 to-red-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-green-500',
    'from-orange-500 to-pink-500'
  ];
  
  // Simple hash function for consistent colors
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return colors[Math.abs(hash) % colors.length].split(' ');
}

/**
 * Extract presentation thumbnail from slides
 */
export function getPresetationThumbnail(presentation: Presentation): string | null {
  // Check for explicit thumbnail
  if (presentation.thumbnail) {
    return presentation.thumbnail;
  }
  
  // Check first slide for thumbnail
  const firstSlide = presentation.slides[0];
  if (firstSlide?.thumbnail) {
    return `/slides/${presentation.folder}/${firstSlide.thumbnail}`;
  }
  
  return null;
}

/**
 * Calculate reading time for presentation
 */
export function calculatePresentationDuration(slideCount: number): string {
  const averageSlideTime = 2; // 2 minutes per slide
  const totalMinutes = slideCount * averageSlideTime;
  
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Escape HTML content
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Check if running on server side
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}