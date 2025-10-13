import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PresentationService } from '@/lib/presentation-service';
import { PresentationViewer } from '@/components/presentation/presentation-viewer';

interface SlidePageProps {
  params: {
    folder: string;
    number: string;
  };
}

// Generate metadata for each slide
export async function generateMetadata({ params }: SlidePageProps): Promise<Metadata> {
  const slideNumber = parseInt(params.number, 10);
  
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
      title: `${presentation.title} - Slide ${slideNumber}`,
      description: `Slide ${slideNumber} from ${presentation.title}`,
      openGraph: {
        title: `${presentation.title} - Slide ${slideNumber}`,
        description: `Slide ${slideNumber} of ${presentation.slideCount}`,
        type: 'article',
      },
    };
  } catch (error) {
    return {
      title: 'Slide Error',
      description: 'Error loading slide metadata.',
    };
  }
}

export default async function SlidePage({ params }: SlidePageProps) {
  const service = new PresentationService();
  const slideNumber = parseInt(params.number, 10);
  
  try {
    const presentation = await service.getPresentation(params.folder);
    
    if (!presentation) {
      console.log(`Presentation not found: ${params.folder}`);
      notFound();
    }

    // Validate slide number
    if (isNaN(slideNumber) || slideNumber < 1 || slideNumber > presentation.slideCount) {
      console.log(`Invalid slide number: ${slideNumber} (max: ${presentation.slideCount})`);
      notFound();
    }

    return (
      <PresentationViewer 
        presentation={presentation} 
        initialSlide={slideNumber} 
      />
    );
  } catch (error) {
    console.error('Error loading slide:', error);
    notFound();
  }
}