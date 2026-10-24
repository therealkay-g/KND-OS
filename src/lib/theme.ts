/**
 * Charte KND OS — source : docs/03-design.md
 * Fond noir, cartes gris très foncé, accent jaune #FFC300.
 */

export const colors = {
  background: '#0A0A0A',
  backgroundElevated: '#111111',
  card: '#1A1A1A',
  cardSoft: '#141414',
  accent: '#FFC300',
  accentSoft: 'rgba(255, 195, 0, 0.12)',
  accentBorder: 'rgba(255, 195, 0, 0.35)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: '#27272A',
  borderStrong: '#3F3F46',
  red: '#EF4444',
  redSoft: 'rgba(239, 68, 68, 0.10)',
  redBorder: 'rgba(239, 68, 68, 0.35)',
  orange: '#F97316',
  orangeSoft: 'rgba(249, 115, 22, 0.10)',
  green: '#22C55E',
  greenSoft: 'rgba(34, 197, 94, 0.12)',
  greenBorder: 'rgba(34, 197, 94, 0.30)',
  white: '#FFFFFF',
  black: '#0A0A0A',
  overlay: 'rgba(0, 0, 0, 0.72)',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const layout = {
  maxWidth: 1080,
  formWidth: 440,
  navWidth: 620,
  gutter: 20,
  navHeight: 68,
  navBottom: 12,
  // Hauteur réservée sous le contenu pour la barre de navigation flottante.
  contentBottom: 128,
} as const;

export const typography = {
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  display: { fontFamily: fonts.extraBold, fontSize: 28, lineHeight: 34 },
  subtitle: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  price: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 },
} as const;
