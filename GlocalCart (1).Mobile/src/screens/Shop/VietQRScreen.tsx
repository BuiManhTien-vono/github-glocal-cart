import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import { paymentApi, PaymentInitiateResponse } from '../../services/api/paymentApi';
import { Loading } from '../../components/common/Loading';

export default function VietQRScreen({ navigation, route }: any) {
    const { orderId } = route.params;
    const insets = useSafeAreaInsets();
    
    const [isLoading, setIsLoading] = useState(true);
    const [qrData, setQrData] = useState<PaymentInitiateResponse | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchQrCode();
        } else {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn hàng.', [
                { text: 'Quay lại', onPress: () => navigation.goBack() }
            ]);
        }
    }, [orderId]);

    const fetchQrCode = async () => {
        setIsLoading(true);
        try {
            const data = await paymentApi.initiate(orderId);
            setQrData(data);
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể tạo mã thanh toán. Vui lòng thử lại sau.');
            console.error('fetchQrCode error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmTransfer = async () => {
        setIsConfirming(true);
        try {
            await paymentApi.confirmTransfer(orderId);
            Alert.alert('Thành công', 'Đơn hàng đã được ghi nhận thanh toán.', [
                {
                    text: 'Xem đơn hàng',
                    onPress: () => navigation.replace('MainTabs', {
                        screen: 'Profile',
                        params: {
                            screen: 'OrderDetail',
                            params: { orderId, fromPayment: true },
                        },
                    }),
                },
            ]);
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi xác nhận. Vui lòng thử lại.');
            setIsConfirming(false);
        }
    };

    if (isLoading) return <Loading message="Đang tạo mã thanh toán..." />;

    if (!qrData) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <Ionicons name="warning-outline" size={48} color={colors.danger} />
                <Text style={styles.errorText}>Không thể tải thông tin thanh toán</Text>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.outlineBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán VietQR</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.qrCard}>
                    <Text style={styles.instructionTitle}>Quét mã QR để thanh toán</Text>
                    <Text style={styles.instructionText}>
                        Sử dụng ứng dụng ngân hàng của bạn để quét mã QR bên dưới.
                    </Text>

                    <View style={styles.qrContainer}>
                        <Image 
                            source={{ uri: qrData.vietQrUrl }} 
                            style={styles.qrImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.infoBox}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Số tiền:</Text>
                            <Text style={styles.infoValueHighlight}>{qrData.amount.toLocaleString('vi-VN')}đ</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nội dung CK:</Text>
                            <Text style={styles.infoValue}>Thanh toan {qrData.orderId}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.warningBox}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <Text style={styles.warningText}>
                        Sau khi chuyển khoản thành công, vui lòng bấm nút "Tôi đã chuyển khoản" bên dưới để hệ thống xác nhận.
                    </Text>
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity 
                    style={[styles.primaryBtn, isConfirming && { opacity: 0.7 }]} 
                    onPress={handleConfirmTransfer}
                    disabled={isConfirming}
                >
                    <Text style={styles.primaryBtnText}>
                        {isConfirming ? 'Đang xử lý...' : 'Tôi đã chuyển khoản'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: spacing.md, 
        paddingVertical: 12, 
        backgroundColor: colors.white, 
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight
    },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    
    scrollContent: { padding: 16, paddingBottom: 40 },
    
    qrCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        ...shadow.sm,
        marginBottom: 16
    },
    instructionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
    instructionText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    
    qrContainer: {
        width: 250,
        height: 250,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 12
    },
    qrImage: { width: '100%', height: '100%' },
    
    infoBox: {
        width: '100%',
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 8,
        gap: 12
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { fontSize: 14, color: colors.textSecondary },
    infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    infoValueHighlight: { fontSize: 18, fontWeight: '700', color: colors.primary },

    warningBox: {
        flexDirection: 'row',
        backgroundColor: colors.primaryBg,
        padding: 16,
        borderRadius: 8,
        gap: 12,
        alignItems: 'flex-start'
    },
    warningText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 20 },

    errorText: { fontSize: 16, color: colors.text, marginTop: 16, marginBottom: 24 },
    
    bottomBar: { 
        backgroundColor: colors.white, 
        padding: 16, 
        borderTopWidth: 1, 
        borderTopColor: colors.borderLight 
    },
    primaryBtn: { 
        backgroundColor: colors.primary, 
        borderRadius: 8, 
        alignItems: 'center', 
        paddingVertical: 16 
    },
    primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
    outlineBtn: { 
        borderWidth: 1, 
        borderColor: colors.border, 
        borderRadius: 8, 
        alignItems: 'center', 
        paddingVertical: 12,
        paddingHorizontal: 32
    },
    outlineBtnText: { color: colors.text, fontWeight: '600', fontSize: 14 },
});
