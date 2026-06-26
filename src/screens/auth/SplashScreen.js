import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spin = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient colors={COLORS.gradientSplash} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Palm tree silhouette decoration */}
      <View style={styles.palmDecoration}>
        <Text style={styles.palmEmoji}>🌴</Text>
        <Text style={[styles.palmEmoji, styles.palmRight]}>🌴</Text>
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Logo container */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
            style={styles.logoGlass}
          >
            <Text style={styles.logoIcon}>🍶</Text>
          </LinearGradient>
        </View>

        {/* App name */}
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.appName}>Toddy Connect</Text>
          <Text style={styles.tagline}>తాజా కల్లు • మీ తలుపు వద్దకు</Text>
          <Text style={styles.taglineEn}>Fresh Toddy • To Your Doorstep</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom loader */}
      <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
        <View style={styles.dotContainer}>
          {[0, 1, 2].map((i) => (
            <AnimatedDot key={i} delay={i * 200} />
          ))}
        </View>
        <Text style={styles.loadingText}>Loading fresh toddy...</Text>
      </Animated.View>
    </LinearGradient>
  );
}

function AnimatedDot({ delay }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounceAnim, { toValue: -10, duration: 300, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.dot, { transform: [{ translateY: bounceAnim }] }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(45,134,83,0.15)',
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(45,134,83,0.1)',
    bottom: 100,
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(244,200,66,0.08)',
    top: height * 0.3,
    right: -40,
  },
  palmDecoration: {
    position: 'absolute',
    bottom: 150,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  palmEmoji: {
    fontSize: 80,
    opacity: 0.15,
  },
  palmRight: {
    transform: [{ scaleX: -1 }],
  },
  content: {
    alignItems: 'center',
    gap: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logoGlass: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoIcon: {
    fontSize: 60,
  },
  appName: {
    fontSize: FONTS.sizes.hero,
    color: COLORS.white,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.accentLight,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  taglineEn: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryLight,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONTS.sizes.sm,
    letterSpacing: 0.5,
  },
});
