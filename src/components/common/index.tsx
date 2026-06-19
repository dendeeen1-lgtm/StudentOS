import React from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleProp,
  Modal,
  KeyboardTypeOptions,
} from 'react-native';
import { Colors, FontSize, FontWeight, StatusColors, StatusLabel } from '../../constants';
import { ScalePress } from '../animations';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', loading, disabled, style, size = 'md',
}) => {
  const bgMap = {
    primary: Colors.primary,
    secondary: Colors.backgroundElevated,
    danger: Colors.absent,
    ghost: Colors.transparent,
  };
  const textMap = {
    primary: Colors.white,
    secondary: Colors.textPrimary,
    danger: Colors.white,
    ghost: Colors.primary,
  };
  const padMap = { sm: 10, md: 14, lg: 18 };
  const fontMap = { sm: FontSize.sm, md: FontSize.base, lg: FontSize.md };

  return (
    <ScalePress onPress={onPress} disabled={disabled || loading} style={style}>
      <View style={[
        styles.btn,
        { backgroundColor: bgMap[variant], paddingVertical: padMap[size], opacity: disabled ? 0.5 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: Colors.primary },
      ]}>
        {loading
          ? <ActivityIndicator color={textMap[variant]} size="small" />
          : <Text style={[styles.btnText, { color: textMap[variant], fontSize: fontMap[size] }]}>{label}</Text>
        }
      </View>
    </ScalePress>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <ScalePress onPress={onPress} style={[styles.card, style]}>
        <View>{children}</View>
      </ScalePress>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const Input: React.FC<InputProps> = ({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType = 'default', multiline, numberOfLines, style, error, autoCapitalize,
}) => (
  <View style={[styles.inputWrap, style]}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        multiline && { height: (numberOfLines ?? 3) * 24, textAlignVertical: 'top', paddingTop: 12 },
        error && { borderColor: Colors.danger },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize={autoCapitalize ?? 'sentences'}
    />
    {error ? <Text style={styles.inputError}>{error}</Text> : null}
  </View>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  status: string;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ status, style }) => {
  const colors = StatusColors[status] ?? StatusColors['pending'];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <View style={[styles.badgeDot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {StatusLabel[status] ?? status}
      </Text>
    </View>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 40, style }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const colors = [Colors.primary, Colors.primaryLight, '#E91E8C', '#00BCD4', '#4CAF50'];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      style,
    ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
};

// ─── LoadingOverlay ───────────────────────────────────────────────────────────
export const LoadingOverlay: React.FC<{ visible: boolean; message?: string }> = ({
  visible, message,
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {message ? <Text style={styles.overlayText}>{message}</Text> : null}
      </View>
    </View>
  </Modal>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; style?: StyleProp<TextStyle> }> = ({
  title, style,
}) => (
  <Text style={[styles.sectionHeader, style]}>{title}</Text>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
export const Divider: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[styles.divider, style]} />
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnText: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  inputWrap: { marginBottom: 16 },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputError: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontWeight: FontWeight.bold },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    minWidth: 140,
  },
  overlayText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
});
