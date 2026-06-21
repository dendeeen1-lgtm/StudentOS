import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, FontSize, FontWeight } from '../../constants';

const APP_NAME = ['S', 't', 'u', 'd', 'e', 'n', 't', 'O', 'S'];

const Letter: React.FC<{ char: string; index: number; delay: number }> = ({ char, index, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, bounciness: 8, speed: 12, useNativeDriver: true }),
    ]).start();
  }, []);
  const isAccent = char === 'O' || (char === 'S' && index === 8);
  return (
    <Animated.Text style={[styles.letter, { opacity, transform: [{ translateY }], color: isAccent ? Colors.primaryLight : Colors.textPrimary }]}>
      {char}
    </Animated.Text>
  );
};

export const LoadingScreen: React.FC = () => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, bounciness: 10, speed: 6, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.timing(taglineOpacity, { toValue: 1, duration: 600, delay: APP_NAME.length * 80 + 400, useNativeDriver: true }).start();
    const animDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ])
      ).start();
    };
    animDot(dot1, 0);
    animDot(dot2, 200);
    animDot(dot3, 400);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Svg width={72} height={72} viewBox="0 0 64 64">
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
      <View style={styles.nameRow}>
        {APP_NAME.map((char, i) => (
          <Letter key={i} char={char} index={i} delay={i * 80} />
        ))}
      </View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Section attendance, simplified.
      </Animated.Text>
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot, transform: [{ scale: dot.interpolate({ inputRange: [0.3, 1], outputRange: [0.7, 1.2] }) }] }]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logoWrap: { marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  letter: { fontSize: 34, fontWeight: FontWeight.bold, letterSpacing: 1 },
  tagline: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 4 },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryLight },
});
