import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'squash — Local Image Converter, Compressor & Resizer',
    short_name: 'squash',
    description:
      'Smaller files. Sharper workflow. Convert, compress, and resize images 100% locally in your browser with offline support.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#171A24',
    theme_color: '#171A24',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
