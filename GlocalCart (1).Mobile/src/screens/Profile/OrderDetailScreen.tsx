import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function OrderDetailScreen({ navigation, route }: any) {
    const orderId = route?.params?.orderId || 'ORD202611';
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Banner trạng thái */}
                <View style={styles.statusBanner}>
                    <Text style={styles.statusBig}>Người bán đang chuẩn bị hàng</Text>
                    <Text style={styles.statusSub}>Dự kiến giao hàng vào 20/10/2026</Text>
                </View>

                {/* Khối Tracking */}
                <TouchableOpacity style={styles.sectionCard} onPress={() => navigation.navigate('ShipmentTracking')}>
                    <View style={styles.rowCenter}>
                        <Ionicons name="car-outline" size={24} color={colors.secondary} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.blueText}>Thông tin vận chuyển</Text>
                            <Text style={styles.trackDesc}>Đơn hàng đã tới kho phân loại HCM.</Text>
                            <Text style={styles.trackTime}>12:30 18-10-2026</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </View>
                </TouchableOpacity>

                {/* Khối Địa chỉ */}
                <View style={styles.sectionCard}>
                    <View style={styles.rowCenter}>
                        <Ionicons name="location-outline" size={24} color={colors.primary} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Địa chỉ nhận hàng</Text>
                            <Text style={styles.valName}>Nguyễn Văn A | 0901234567</Text>
                            <Text style={styles.valDesc}>123 Đường Lê Lợi, P. Bến Nghé, Quận 1, HCM</Text>
                        </View>
                    </View>
                </View>

                {/* Danh sách SP */}
                <View style={styles.sectionCard}>
                    <View style={styles.shopRow}>
                        <Ionicons name="storefront-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.shopName}>Apple Official Store</Text>
                    </View>

                    <View style={styles.productRow}>
                        <View style={styles.prodImg}><Ionicons name="laptop-outline" size={30} color={colors.textMuted} /></View>
                        <View style={styles.prodInfo}>
                            <Text style={styles.prodTitle}>MacBook Pro M2 2023</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.prodPrice}>32.000.000đ</Text>
                                <Text style={styles.prodQty}>x1</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.productRow, { borderBottomWidth: 0 }]}>
                        <View style={styles.prodImg}><Ionicons name="desktop-outline" size={30} color={colors.textMuted} /></View>
                        <View style={styles.prodInfo}>
                            <Text style={styles.prodTitle}>Chuột không dây Logitech</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.prodPrice}>2.500.000đ</Text>
                                <Text style={styles.prodQty}>x1</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.orderSummary}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.sumLabel}>Mã đơn hàng</Text>
                            <Text style={styles.sumVal}>{orderId}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.sumLabel}>Thành tiền</Text>
                            <Text style={styles.sumValPrice}>34.500.000đ</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.outlineBtn}>
                    <Text style={styles.outlineBtnText}>Liên hệ người bán</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('WriteReview')}>
                    <Text style={styles.primaryBtnText}>Cho Đánh Giá</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.primary, zIndex: 10 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
    scrollContent: { paddingBottom: 30 },

    statusBanner: { backgroundColor: colors.primary, padding: 24, paddingBottom: 40 },
    statusBig: { fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: 8 },
    statusSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

    sectionCard: { backgroundColor: colors.white, padding: 16, marginBottom: 8, marginTop: -16, borderRadius: 12, marginHorizontal: 12, ...shadow.sm },
    rowCenter: { flexDirection: 'row', alignItems: 'flex-start' },
    blueText: { fontSize: 15, fontWeight: '700', color: colors.secondary, marginBottom: 6 },
    trackDesc: { fontSize: 14, color: colors.success, marginBottom: 4 },
    trackTime: { fontSize: 12, color: colors.textMuted },

    label: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
    valName: { fontSize: 14, color: colors.text, marginBottom: 4 },
    valDesc: { fontSize: 13, color: colors.textSecondary },

    shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 12, marginBottom: 12 },
    shopName: { fontSize: 15, fontWeight: '700', color: colors.text },

    productRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 12, marginBottom: 12 },
    prodImg: { width: 60, height: 60, backgroundColor: colors.background, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    prodInfo: { flex: 1, justifyContent: 'space-between' },
    prodTitle: { fontSize: 14, fontWeight: '500', color: colors.text },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    prodPrice: { fontSize: 14, color: colors.text, fontWeight: '600' },
    prodQty: { fontSize: 14, color: colors.textSecondary },

    orderSummary: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 },
    summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    sumLabel: { fontSize: 14, color: colors.textSecondary },
    sumVal: { fontSize: 14, color: colors.text, fontWeight: '600' },
    sumValPrice: { fontSize: 18, color: colors.primary, fontWeight: '700' },

    bottomBar: { flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight, padding: 12, gap: 12 },
    outlineBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: 'center', paddingVertical: 14 },
    outlineBtnText: { color: colors.text, fontWeight: '600', fontSize: 14 },
    primaryBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center', paddingVertical: 14 },
    primaryBtnText: { color: colors.white, fontWeight: '600', fontSize: 14 }
});
