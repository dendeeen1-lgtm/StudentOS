export const Colors = {
  // Brand
  primary: '#3D2FA9',
  primaryLight: '#6B5DD3',
  primaryDark: '#2A1F7A',
  primarySurface: '#EEEDFe',

  // Background
  background: '#0F0E2A',
  backgroundCard: '#1A1940',
  backgroundElevated: '#232250',
  backgroundInput: '#1E1D3F',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A8A6C8',
  textTertiary: '#6B698A',
  textInverse: '#0F0E2A',

  // Status
  present: '#22C55E',
  presentSurface: '#14532D',
  late: '#F59E0B',
  lateSurface: '#78350F',
  absent: '#EF4444',
  absentSurface: '#7F1D1D',
  excused: '#8B5CF6',
  excusedSurface: '#4C1D95',
  outside: '#06B6D4',
  outsideSurface: '#164E63',
  pending: '#94A3B8',
  pendingSurface: '#1E293B',

  // UI
  border: '#2E2C5E',
  borderLight: '#3D3B6E',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.6)',
  cardShadow: 'rgba(61, 47, 169, 0.3)',
};

export const StatusColors: Record<string, { bg: string; text: string; dot: string }> = {
  present:  { bg: Colors.presentSurface,  text: Colors.present,  dot: Colors.present },
  late:     { bg: Colors.lateSurface,     text: Colors.late,     dot: Colors.late },
  absent:   { bg: Colors.absentSurface,   text: Colors.absent,   dot: Colors.absent },
  excused:  { bg: Colors.excusedSurface,  text: Colors.excused,  dot: Colors.excused },
  outside:  { bg: Colors.outsideSurface,  text: Colors.outside,  dot: Colors.outside },
  pending:  { bg: Colors.pendingSurface,  text: Colors.pending,  dot: Colors.pending },
};
