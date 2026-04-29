import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }: any) {
    const [email, setEmail] = useState('');

    const handleReset = () => {
        if (Platform.OS === 'web') window.alert(`Đường dẫn khoôi phục mật khẩu đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư.`);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.content}>
                    <Text style={styles.title}>Quên mật khẩu?</Text>
                    <Text style={styles.subtitle}>Đừng lo! Vui lòng nhập địa chỉ email liên kết với tài khoản của bạn để nhận mã khôi phục.</Text>

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

                    <TouchableOpacity style={styles.submitBtn} onPress={handleReset}>
                        <Text style={styles.submitText}>Gửi Yêu Cầu</Text>
                    </TouchableOpacity>
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

    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: 16, height: 56, marginBottom: 32 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 56, fontSize: 16, color: colors.text },

    submitBtn: { backgroundColor: colors.primary, height: 56, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', ...shadow.md },
    submitText: { color: colors.white, fontSize: 16, fontWeight: '700' }
});
