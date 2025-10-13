// Core presentation types
export interface SlideConfig {
  number: number;
  path: string;
  title: string;
  description?: string;
  thumbnail?: string;
}

export interface PresentationConfig {
  title: string;
  description: string;
  author: string;
  created: string;
  version?: string;
  thumbnail?: string;
  slides: SlideConfig[];
  settings?: PresentationSettings;
  tags?: string[];
  category?: string;
}

export interface PresentationSettings {
  autoAdvance?: boolean;
  slideTimer?: number;
  showThumbnails?: boolean;
  allowFullscreen?: boolean;
  keyboardNavigation?: boolean;
  theme?: PresentationTheme;
}

export interface PresentationTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
}

// Enhanced presentation data with metadata
export interface Presentation extends PresentationConfig {
  id: string;
  folder: string;
  slideCount: number;
  lastModified?: string;
  fileSize?: number;
  slug: string;
}

// Slide data with content
export interface SlideData extends SlideConfig {
  content?: string;
  htmlContent?: string;
  metadata?: SlideMetadata;
}

export interface SlideMetadata {
  duration?: number;
  notes?: string;
  animations?: AnimationConfig[];
  interactive?: boolean;
}

export interface AnimationConfig {
  type: 'fadeIn' | 'slideIn' | 'zoom' | 'flip';
  duration: number;
  delay?: number;
  easing?: string;
}

// Discovery and search types
export interface DiscoveryResult {
  presentations: Presentation[];
  totalCount: number;
  discoveredAt: string;
  duration: number;
  errors?: DiscoveryError[];
}

export interface DiscoveryError {
  folder: string;
  error: string;
  severity: 'warning' | 'error';
}

export interface SearchParams {
  query?: string;
  author?: string;
  category?: string;
  tags?: string[];
  sortBy?: 'title' | 'author' | 'created' | 'modified' | 'slideCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  presentations: Presentation[];
  totalCount: number;
  query: SearchParams;
  executionTime: number;
}

// Navigation and UI types
export interface NavigationState {
  currentSlide: number;
  totalSlides: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
}

export interface DashboardFilters {
  search: string;
  author: string;
  category?: string;
  tags?: string[];
  viewMode: 'grid' | 'list';
  sortBy: 'title' | 'author' | 'created' | 'slideCount';
  sortOrder: 'asc' | 'desc';
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

// Configuration types
export interface AppConfig {
  discovery: {
    enabled: boolean;
    cacheDuration: number;
    maxRetries: number;
    timeout: number;
  };
  ui: {
    defaultView: 'grid' | 'list';
    itemsPerPage: number;
    enableAnimations: boolean;
    theme: 'dark' | 'light' | 'auto';
  };
  performance: {
    preloadSlides: boolean;
    lazyLoadImages: boolean;
    compressionEnabled: boolean;
  };
}

// Event types for analytics
export interface PresentationEvent {
  type: 'view' | 'navigate' | 'fullscreen' | 'search' | 'filter';
  presentationId: string;
  slideNumber?: number;
  timestamp: string;
  duration?: number;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// Export utility type helpers
export type PresentationSummary = Pick<Presentation, 'id' | 'title' | 'author' | 'slideCount' | 'created'>;
export type SlidePreview = Pick<SlideData, 'number' | 'title' | 'thumbnail'>;
export type PresentationCard = PresentationSummary & { thumbnail?: string; description: string; folder: string; };

// Form and validation types
export interface CreatePresentationForm {
  title: string;
  description: string;
  author: string;
  category?: string;
  tags?: string[];
  settings?: Partial<PresentationSettings>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}