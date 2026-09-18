import type { Metadata } from 'next';
import { getActiveBrand } from '@/lib/branding/config';
import { ThemeProvider } from '@/lib/branding/theme-provider';
import './globals.css';

const activeBrand = getActiveBrand();

export const metadata: Metadata = {
  title: {
    default: activeBrand.name,
    template: `%s | ${activeBrand.name}`,
  },
  description: `${activeBrand.name} - Enterprise Learning Management System`,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/logo-icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider brand={activeBrand}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
