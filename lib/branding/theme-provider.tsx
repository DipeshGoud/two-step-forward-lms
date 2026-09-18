import React from 'react';
import { BrandConfig } from '@/types/branding';

interface ThemeProviderProps {
  brand: BrandConfig;
  children: React.ReactNode;
}

export function ThemeProvider({ brand, children }: ThemeProviderProps) {
  const cssVariables = `
    :root {
      --brand-primary: ${brand.colors.light.primary};
      --brand-primary-hover: ${brand.colors.light.primaryHover};
      --brand-primary-active: ${brand.colors.light.primaryActive};
      --brand-accent: ${brand.colors.light.accent};
      --brand-bg: #F8FAFC;
      --brand-surface: #FFFFFF;
      --brand-surface-muted: #F1F5F9;
      --brand-border: #E2E8F0;
      --brand-text: #0F172A;
      --brand-text-muted: #64748B;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      {children}
    </>
  );
}
