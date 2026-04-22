import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export default function SplashScreen({ navigation }: any) {
  const { isLoggedIn } = useAuth();

  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotScale1 = useRef(new Animated.Value(0)).current;
  const dotScale2 = useRef(new Animated.Value(0)).current;
  const dotScale3 = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation sequence
    Animated.sequence([
      // Phase 1: Logo appears with bounce
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Text slides up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Phase 3: Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Phase 4: Loading dots
      Animated.stagger(150, [
        Animated.spring(dotScale1, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.spring(dotScale2, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.spring(dotScale3, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
    ]).start();

    // Shimmer loop on logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();

    // Navigate after delay
    const timer = setTimeout(async () => {
      if (isLoggedIn) {
        navigation.replace('MainTabs');
      } else {
        const seen = await AsyncStorage.getItem('has_seen_onboarding');
        if (seen) {
          navigation.replace('Login');
        } else {
          navigation.replace('Onboarding');
        }
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const shimmerRotate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Background decorations */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoGlow,
            { transform: [{ rotate: shimmerRotate }] },
          ]}
        />
        <View style={styles.logoInner}>
          <Ionicons name="cart" size={48} color="#FFF" />
        </View>
      </Animated.View>

      {/* App Name */}
      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textSlide }],
        }}
      >
        <Text style={styles.appName}>GlocalCart</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Mua sắm toàn cầu, giao hàng địa phương
      </Animated.Text>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        {[dotScale1, dotScale2, dotScale3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { transform: [{ scale: dot }] },
            ]}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by GlocalCart Team</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -50,
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: '40%',
    left: -40,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderTopColor: 'rgba(255,255,255,0.6)',
  },
  logoInner: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
});
