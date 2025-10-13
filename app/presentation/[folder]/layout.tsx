import { PresentationService } from '@/lib/presentation-service';

interface PresentationLayoutProps {
  children: React.ReactNode;
  params: {
    folder: string;
  };
}

// Generate static params for all presentation folders
export async function generateStaticParams() {
  const service = new PresentationService();
  try {
    const result = await service.discoverPresentations();
    
    // Return all presentation folders for static generation
    return result.presentations.map((presentation) => ({
      folder: presentation.folder,
    }));
  } catch (error) {
    console.error('Error generating presentation static params:', error);
    return [];
  }
}

export default function PresentationLayout({ children, params }: PresentationLayoutProps) {
  return (
    <div className="presentation-folder-layout" data-folder={params.folder}>
      {children}
    </div>
  );
}

// Force static generation for all presentations
export const dynamic = 'force-static';