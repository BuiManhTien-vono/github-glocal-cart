import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Animated, Alert, Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { register, finishLogin } = useAuth();

  // Step management
  const [step, setStep] = useState(1); // 1 = Info, 2 = Password
  const [form, setForm] = useState({
    userName: '', email: '', fullName: '', phone: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animations
  const cardAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  }, []);

  const animateStep = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(stepAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: nextStep === 1 ? 0.5 : 1, duration: 300, useNativeDriver: false }),
    ]).start(() => {
      setStep(nextStep);
      stepAnim.setValue(0);
      Animated.timing(stepAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
    });
  };

  const setField = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.userName.trim()) errs.userName = 'Bắt buộc';
    else if (form.userName.length < 3) errs.userName = 'Tối thiểu 3 ký tự';
    if (!form.email.trim()) errs.email = 'Bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.fullName.trim()) errs.fullName = 'Bắt buộc';
    if (!form.phone.trim()) errs.phone = 'Bắt buộc';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.password) errs.password = 'Bắt buộc';
    else if (form.password.length < 6) errs.password = 'Tối thiểu 6 ký tự';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu không khớp';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      animateStep(2);
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const { token, user } = await register({
        userName: form.userName.trim(),
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      });

      if (Platform.OS === 'web') {
        window.alert('✅ Đăng ký thành công. Đang tự động đăng nhập...');
        finishLogin(token, user);
      } else {
        Alert.alert(
          '✅ Đăng ký thành công',
          'Chào mừng bạn đến với GlocalCart!',
          [{ text: 'Đăng nhập ngay', onPress: () => finishLogin(token, user) }]
        );
      }
    } catch (err: any) {
      Alert.alert('Đăng ký thất bại', err.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: colors.border };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: 'Yếu', color: colors.danger };
    if (score <= 3) return { level: 2, label: 'Trung bình', color: colors.warning };
    return { level: 3, label: 'Mạnh', color: colors.success };
  };

  const strength = getPasswordStrength(form.password);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => step === 2 ? animateStep(1) : navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Đăng Ký</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: progressWidth as any }]} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepsRow}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
            {step > 1 ? (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            ) : (
              <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Thông tin</Text>
        </View>
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}>2</Text>
          </View>
          <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Mật khẩu</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.body}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnim,
                transform: [{
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                }],
              },
            ]}
          >
            {step === 1 ? (
              /* ===== STEP 1: Personal Info ===== */
              <>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconWrap}>
                    <Ionicons name="person-add" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.stepTitle}>Thông Tin Cá Nhân</Text>
                  <Text style={styles.stepDesc}>Tạo tài khoản để bắt đầu mua sắm trên GlocalCart</Text>
                </View>

                <FormInput
                  icon="person-outline"
                  label="Tên đăng nhập"
                  placeholder="vd: nguoidung123"
                  value={form.userName}
                  onChangeText={(v: string) => setField('userName', v)}
                  error={errors.userName}
                  autoCapitalize="none"
                />
                <FormInput
                  icon="text-outline"
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChangeText={(v: string) => setField('fullName', v)}
                  error={errors.fullName}
                />
                <FormInput
                  icon="mail-outline"
                  label="Email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChangeText={(v: string) => setField('email', v)}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <FormInput
                  icon="call-outline"
                  label="Số điện thoại"
                  placeholder="0912345678"
                  value={form.phone}
                  onChangeText={(v: string) => setField('phone', v)}
                  error={errors.phone}
                  keyboardType="phone-pad"
                />

                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={handleNext}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nextBtnText}>TIẾP TỤC</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
              </>
            ) : (
              /* ===== STEP 2: Password ===== */
              <>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepIconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                  </View>
                  <Text style={styles.stepTitle}>Thiết Lập Mật Khẩu</Text>
                  <Text style={styles.stepDesc}>Tạo mật khẩu an toàn cho tài khoản của bạn</Text>
                </View>

                <FormInput
                  icon="lock-closed-outline"
                  label="Mật khẩu"
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChangeText={(v: string) => setField('password', v)}
                  error={errors.password}
                  secureTextEntry
                />

                {/* Password Strength Indicator */}
                {form.password.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBar}>
                      <View style={[styles.strengthFill, {
                        width: `${(strength.level / 3) * 100}%`,
                        backgroundColor: strength.color,
                      }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  </View>
                )}

                <FormInput
                  icon="lock-open-outline"
                  label="Xác nhận mật khẩu"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChangeText={(v: string) => setField('confirmPassword', v)}
                  error={errors.confirmPassword}
                  secureTextEntry
                />

                {/* Terms */}
                <View style={styles.termsRow}>
                  <Ionicons name="checkbox" size={20} color={colors.primary} />
                  <Text style={styles.termsText}>
                    Bằng việc đăng ký, bạn đồng ý với{' '}
                    <Text style={styles.termsLink}>Điều khoản Dịch vụ</Text>
                    {' '}và{' '}
                    <Text style={styles.termsLink}>Chính sách Bảo mật</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.nextBtn, loading && { backgroundColor: colors.primaryLight }]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <Text style={styles.nextBtnText}>ĐANG XỬ LÝ...</Text>
                  ) : (
                    <>
                      <Text style={styles.nextBtnText}>ĐĂNG KÝ</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginLabel}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Đăng Nhập</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Reusable Form Input with Icon ───
function FormInput({ icon, label, error, ...props }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 4 }}>
      <View style={[
        formStyles.container,
        focused && formStyles.focused,
        error && formStyles.error,
      ]}>
        <Ionicons
          name={icon}
          size={18}
          color={focused ? colors.primary : colors.textMuted}
          style={formStyles.icon}
        />
        <View style={formStyles.wrapper}>
          <Text style={[formStyles.label, focused && { color: colors.primary }]}>{label}</Text>
          <TextInput
            style={formStyles.input}
            placeholderTextColor={colors.textMuted}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
        </View>
      </View>
      {error ? <Text style={formStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const formStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  focused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  error: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  icon: {
    marginTop: 12,
    marginRight: 10,
  },
  wrapper: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  input: {
    fontSize: 15,
    color: colors.text,
    padding: 0,
    height: 28,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: '#FFF', fontSize: fontSize.lg, fontWeight: '700' },
  // Progress Bar
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  // Steps
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 0,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#FFF',
  },
  stepLine: {
    width: 50,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
    marginBottom: 18,
  },
  stepLineActive: {
    backgroundColor: '#FFF',
  },
  // Body
  body: {
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    ...shadow.lg,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  stepDesc: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  // Next Button
  nextBtn: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    ...shadow.md,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Strength
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 16,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Login link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginLabel: { fontSize: 14, color: colors.textSecondary },
  loginLink: { fontSize: 14, color: colors.primary, fontWeight: '800' },
});
