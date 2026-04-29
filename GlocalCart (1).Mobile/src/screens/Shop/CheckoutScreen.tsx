import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function CheckoutScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [addressMode, setAddressMode] = useState('default'); // 'default' or 'once'

    // MOCK DATA
    const mockAddress = {
        name: 'Nguyễn Văn A',
        phone: '0901234567',
        address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'
    };

    const mockCartItems = [
        { id: '1', name: 'MacBook Pro M2 2023', price: 32000000, quantity: 1, image: '💻' },
        { id: '2', name: 'Chuột không dây Logitech Master 3', price: 2500000, quantity: 2, image: '🖱' }
    ];

    const subTotal = mockCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingFee = 35000;
    const total = subTotal + shippingFee;

    const handlePlaceOrder = () => {
        if (Platform.OS === 'web') {
            window.alert('✅ Đặt hàng thành công! Đơn hàng của bạn đang được xử lý.');
            navigation.goBack();
        } else {
            // Dành cho Mobile
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh Toán</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ĐỊA CHỈ NHẬN HÀNG */}
                <TouchableOpacity style={styles.sectionCard} activeOpacity={0.7} onPress={() => navigation.navigate('Addresses')}>
                    <View style={styles.sectionHeaderLine}>
                        <Ionicons name="location" size={20} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
                    </View>
                    <View style={styles.addressBox}>
                        <Text style={styles.addressName}>{mockAddress.name} | {mockAddress.phone}</Text>
                        <Text style={styles.addressText}>{mockAddress.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.chevron} />
                </TouchableOpacity>

                {/* LỰA CHỌN SỬ DỤNG ĐỊA CHỈ */}
                <View style={styles.addressOptionRow}>
                    <TouchableOpacity
                        style={[styles.optionBtn, addressMode === 'default' && styles.optionBtnActive]}
                        onPress={() => setAddressMode('default')}
                    >
                        <Ionicons
                            name={addressMode === 'default' ? "radio-button-on" : "radio-button-off"}
                            size={18}
                            color={addressMode === 'default' ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.optionText, addressMode === 'default' && styles.optionTextActive]}>Đặt làm mặc định</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.optionBtn, addressMode === 'once' && styles.optionBtnActive]}
                        onPress={() => setAddressMode('once')}
                    >
                        <Ionicons
                            name={addressMode === 'once' ? "radio-button-on" : "radio-button-off"}
                            size={18}
                            color={addressMode === 'once' ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.optionText, addressMode === 'once' && styles.optionTextActive]}>Chỉ dùng lần này</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.dividerStripe} />

                {/* THÔNG TIN SẢN PHẨM */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Sản phẩm ({mockCartItems.length})</Text>
                    {mockCartItems.map((item, idx) => (
                        <View key={item.id} style={[styles.productRow, idx < mockCartItems.length - 1 && styles.borderBottom]}>
                            <View style={styles.productImgPlaceholder}>
                                <Text style={{ fontSize: 24 }}>{item.image}</Text>
                            </View>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.productPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                                    <Text style={styles.productQty}>x{item.quantity}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* PHƯƠNG THỨC THANH TOÁN */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                    <TouchableOpacity
                        style={[styles.paymentMethod, selectedPayment === 'cod' && styles.paymentMethodActive]}
                        onPress={() => setSelectedPayment('cod')}
                    >
                        <Ionicons name="cash-outline" size={24} color={selectedPayment === 'cod' ? colors.primary : colors.textSecondary} />
                        <Text style={[styles.paymentText, selectedPayment === 'cod' && styles.paymentTextActive]}>Thanh toán khi nhận hàng (COD)</Text>
                        {selectedPayment === 'cod' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.paymentMethod, selectedPayment === 'card' && styles.paymentMethodActive, { borderBottomWidth: 0 }]}
                        onPress={() => setSelectedPayment('card')}
                    >
                        <Ionicons name="card-outline" size={24} color={selectedPayment === 'card' ? colors.primary : colors.textSecondary} />
                        <Text style={[styles.paymentText, selectedPayment === 'card' && styles.paymentTextActive]}>Thẻ Tín Dụng/Ghi Nợ</Text>
                        {selectedPayment === 'card' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                    </TouchableOpacity>
                </View>

                {/* DETAILS */}
                <View style={styles.sectionCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
                        <Text style={styles.summaryValue}>{subTotal.toLocaleString('vi-VN')}đ</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                        <Text style={styles.summaryValue}>{shippingFee.toLocaleString('vi-VN')}đ</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                        <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                        <Text style={styles.totalValue}>{total.toLocaleString('vi-VN')}đ</Text>
                    </View>
                </View>

            </ScrollView>

            {/* BOTTOM BAR ACTION */}
            <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 24) : insets.bottom + 12 }]}>
                <View style={styles.bottomBarLeft}>
                    <Text style={styles.bottomBarLabel}>Tổng thanh toán</Text>
                    <Text style={styles.bottomBarPrice}>{total.toLocaleString('vi-VN')}đ</Text>
                </View>
                <TouchableOpacity style={styles.orderBtn} onPress={handlePlaceOrder}>
                    <Text style={styles.orderBtnText}>Đặt Hàng</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        backgroundColor: colors.white,
        ...shadow.sm,
        zIndex: 10,
    },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    scrollContent: { paddingBottom: 40 },
    sectionCard: {
        backgroundColor: colors.white,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    dividerStripe: {
        height: 4,
        backgroundColor: colors.primary + '30', // Fake shoppay envelope stripe
    },
    addressOptionRow: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        paddingHorizontal: spacing.md,
        paddingBottom: 16,
        gap: 16,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    optionBtnActive: {
    },
    optionText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    optionTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    addressBox: { paddingLeft: 28, paddingRight: 24 },
    addressName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
    addressText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    chevron: { position: 'absolute', right: 16, top: '50%', marginTop: -10 },

    productRow: { flexDirection: 'row', paddingVertical: 12 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    productImgPlaceholder: { width: 60, height: 60, backgroundColor: colors.background, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    productInfo: { flex: 1, justifyContent: 'space-between' },
    productName: { fontSize: 14, color: colors.text, fontWeight: '500' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
    productQty: { fontSize: 13, color: colors.textSecondary },

    paymentMethod: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    paymentMethodActive: { backgroundColor: colors.primary + '05' },
    paymentText: { flex: 1, marginLeft: 12, fontSize: 15, color: colors.text },
    paymentTextActive: { fontWeight: '700', color: colors.primary },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 14, color: colors.textSecondary },
    summaryValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
    totalLabel: { fontSize: 16, color: colors.text, fontWeight: '700' },
    totalValue: { fontSize: 18, color: colors.primary, fontWeight: '800' },

    bottomBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    bottomBarLeft: { flex: 1, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 20 },
    bottomBarLabel: { fontSize: 12, color: colors.textSecondary },
    bottomBarPrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
    orderBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 18, justifyContent: 'center', alignItems: 'center' },
    orderBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});
