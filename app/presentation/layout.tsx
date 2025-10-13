import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s - Presentation System',
    default: 'Presentation System',
  },
  description: 'Interactive HTML presentation system with navigation and slideshow features',
  keywords: ['presentations', 'slides', 'HTML', 'interactive', 'navigation'],
  authors: [{ name: 'Presentation System' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Presentation System',
  },
};

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="presentation-layout">
      {children}
    </div>
  );
}