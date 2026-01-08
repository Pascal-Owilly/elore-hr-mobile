import { Platform } from 'react-native';

// Your brand theme colors
export const THEME_COLORS = {
  // Primary brand colors
  cream: '#e9ded3',
  primaryBlue: '#0056b3',
  gold: '#deab63',
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  
  // Gray scale
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  
  // Border colors
  borderLight: '#e5e7eb',
  border: '#d1d5db',
  borderDark: '#9ca3af',
  
  // Background colors
  backgroundLight: '#f9fafb',
  background: '#ffffff',
  backgroundDark: '#f3f4f6',
  
  // Status colors
  success50: '#f0fdf4',
  success100: '#dcfce7',
  success200: '#bbf7d0',
  success300: '#86efac',
  success400: '#4ade80',
  success500: '#22c55e',
  success600: '#16a34a',
  success700: '#15803d',
  success800: '#166534',
  success900: '#14532d',
  
  warning50: '#fffbeb',
  warning100: '#fef3c7',
  warning200: '#fde68a',
  warning300: '#fcd34d',
  warning400: '#fbbf24',
  warning500: '#f59e0b',
  warning600: '#d97706',
  warning700: '#b45309',
  warning800: '#92400e',
  warning900: '#78350f',
  
  danger50: '#fef2f2',
  danger100: '#fee2e2',
  danger200: '#fecaca',
  danger300: '#fca5a5',
  danger400: '#f87171',
  danger500: '#ef4444',
  danger600: '#dc2626',
  danger700: '#b91c1c',
  danger800: '#991b1b',
  danger900: '#7f1d1d',
  
  info50: '#eff6ff',
  info100: '#dbeafe',
  info200: '#bfdbfe',
  info300: '#93c5fd',
  info400: '#60a5fa',
  info500: '#3b82f6',
  info600: '#2563eb',
  info700: '#1d4ed8',
  info800: '#1e40af',
  info900: '#1e3a8a',
};

// Semantic color mapping
export const Colors = {
  // Light mode colors
  light: {
    // Text colors
    text: THEME_COLORS.textPrimary,
    textSecondary: THEME_COLORS.textSecondary,
    textTertiary: THEME_COLORS.textTertiary,
    
    // Background colors
    background: THEME_COLORS.white,
    backgroundSecondary: THEME_COLORS.cream,
    backgroundTertiary: THEME_COLORS.gray50,
    
    // Surface colors
    surface: THEME_COLORS.white,
    surfaceSecondary: THEME_COLORS.cream,
    surfaceTertiary: THEME_COLORS.gray100,
    
    // Border colors
    border: THEME_COLORS.border,
    borderLight: THEME_COLORS.borderLight,
    borderDark: THEME_COLORS.borderDark,
    
    // Brand colors
    primary: THEME_COLORS.primaryBlue,
    secondary: THEME_COLORS.gold,
    accent: THEME_COLORS.cream,
    
    // Status colors
    success: THEME_COLORS.success600,
    warning: THEME_COLORS.warning600,
    danger: THEME_COLORS.danger600,
    info: THEME_COLORS.info600,
    
    // Icon colors
    icon: THEME_COLORS.gray600,
    iconSecondary: THEME_COLORS.gray400,
    iconTertiary: THEME_COLORS.gray300,
    
    // Tab bar
    tabIconDefault: THEME_COLORS.gray400,
    tabIconSelected: THEME_COLORS.primaryBlue,
    
    // Tint colors
    tint: THEME_COLORS.primaryBlue,
    tintSecondary: THEME_COLORS.gold,
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    
    // Status bar
    statusBar: 'light-content',
  },
  
  // Dark mode colors
  dark: {
    // Text colors
    text: THEME_COLORS.gray100,
    textSecondary: THEME_COLORS.gray300,
    textTertiary: THEME_COLORS.gray400,
    
    // Background colors
    background: THEME_COLORS.gray900,
    backgroundSecondary: THEME_COLORS.gray800,
    backgroundTertiary: THEME_COLORS.gray700,
    
    // Surface colors
    surface: THEME_COLORS.gray800,
    surfaceSecondary: THEME_COLORS.gray700,
    surfaceTertiary: THEME_COLORS.gray600,
    
    // Border colors
    border: THEME_COLORS.gray600,
    borderLight: THEME_COLORS.gray700,
    borderDark: THEME_COLORS.gray500,
    
    // Brand colors
    primary: THEME_COLORS.gold,
    secondary: THEME_COLORS.primaryBlue,
    accent: '#2a2a2a',
    
    // Status colors
    success: THEME_COLORS.success400,
    warning: THEME_COLORS.warning400,
    danger: THEME_COLORS.danger400,
    info: THEME_COLORS.info400,
    
    // Icon colors
    icon: THEME_COLORS.gray300,
    iconSecondary: THEME_COLORS.gray400,
    iconTertiary: THEME_COLORS.gray500,
    
    // Tab bar
    tabIconDefault: THEME_COLORS.gray400,
    tabIconSelected: THEME_COLORS.gold,
    
    // Tint colors
    tint: THEME_COLORS.gold,
    tintSecondary: THEME_COLORS.primaryBlue,
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowDark: 'rgba(0, 0, 0, 0.4)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
    
    // Status bar
    statusBar: 'dark-content',
  },
};

