import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Animated, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { login, setGuestMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(logoAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = 'Vui lòng nhập email hoặc tên đăng nhập';
    if (!password) errs.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    // Button press animation
    Animated.sequence([
      Animated.timing(btnAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err.message || 'Sai tài khoản hoặc mật khẩu.';
      if (Platform.OS === 'web') {
        window.alert('Đăng nhập thất bại: ' + msg);
      } else {
        Alert.alert('Đăng nhập thất bại', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ===== Header Gradient Section ===== */}
      <View style={styles.headerSection}>
        {/* Background decorations */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />

        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoAnim,
              transform: [{
                translateY: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.logoBox}>
            <Ionicons name="cart" size={32} color="#FFF" />
          </View>
          <Text style={styles.brandName}>GlocalCart</Text>
          <Text style={styles.brandTagline}>Chào mừng bạn trở lại!</Text>
        </Animated.View>
      </View>

      {/* ===== Login Form ===== */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formSection}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: cardAnim,
                transform: [{
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }],
              },
            ]}
          >
            <Text style={styles.formTitle}>Đăng Nhập</Text>

            {/* Email/Username Input */}
            <View style={[
              styles.inputContainer,
              focusedField === 'email' && styles.inputFocused,
              errors.email && styles.inputError,
            ]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={focusedField === 'email' ? colors.primary : colors.textMuted}
                style={styles.inputIcon}
              />
              <View style={styles.inputWrapper}>
                <Text style={[
                  styles.inputLabel,
                  focusedField === 'email' && { color: colors.primary },
                ]}>Email / Tên đăng nhập</Text>
                <View style={styles.inputRow}>
                  <Animated.View style={{ flex: 1 }}>
                    <View>
                      <TouchableOpacity activeOpacity={1}>
                        <Text
                          style={styles.inputField}
                          onPress={() => setFocusedField('email')}
                        >
                          {' '}
                        </Text>
                      </TouchableOpacity>
                      {/* Actual TextInput overlaid */}
                      <View style={StyleSheet.absoluteFill}>
                        <Animated.View style={{ flex: 1 }}>
                          <InputField
                            value={email}
                            onChangeText={(t: string) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
                            placeholder="Nhập email hoặc tên đăng nhập"
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                          />
                        </Animated.View>
                      </View>
                    </View>
                  </Animated.View>
                </View>
              </View>
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Password Input */}
            <View style={[
              styles.inputContainer,
              focusedField === 'password' && styles.inputFocused,
              errors.password && styles.inputError,
            ]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={focusedField === 'password' ? colors.primary : colors.textMuted}
                style={styles.inputIcon}
              />
              <View style={styles.inputWrapper}>
                <Text style={[
                  styles.inputLabel,
                  focusedField === 'password' && { color: colors.primary },
                ]}>Mật khẩu</Text>
                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      value={password}
                      onChangeText={(t: string) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                      placeholder="Nhập mật khẩu"
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPass}
                    />
                  </View>
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Animated.View style={{ transform: [{ scale: btnAnim }] }}>
              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <Ionicons name="sync-outline" size={20} color="#FFF" />
                    <Text style={styles.loginBtnText}>Đang xử lý...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialCircle} activeOpacity={0.7}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCircle} activeOpacity={0.7}>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCircle} activeOpacity={0.7}>
                <Ionicons name="logo-apple" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerLabel}>Bạn mới biết đến GlocalCart? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Đăng Ký</Text>
              </TouchableOpacity>
            </View>

            {/* Guest Login */}
            <TouchableOpacity 
              style={styles.guestBtn} 
              onPress={() => setGuestMode(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.guestBtnText}>Tiếp tục với vai trò là khách</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Simple text input component without external dependencies
function InputField({ value, onChangeText, placeholder, onFocus, onBlur, ...props }: any) {
  const { TextInput } = require('react-native');
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        fontSize: 15,
        color: colors.text,
        padding: 0,
        margin: 0,
        height: 24,
      }}
      placeholderTextColor={colors.textMuted}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  // Header Section
  headerSection: {
    paddingTop: 20,
    paddingBottom: 36,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  headerCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: -30,
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  brandName: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 4,
  },
  // Form Section
  formSection: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    ...shadow.lg,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginTop: 10,
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputField: {
    fontSize: 15,
    color: colors.text,
    height: 24,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  // Login Button
  loginBtn: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  loginBtnDisabled: {
    backgroundColor: colors.primaryLight,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  registerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
  },
  guestBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
