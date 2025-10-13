import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PresentationService } from '@/lib/presentation-service';

interface PresentationPageProps {
  params: {
    folder: string;
  };
}

// Generate metadata for each presentation
export async function generateMetadata({ params }: PresentationPageProps): Promise<Metadata> {
  try {
    const service = new PresentationService();
    const presentation = await service.getPresentation(params.folder);
    
    if (!presentation) {
      return {
        title: 'Presentation Not Found',
        description: 'The requested presentation could not be found.',
      };
    }

    return {
      title: `${presentation.title} - Presentation System`,
      description: presentation.description || `View ${presentation.title} presentation with ${presentation.slideCount} slides`,
      openGraph: {
        title: presentation.title,
        description: presentation.description || `Presentation with ${presentation.slideCount} slides`,
        type: 'article',
      },
    };
  } catch (error) {
    return {
      title: 'Presentation Error',
      description: 'Error loading presentation metadata.',
    };
  }
}

export default async function PresentationPage({ params }: PresentationPageProps) {
  try {
    const service = new PresentationService();
    const presentation = await service.getPresentation(params.folder);
    
    if (!presentation) {
      console.log(`Presentation not found: ${params.folder}`);
      notFound();
    }

    // Redirect to first slide
    redirect(`/presentation/${params.folder}/slide/1/`);
  } catch (error) {
    console.error('Error loading presentation:', error);
    notFound();
  }
}