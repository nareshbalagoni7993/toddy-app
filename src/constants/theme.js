// Legacy theme constants (used by screens not yet migrated to ThemeContext)
// New screens should use useTheme() from ThemeContext.js

export const COLORS = {
  primary: '#2d8653',
  primaryDark: '#1a4a2e',
  primaryLight: '#4caf7d',
  primaryGlass: 'rgba(45,134,83,0.15)',
  accent: '#f4c842',
  accentLight: '#ffd966',
  bgDark: '#0d1f14',
  bgMedium: '#142a1c',
  bgLight: '#1e3d2a',
  bgCard: 'rgba(255,255,255,0.07)',
  bgCardLight: 'rgba(255,255,255,0.12)',
  glassBg: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.45)',
  textDark: '#0d1f14',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.5)',
  overlayDark: 'rgba(0,0,0,0.75)',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  statusPlaced: '#64b5f6',
  statusAccepted: '#81c784',
  statusPreparing: '#ffb74d',
  statusReady: '#4db6ac',
  statusOutForDelivery: '#7986cb',
  statusDelivered: '#4caf50',
  statusCancelled: '#ef5350',
  gradientPrimary: ['#1a4a2e', '#2d8653'],
  gradientCard: ['rgba(45,134,83,0.3)', 'rgba(20,42,28,0.8)'],
  gradientHero: ['rgba(13,31,20,0.1)', 'rgba(13,31,20,0.95)'],
  gradientSplash: ['#0d1f14', '#1a4a2e', '#2d8653'],
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    hero: 38,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#2d8653',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#2d8653',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};
