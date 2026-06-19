import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, UserRole } from '../../constants';
import { FadeInView, ScalePress } from '../../components/animations';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

const RoleCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  delay: number;
}> = ({ icon, title, subtitle, color, onPress, delay }) => (
  <FadeInView delay={delay} style={{ flex: 1 }}>
    <ScalePress onPress={onPress} style={{ flex: 1 }}>
      <View style={[styles.roleCard, { borderColor: color + '40' }]}>
        <View style={[styles.roleIconWrap, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleSub}>{subtitle}</Text>
      </View>
    </ScalePress>
  </FadeInView>
);

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, bounciness: 12, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const go = (role: UserRole) =>
    navigation.navigate('Login', { role });

  return (
    <SafeAreaView style={styles.container}>
      <FadeInView style={styles.header}>
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <Svg width={64} height={64} viewBox="0 0 64 64">
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#6B5DD3" />
                <Stop offset="1" stopColor="#3D2FA9" />
              </LinearGradient>
            </Defs>
            <Circle cx="32" cy="32" r="32" fill="url(#grad)" />
            <Path d="M20 24h24M20 32h16M20 40h20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <Circle cx="46" cy="40" r="6" fill="#22C55E" />
            <Path d="M43 40l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
        <FadeInView delay={200}>
          <Text style={styles.appName}>StudentOS</Text>
          <Text style={styles.tagline}>Section attendance, simplified.</Text>
        </FadeInView>
      </FadeInView>

      <FadeInView delay={400} style={styles.body}>
        <Text style={styles.chooseLabel}>Who are you?</Text>
        <View style={styles.roleGrid}>
          <View style={styles.roleRow}>
            <RoleCard
              delay={500}
              color={Colors.primaryLight}
              title="Adviser"
              subtitle="Manage the section"
              onPress={() => go(UserRole.ADVISER)}
              icon={
                <Svg width={28} height={28} viewBox="0 0 24 24">
                  <Path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z" fill={Colors.primaryLight} />
                  <Path d="M17 10l2 2 4-4" stroke={Colors.present} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              }
            />
            <RoleCard
              delay={550}
              color={Colors.outside}
              title="Monitor"
              subtitle="Co-manage the section"
              onPress={() => go(UserRole.MONITOR)}
              icon={
                <Svg width={28} height={28} viewBox="0 0 24 24">
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={Colors.outside} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <Circle cx="9" cy="7" r="4" stroke={Colors.outside} strokeWidth="1.5" fill="none" />
                  <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={Colors.outside} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </Svg>
              }
            />
          </View>
          <View style={styles.roleRow}>
            <RoleCard
              delay={600}
              color={Colors.present}
              title="Student"
              subtitle="Scan & track attendance"
              onPress={() => go(UserRole.STUDENT)}
              icon={
                <Svg width={28} height={28} viewBox="0 0 24 24">
                  <Path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke={Colors.present} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <Path d="M6 12v5c3 3 9 3 12 0v-5" stroke={Colors.present} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              }
            />
            <RoleCard
              delay={650}
              color={Colors.late}
              title="Parent"
              subtitle="Track your child"
              onPress={() => go(UserRole.PARENT)}
              icon={
                <Svg width={28} height={28} viewBox="0 0 24 24">
                  <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={Colors.late} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                </Svg>
              }
            />
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={800} style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text
            style={styles.footerLink}
            onPress={() => navigation.navigate('Login', { role: null })}
          >
            Sign in
          </Text>
        </Text>
      </FadeInView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 16 },
  logoWrap: { marginBottom: 16 },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  body: { flex: 1, paddingHorizontal: 20 },
  chooseLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  roleGrid: { gap: 10 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  roleIconWrap: { borderRadius: 12, padding: 10 },
  roleTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  roleSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: { paddingBottom: 20, alignItems: 'center' },
  footerText: { fontSize: FontSize.sm, color: Colors.textTertiary },
  footerLink: { color: Colors.primaryLight, fontWeight: FontWeight.semibold },
});
