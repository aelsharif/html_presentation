import fs from 'fs/promises';
import path from 'path';
import { Presentation, PresentationConfig, SlideConfig, DiscoveryResult, DiscoveryError } from './types';

/**
 * Server-side presentation discovery service
 * Eliminates all 404 errors by using file system APIs
 */
export class PresentationService {
  private slidesDir: string;
  private cache: Map<string, Presentation> = new Map();
  private lastScanTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

  constructor(slidesPath: string = 'slides') {
    this.slidesDir = path.join(process.cwd(), slidesPath);
  }

  /**
   * Discover all presentations - NO 404 ERRORS!
   */
  async discoverPresentations(): Promise<DiscoveryResult> {
    console.log('🔍 Starting server-side presentation discovery...');
    const startTime = Date.now();
    
    try {
      // Check if slides directory exists
      await this.ensureSlidesDirectory();
      
      // Get all folders in slides directory
      const folders = await this.getFolders();
      console.log(`📁 Found ${folders.length} potential presentation folders`);
      
      const presentations: Presentation[] = [];
      const errors: DiscoveryError[] = [];
      
      // Process each folder in parallel for speed
      const results = await Promise.allSettled(
        folders.map(folder => this.processPresentationFolder(folder))
      );
      
      results.forEach((result, index) => {
        const folder = folders[index];
        
        if (result.status === 'fulfilled' && result.value) {
          presentations.push(result.value);
          console.log(`✅ Successfully loaded: ${folder}`);
        } else {
          const error: DiscoveryError = {
            folder,
            error: result.status === 'rejected' ? result.reason?.message || 'Unknown error' : 'No presentation data',
            severity: 'warning'
          };
          errors.push(error);
          console.log(`⚠️  Skipped invalid folder: ${folder}`);
        }
      });
      
      // Sort presentations by title
      presentations.sort((a, b) => a.title.localeCompare(b.title));
      
      const executionTime = Date.now() - startTime;
      
      const discoveryResult: DiscoveryResult = {
        presentations,
        totalCount: presentations.length,
        discoveredAt: new Date().toISOString(),
        duration: executionTime,
        errors: errors.length > 0 ? errors : undefined
      };
      console.log(`🎯 Discovery complete: Found ${presentations.length} presentations in ${executionTime}ms`);
      
      return discoveryResult;
      
    } catch (error) {
      console.error('❌ Discovery failed:', error);
      throw new Error(`Presentation discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific presentation by folder name
   */
  async getPresentation(folder: string): Promise<Presentation | null> {
    try {
      console.log(`🔍 Getting presentation: ${folder}`);
      console.log(`📁 Slides directory: ${this.slidesDir}`);
      
      const result = await this.processPresentationFolder(folder);
      console.log(`✅ Presentation result:`, result ? `${result.title} (${result.slideCount} slides)` : 'null');
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to load presentation ${folder}:`, error);
      return null;
    }
  }

  /**
   * Get slide content for a specific presentation and slide number
   */
  async getSlideContent(folder: string, slideNumber: number): Promise<string | null> {
    try {
      const presentation = await this.getPresentation(folder);
      if (!presentation) return null;
      
      const slide = presentation.slides.find(s => s.number === slideNumber);
      if (!slide) return null;
      
      const slidePath = path.join(this.slidesDir, folder, slide.path);
      const content = await fs.readFile(slidePath, 'utf-8');
      
      return content;
    } catch (error) {
      console.error(`Failed to load slide content for ${folder}/${slideNumber}:`, error);
      return null;
    }
  }

  /**
   * Private: Ensure slides directory exists
   */
  private async ensureSlidesDirectory(): Promise<void> {
    try {
      await fs.access(this.slidesDir);
    } catch {
      throw new Error(`Slides directory not found: ${this.slidesDir}`);
    }
  }

  /**
   * Private: Get all folders in slides directory
   */
  private async getFolders(): Promise<string[]> {
    const items = await fs.readdir(this.slidesDir, { withFileTypes: true });
    return items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .filter(name => !name.startsWith('.')) // Skip hidden folders
      .sort();
  }

  /**
   * Private: Process a single presentation folder
   */
  private async processPresentationFolder(folder: string): Promise<Presentation | null> {
    const folderPath = path.join(this.slidesDir, folder);
    
    try {
      // Try to load config.json
      const config = await this.loadPresentationConfig(folderPath);
      
      // If no config, try to auto-generate from slides
      const slides = config?.slides || await this.discoverSlides(folderPath);
      
      if (slides.length === 0) {
        return null; // No slides found
      }
      
      // Get folder stats for metadata
      const stats = await fs.stat(folderPath);
      
      const presentation: Presentation = {
        id: folder,
        folder,
        slug: this.generateSlug(folder),
        title: config?.title || this.generateTitle(folder),
        description: config?.description || `Auto-discovered presentation from ${folder}`,
        author: config?.author || 'Unknown',
        created: config?.created || stats.birthtime.toISOString().split('T')[0],
        lastModified: stats.mtime.toISOString(),
        slideCount: slides.length,
        slides,
        settings: config?.settings || {
          allowFullscreen: true,
          keyboardNavigation: true,
          showThumbnails: true
        },
        tags: config?.tags || [],
        category: config?.category,
        version: config?.version || '1.0'
      };
      
      return presentation;
      
    } catch (error) {
      console.error(`Error processing folder ${folder}:`, error);
      return null;
    }
  }

  /**
   * Private: Load presentation config.json if it exists
   */
  private async loadPresentationConfig(folderPath: string): Promise<PresentationConfig | null> {
    try {
      const configPath = path.join(folderPath, 'config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent) as PresentationConfig;
    } catch {
      return null; // Config file doesn't exist or is invalid
    }
  }

  /**
   * Private: Discover slides in a folder by scanning HTML files
   */
  private async discoverSlides(folderPath: string): Promise<SlideConfig[]> {
    try {
      const files = await fs.readdir(folderPath);
      const htmlFiles = files
        .filter(file => file.endsWith('.html'))
        .sort();
      
      const slides: SlideConfig[] = [];
      
      for (let i = 0; i < htmlFiles.length; i++) {
        const file = htmlFiles[i];
        const slideNumber = this.extractSlideNumber(file) || i + 1;
        const title = this.extractTitleFromFilename(file);
        
        slides.push({
          number: slideNumber,
          path: file,
          title,
          description: `Slide ${slideNumber} - ${title}`
        });
      }
      
      return slides.sort((a, b) => a.number - b.number);
    } catch (error) {
      console.error(`Error discovering slides in ${folderPath}:`, error);
      return [];
    }
  }

  /**
   * Private: Extract slide number from filename
   */
  private extractSlideNumber(filename: string): number | null {
    const match = filename.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Private: Extract title from filename
   */
  private extractTitleFromFilename(filename: string): string {
    const nameWithoutExt = filename.replace(/\.html$/, '');
    const withoutNumber = nameWithoutExt.replace(/^\d+[-_]?/, '');
    
    return withoutNumber
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Untitled Slide';
  }

  /**
   * Private: Generate title from folder name
   */
  private generateTitle(folder: string): string {
    return folder
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\b(presentation|slides?)\b/gi, 'Presentation');
  }

  /**
   * Private: Generate URL-friendly slug
   */
  private generateSlug(folder: string): string {
    return folder.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
}

// Export singleton instance
export const presentationService = new PresentationService();