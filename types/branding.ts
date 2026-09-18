export interface BrandColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  accent: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textMuted: string;
}

export interface BrandConfig {
  id: string;
  name: string;
  tagline?: string;
  logo: {
    text: string;
    iconSvg?: string;
    imageUrl?: string;
    iconUrl?: string;
  };
  faviconUrl: string;
  colors: {
    light: BrandColors;
    dark: BrandColors;
  };
}
