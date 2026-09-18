import { BrandConfig } from '@/types/branding';

export const BRANDS: Record<string, BrandConfig> = {
  onestep: {
    id: 'onestep',
    name: 'TwoStep Forward',
    tagline: 'Enterprise Learning Platform',
    logo: {
      text: 'TwoStep Forward',
      imageUrl: '/logo.png',
      iconUrl: '/logo-icon.png',
    },
    faviconUrl: '/favicon.ico',
    colors: {
      light: {
        primary: '#E11D48',         // Vibrant crimson/rose accent as seen in active tabs
        primaryHover: '#BE123C',
        primaryActive: '#9F1239',
        accent: '#2563EB',          // Blue highlights
        background: '#F8FAFC',      // Slate 50 clean background
        surface: '#FFFFFF',         // Pure white cards & nav
        surfaceMuted: '#F1F5F9',   // Slate 100
        border: '#E2E8F0',          // Slate 200
        textPrimary: '#0F172A',     // Slate 900
        textMuted: '#64748B',       // Slate 500
      },
      dark: {
        primary: '#FB7185',
        primaryHover: '#F43F5E',
        primaryActive: '#E11D48',
        accent: '#60A5FA',
        background: '#0B0F19',
        surface: '#111827',
        surfaceMuted: '#1F2937',
        border: '#374151',
        textPrimary: '#F9FAFB',
        textMuted: '#9CA3AF',
      },
    },
  },
  skillcore: {
    id: 'skillcore',
    name: 'SkillCore',
    tagline: 'Professional Academy LMS',
    logo: {
      text: 'SkillCore',
    },
    faviconUrl: '/favicon.ico',
    colors: {
      light: {
        primary: '#0D9488',         // Teal primary
        primaryHover: '#0F766E',
        primaryActive: '#115E59',
        accent: '#4F46E5',          // Indigo accent
        background: '#F9FAFB',
        surface: '#FFFFFF',
        surfaceMuted: '#F3F4F6',
        border: '#E5E7EB',
        textPrimary: '#111827',
        textMuted: '#6B7280',
      },
      dark: {
        primary: '#2DD4BF',
        primaryHover: '#14B8A6',
        primaryActive: '#0D9488',
        accent: '#818CF8',
        background: '#0F172A',
        surface: '#1E293B',
        surfaceMuted: '#334155',
        border: '#475569',
        textPrimary: '#F8FAFC',
        textMuted: '#94A3B8',
      },
    },
  },
};

export const DEFAULT_BRAND_ID = 'onestep';

export function getActiveBrand(brandId?: string): BrandConfig {
  const rawId = brandId || process.env.NEXT_PUBLIC_BRAND_ID || DEFAULT_BRAND_ID;
  const normalizedId = rawId.toLowerCase();
  return BRANDS[normalizedId] || BRANDS[DEFAULT_BRAND_ID];
}
