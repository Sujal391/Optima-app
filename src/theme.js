// ─── Design Tokens ──────────────────────────────────────────────────────────
// Aesthetic: Rewa Water — clean teal, indigo, cyan on light airy background
// Fonts: Use Inter/System Sans (body) + DM Sans (clean body)

export const COLORS = {
  // Primary palette  (teal-500 brand)
  burgundy: '#14b8a6',        // teal-500  — primary buttons, active states
  burgundyLight: '#0d9488',   // teal-600  — hover / pressed
  burgundyDark: '#164e63',    // cyan-900  — top nav / header backgrounds
  burgundyMuted: '#14b8a622', // teal-500 at 13 % opacity

  // Accent  (indigo-600)
  gold: '#4f46e5',            // indigo-600 — secondary brand, icons
  goldLight: '#818cf8',       // indigo-400 — light accent text
  goldMuted: '#4f46e522',     // indigo at 13 % opacity

  // Neutrals
  cream: '#ecfeff',           // cyan-50
  creamDark: '#e0f2fe',       // sky-100
  surface: '#FFFFFF',
  surfaceElevated: '#f8fafc', // slate-50

  // Text
  textPrimary: '#1e293b',     // slate-800
  textSecondary: '#4b5563',   // gray-600
  textMuted: '#9ca3af',       // gray-400
  textInverse: '#ffffff',

  // Semantic
  success: '#2D7A4F',
  successLight: '#E6F5ED',
  error: '#C0392B',
  errorLight: '#FDECEA',
  warning: '#D4860B',
  warningLight: '#FEF3E2',

  // Borders
  border: '#e5e7eb',          // gray-200
  borderStrong: '#d1d5db',    // gray-300

  // Background
  background: '#f0fdff',      // very light cyan — airy feel
  backgroundDark: '#e0f2fe',  // sky-100
};

export const TYPOGRAPHY = {
  // Font families — install with expo-font
  displayFont: 'DMSans_700Bold',
  displayItalic: 'DMSans_700Bold',
  bodyFont: 'DMSans_400Regular',
  bodySemiBold: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',

  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#0f172a',   // slate-900
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};
