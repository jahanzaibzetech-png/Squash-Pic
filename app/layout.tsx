import type { Metadata, Viewport } from 'next';
import { Manrope, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ImageWorkspaceProvider } from '@/hooks/use-image-workspace';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { OfflineIndicator } from '@/components/pwa/pwa-install-controls';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const baseUrl = process.env.APP_URL || 'https://squash.pixelforge.app';

export const viewport: Viewport = {
  themeColor: '#171A24',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'squash — Minimalist Image Converter, Compressor & Resizer',
    template: '%s | squash',
  },
  description:
    'Convert, compress, and resize images locally in your browser. Supports WebP, AVIF, PNG, JPEG, GIF, BMP, and SVG with batch ZIP export and before-after quality comparison.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'squash',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/src/assets/images/squash_favicon_mark_1791555380040.jpg', type: 'image/jpeg' },
    ],
    shortcut: '/pwa-192x192.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'squash — Minimalist Image Converter, Compressor & Resizer',
    description:
      'Smaller files. Sharper workflow. Convert, compress, and resize images locally in your browser with no account required.',
    url: baseUrl,
    siteName: 'squash',
    type: 'website',
    images: [
      {
        url: '/src/assets/images/squash_brand_logo_1791555366653.jpg',
        width: 1024,
        height: 1024,
        alt: 'squash logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'squash — Minimalist Image Converter, Compressor & Resizer',
    description:
      'Smaller files. Sharper workflow. Convert, compress, and resize images locally in your browser with no account required.',
    images: ['/src/assets/images/squash_brand_logo_1791555366653.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'squash',
    alternateName: 'PixelForge squash',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    description:
      'Convert, compress, and resize images locally in your browser with WebP, AVIF, PNG, and JPEG support, interactive quality comparison, and batch ZIP downloads.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col font-sans bg-[#F7F5F0] text-[#171A24] antialiased"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ImageWorkspaceProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <OfflineIndicator />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#171A24',
                color: '#F7F5F0',
                border: '1px solid #2A2E3D',
                fontSize: '13px',
              },
            }}
          />
        </ImageWorkspaceProvider>
      </body>
    </html>
  );
}

