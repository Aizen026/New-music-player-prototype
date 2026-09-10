import { AppTheme } from '../types/monochrome';

export interface ThemeDefinition {
  id: AppTheme;
  name: string;
  tagline: string;
  badge: string;
  previewBg: string;
  previewAccent: string;
  isLight?: boolean;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    tagline: 'Apple iOS & visionOS fluid acrylic glass with ambient dynamic glow',
    badge: 'Apple Style',
    previewBg: 'bg-gradient-to-tr from-indigo-900 via-purple-900 to-pink-800',
    previewAccent: '#38bdf8',
  },
  {
    id: 'monochrome-dark',
    name: 'OLED Pitch Black',
    tagline: 'Minimalist deep obsidian canvas with crisp silver contrast',
    badge: 'Classic',
    previewBg: 'bg-zinc-950',
    previewAccent: '#fafafa',
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    tagline: 'Deep oceanic navy with glowing electric cyan & sapphire accents',
    badge: 'HiFi',
    previewBg: 'bg-[#070e1c]',
    previewAccent: '#06b6d4',
  },
  {
    id: 'cyber-amber',
    name: 'Sunset Neon',
    tagline: 'Smoky twilight dusk with radiant amber, coral, and violet notes',
    badge: 'Warm',
    previewBg: 'bg-[#120a09]',
    previewAccent: '#f59e0b',
  },
  {
    id: 'studio-light',
    name: 'Studio Light',
    tagline: 'Ultra-clean architectural gallery white with high-contrast slate typography',
    badge: 'Light',
    previewBg: 'bg-slate-100',
    previewAccent: '#0f172a',
    isLight: true,
  },
];
