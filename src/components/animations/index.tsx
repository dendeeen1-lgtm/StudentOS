import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';

// ─── FadeInView ───────────────────────────────────────────────────────────────
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  fromY?: number;
}

export const FadeInView: React.FC<FadeInProps> = ({
  children, delay = 0, duration = 400, style, fromY = 20,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration, delay, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── ScalePress ───────────────────────────────────────────────────────────────
interface ScalePressProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const ScalePress: React.FC<ScalePressProps> = ({
  children, onPress, style, disabled,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── PulseView ────────────────────────────────────────────────────────────────
interface PulseProps {
  color: string;
  size?: number;
  children?: React.ReactNode;
}

export const PulseView: React.FC<PulseProps> = ({ color, size = 12, children }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1.6, duration: 900, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.6, duration: 900, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animate();
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size * 2.5, height: size * 2.5 }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 2,
          height: size * 2,
          borderRadius: size,
          backgroundColor: color,
          opacity: pulseOpacity,
          transform: [{ scale: pulse }],
        }}
      />
      {children ?? (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
      )}
    </View>
  );
};

// ─── SlideUpSheet ─────────────────────────────────────────────────────────────
interface SlideUpProps {
  visible: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SlideUpSheet: React.FC<SlideUpProps> = ({ visible, children, style }) => {
  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: visible ? 0 : 300, useNativeDriver: true, bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0, duration: 250, useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── CountUp ──────────────────────────────────────────────────────────────────
export const useCountUp = (target: number, duration = 800) => {
  const value = useRef(new Animated.Value(0)).current;
  const displayed = useRef(0);

  useEffect(() => {
    Animated.timing(value, {
      toValue: target, duration, useNativeDriver: false,
    }).start();
  }, [target]);

  value.addListener(({ value: v }) => { displayed.current = Math.floor(v); });
  return value;
};
