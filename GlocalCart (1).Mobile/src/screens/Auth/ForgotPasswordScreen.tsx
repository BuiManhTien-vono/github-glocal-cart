import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';

export default function ForgotPasswordScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();

    const showMessage = (title: string, message: string, onPress?: () => void) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}\n${message}`);
            onPress?.();
            return;
        }
        Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : undefined);
    };

    const handleRequestOtp = async () => {
        const normalizedEmail = email.trim();
        if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
            showMessage('Lỗi', 'Vui lòng nhập email hợp lệ.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/auth/forgot-password', { email: normalizedEmail });
            setEmail(normalizedEmail);
            setStep(2);
            showMessage('Thành công', 'Mã OTP đã được gửi đến email của bạn. Mã có hiệu lực trong 5 phút.');
        } catch (err: any) {
            showMessage('Lỗi', err?.message || 'Không thể gửi OTP. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!/^\d{6}$/.test(otp.trim())) {
            showMessage('Lỗi', 'OTP phải gồm đúng 6 số.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/auth/verify-reset-otp', { email, otp: otp.trim() });
            setOtp(otp.trim());
            setStep(3);
        } catch (err: any) {
            showMessage('Lỗi', err?.message || 'OTP không đúng hoặc đã hết hạn.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            showMessage('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        if (newPassword !== confirmPassword) {
            showMessage('Lỗi', 'Xác nhận mật khẩu không khớp.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/auth/reset-password', { email, otp, newPassword });
            showMessage('Thành công', 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập bằng mật khẩu mới.', () => navigation.goBack());
        } catch (err: any) {
            showMessage('Lỗi', err?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const stepTitle = step === 1 ? 'Quên mật khẩu?' : step === 2 ? 'Nhập mã OTP' : 'Tạo mật khẩu mới';
    const stepSubtitle = step === 1
        ? 'Nhập email liên kết với tài khoản để nhận mã OTP khôi phục.'
        : step === 2
            ? `Nhập mã OTP 6 số đã gửi đến ${email}.`
            : 'OTP hợp lệ. Vui lòng nhập mật khẩu mới cho tài khoản của bạn.';

    const submitLabel = loading
        ? 'Đang xử lý...'
        : step === 1 ? 'Gửi OTP' : step === 2 ? 'Xác thực OTP' : 'Đặt lại mật khẩu';

    const handleSubmit = () => {
        if (step === 1) return handleRequestOtp();
        if (step === 2) return handleVerifyOtp();
        return handleResetPassword();
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.content}>
                    <Text style={styles.title}>{stepTitle}</Text>
                    <Text style={styles.subtitle}>{stepSubtitle}</Text>

                    {step === 1 && (
                        <View style={styles.inputWrap}>
                            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập địa chỉ Email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.inputWrap}>
                            <Ionicons name="keypad-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.otpInput]}
                                placeholder="000000"
                                keyboardType="number-pad"
                                maxLength={6}
                                value={otp}
                                onChangeText={(value) => setOtp(value.replace(/\D/g, ''))}
                            />
                        </View>
                    )}

                    {step === 3 && (
                        <>
                            <View style={styles.inputWrap}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mật khẩu mới"
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                            </View>
                            <View style={styles.inputWrap}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Xác nhận mật khẩu mới"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>
                        </>
                    )}

                    <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
                        <Text style={styles.submitText}>{submitLabel}</Text>
                    </TouchableOpacity>

                    {step === 2 && (
                        <TouchableOpacity style={styles.linkBtn} onPress={handleRequestOtp} disabled={loading}>
                            <Text style={styles.linkText}>Gửi lại OTP</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    backBtn: { padding: spacing.md, marginTop: 8 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 12 },
    subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 32 },

    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: 16, height: 56, marginBottom: 16 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 56, fontSize: 16, color: colors.text },
    otpInput: { fontSize: 22, fontWeight: '800', letterSpacing: 0, textAlign: 'center' },

    submitBtn: { backgroundColor: colors.primary, height: 56, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: 16, ...shadow.md },
    submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
    linkBtn: { alignSelf: 'center', paddingVertical: 18, paddingHorizontal: 12 },
    linkText: { color: colors.primary, fontSize: 14, fontWeight: '700' }
});
