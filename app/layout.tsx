import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s - Presentation System',
    default: 'Presentation System - Multi HTML Presentation Platform',
  },
  description: 'A comprehensive presentation platform supporting multiple presentations with centralized dashboard, keyboard navigation, and professional styling. Available in static HTML and Next.js versions.',
  keywords: ['presentations', 'slides', 'HTML', 'interactive', 'navigation', 'dashboard', 'Next.js', 'React'],
  authors: [{ name: 'Presentation System' }],
  creator: 'Presentation System',
  publisher: 'Presentation System',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Presentation System',
    title: 'Presentation System - Multi HTML Presentation Platform',
    description: 'Navigate between different presentation collections with keyboard navigation and professional styling.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Presentation System Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Presentation System - Multi HTML Presentation Platform',
    description: 'Navigate between different presentation collections with keyboard navigation and professional styling.',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1f2937" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}