import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ScrollView, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'globe-outline' as const,
    iconBg: '#EBF5FF',
    iconColor: '#2563EB',
    title: 'Mua Sắm Toàn Cầu',
    description: 'Khám phá hàng triệu sản phẩm từ những người bán uy tín trên khắp thế giới, giao đến tận tay bạn.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    title: 'Thanh Toán An Toàn',
    description: 'Hệ thống bảo mật đa tầng, hỗ trợ nhiều phương thức thanh toán linh hoạt và tiện lợi.',
  },
  {
    icon: 'storefront-outline' as const,
    iconBg: '#FFF5F0',
    iconColor: colors.primary,
    title: 'Trở Thành Người Bán',
    description: 'Dễ dàng đăng ký bán hàng, quản lý cửa hàng và tiếp cận hàng triệu khách hàng tiềm năng.',
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnims = slides.map(() => useRef(new Animated.Value(0)).current);

  React.useEffect(() => {
    // Animate first slide
    Animated.spring(slideAnims[0], {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      // Animate the new slide
      Animated.spring(slideAnims[index], {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      handleStart();
    }
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    navigation.replace('Login');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    navigation.replace('Login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Bỏ qua</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Animated.View
              style={[
                styles.iconCircle,
                { backgroundColor: slide.iconBg },
                {
                  opacity: slideAnims[index],
                  transform: [
                    {
                      scale: slideAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.iconInner}>
                <Ionicons name={slide.icon} size={64} color={slide.iconColor} />
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: slideAnims[index] }}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDesc}>{slide.description}</Text>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Next / Start button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={goToNext}
          activeOpacity={0.85}
        >
          {currentIndex === slides.length - 1 ? (
            <>
              <Text style={styles.nextBtnText}>Bắt Đầu Mua Sắm</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          ) : (
            <>
              <Text style={styles.nextBtnText}>Tiếp Theo</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    gap: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