// Direct color exports for easy access (light mode by default)
export const {
  // Brand colors
  cream,
  primaryBlue,
  gold,
  
  // Neutral colors
  white,
  black,
  
  // Gray scale
  gray50,
  gray100,
  gray200,
  gray300,
  gray400,
  gray500,
  gray600,
  gray700,
  gray800,
  gray900,
  
  // Text colors
  textPrimary,
  textSecondary,
  textTertiary,
  
  // Border colors
  borderLight,
  border,
  borderDark,
  
  // Background colors
  backgroundLight,
  background,
  backgroundDark,
  
  // Status colors
  success50,
  success100,
  success200,
  success300,
  success400,
  success500,
  success600,
  success700,
  success800,
  success900,
  
  warning50,
  warning100,
  warning200,
  warning300,
  warning400,
  warning500,
  warning600,
  warning700,
  warning800,
  warning900,
  
  danger50,
  danger100,
  danger200,
  danger300,
  danger400,
  danger500,
  danger600,
  danger700,
  danger800,
  danger900,
  
  info50,
  info100,
  info200,
  info300,
  info400,
  info500,
  info600,
  info700,
  info800,
  info900,
} = THEME_COLORS;

// Semantic color helpers
export const ColorHelpers = {
  // Primary brand variations
  primaryBlue50: '#e6f0ff',
  primaryBlue100: '#cce0ff',
  primaryBlue200: '#99c2ff',
  primaryBlue300: '#66a3ff',
  primaryBlue400: '#3385ff',
  primaryBlue500: primaryBlue, // '#0056b3'
  primaryBlue600: '#004799',
  primaryBlue700: '#003880',
  primaryBlue800: '#002966',
  primaryBlue900: '#001a4d',
  
  gold50: '#faf6ef',
  gold100: '#f5ecdf',
  gold200: '#ebd9bf',
  gold300: '#e1c69f',
  gold400: '#d7b37f',
  gold500: gold, // '#deab63'
  gold600: '#c8994a',
  gold700: '#a87c3e',
  gold800: '#886032',
  gold900: '#684426',
  
  cream50: '#fbf9f7',
  cream100: '#f7f2ef',
  cream200: '#efe6df',
  cream300: '#e6d9ce',
  cream400: '#decdbe',
  cream500: cream, // '#e9ded3'
  cream600: '#d4c5b8',
  cream700: '#b3a69b',
  cream800: '#92887e',
  cream900: '#716961',
  
  // Gradient colors
  gradients: {
    primary: ['#0056b3', '#004799', '#003880'],
    secondary: ['#deab63', '#c8994a', '#a87c3e'],
    accent: ['#e9ded3', '#d4c5b8', '#b3a69b'],
    success: ['#22c55e', '#16a34a', '#15803d'],
    warning: ['#f59e0b', '#d97706', '#b45309'],
    danger: ['#ef4444', '#dc2626', '#b91c1c'],
  },
  
  // Opacity helpers
  withOpacity: (color: string, opacity: number) => {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
  
  // Status colors for different contexts
  status: {
    active: success600,
    pending: warning600,
    inactive: gray400,
    approved: success600,
    rejected: danger600,
    draft: gray400,
    submitted: info600,
  },
  
  // Department colors
  departments: {
    hr: primaryBlue,
    finance: success600,
    it: info600,
    operations: warning600,
    marketing: '#9333ea', // purple
    sales: danger600,
    support: '#0891b2', // cyan
    management: gold,
  },
  
  // Employment type colors
  employment: {
    permanent: success600,
    contract: warning600,
    casual: info600,
    probation: danger600,
    intern: '#9333ea', // purple
  },
};

// Font definitions
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
    
    // Custom fonts for iOS
    inter: 'Inter',
    interMedium: 'Inter-Medium',
    interSemiBold: 'Inter-SemiBold',
    interBold: 'Inter-Bold',
  },
  android: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    
    // Custom fonts for Android
    inter: 'Inter-Regular',
    interMedium: 'Inter-Medium',
    interSemiBold: 'Inter-SemiBold',
    interBold: 'Inter-Bold',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    
    inter: 'Inter',
    interMedium: 'Inter-Medium',
    interSemiBold: 'Inter-SemiBold',
    interBold: 'Inter-Bold',
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    
    inter: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    interMedium: "Inter Medium, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    interSemiBold: "Inter SemiBold, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    interBold: "Inter Bold, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
});

// Typography scale
export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  fontWeights: {
    thin: '100',
    extraLight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
  },
};

// Export everything as default
export default {
  THEME_COLORS,
  Colors,
  ColorHelpers,
  Fonts,
  Typography,
  ...THEME_COLORS,
};