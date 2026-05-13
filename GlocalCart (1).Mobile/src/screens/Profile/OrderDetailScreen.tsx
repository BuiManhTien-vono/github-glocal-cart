import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { Loading } from '../../components/common/Loading';

export default function OrderDetailScreen({ navigation, route }: any) {
    const orderId = route?.params?.orderId;
    const insets = useSafeAreaInsets();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (orderId) fetchOrderDetail();
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            const data: any = await apiClient.get(`/orders/${orderId}`);
            setOrder(data);
        } catch (error) {
            console.log('fetchOrderDetail error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusText = (status: number) => {
        switch (status) {
            case 0: return 'Chờ xác nhận';
            case 1: return 'Đang chuẩn bị';
            case 2: return 'Đang giao';
            case 3: return 'Đã giao';
            case 4: return 'Đã hủy';
            default: return 'Khác';
        }
    };

    if (isLoading) return <Loading />;
    if (!order) return (
        <View style={styles.center}>
            <Text>Không tìm thấy thông tin đơn hàng</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={{ color: colors.primary, marginTop: 10 }}>Quay lại</Text>
            </TouchableOpacity>
        </View>
    );

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
                    <Text style={styles.statusBig}>{getStatusText(order.status)}</Text>
                    <Text style={styles.statusSub}>Mã đơn hàng: {order.orderNumber}</Text>
                    <Text style={styles.statusSub}>Ngày đặt: {new Date(order.orderDate).toLocaleDateString('vi-VN')}</Text>
                </View>

                {/* Khối Tracking */}
                {order.status === 2 && (
                    <TouchableOpacity style={styles.sectionCard} onPress={() => navigation.navigate('ShipmentTracking', { orderId: order.id })}>
                        <View style={styles.rowCenter}>
                            <Ionicons name="car-outline" size={24} color={colors.secondary} style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.blueText}>Thông tin vận chuyển</Text>
                                <Text style={styles.trackDesc}>Đơn hàng đang được giao.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Khối Địa chỉ */}
                <View style={styles.sectionCard}>
                    <View style={styles.rowCenter}>
                        <Ionicons name="location-outline" size={24} color={colors.primary} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Địa chỉ nhận hàng</Text>
                            {order.shippingAddress ? (
                                <>
                                    <Text style={styles.valName}>{order.shippingAddress.fullName} | {order.shippingAddress.phone}</Text>
                                    <Text style={styles.valDesc}>
                                        {order.shippingAddress.street}, {order.shippingAddress.ward && `${order.shippingAddress.ward}, `}
                                        {order.shippingAddress.district}, {order.shippingAddress.city}
                                    </Text>
                                </>
                            ) : (
                                <Text style={styles.valDesc}>Thông tin địa chỉ không khả dụng</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Danh sách SP */}
                <View style={styles.sectionCard}>
                    {order.orderItems?.map((item: any, idx: number) => (
                        <View key={idx} style={[styles.productRow, idx === order.orderItems.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={styles.prodImg}>
                                {item.productImage ? (
                                    <Image source={{ uri: item.productImage }} style={styles.fullImg} />
                                ) : (
                                    <Ionicons name="cube-outline" size={30} color={colors.textMuted} />
                                )}
                            </View>
                            <View style={styles.prodInfo}>
                                <Text style={styles.prodTitle}>{item.productName}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.prodPrice}>{item.unitPrice.toLocaleString('vi-VN')}đ</Text>
                                    <Text style={styles.prodQty}>x{item.quantity}</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    <View style={styles.orderSummary}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.sumLabel}>Tổng tiền hàng</Text>
                            <Text style={styles.sumVal}>{(order.totalAmount - 30000).toLocaleString('vi-VN')}đ</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.sumLabel}>Phí vận chuyển</Text>
                            <Text style={styles.sumVal}>30.000đ</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.sumLabel}>Tổng thanh toán</Text>
                            <Text style={styles.sumValPrice}>{order.totalAmount.toLocaleString('vi-VN')}đ</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.outlineBtnText}>Quay lại</Text>
                </TouchableOpacity>
                {order.status === 3 && (
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('WriteReview', { productId: order.orderItems?.[0]?.productId, orderId: order.id })}>
                        <Text style={styles.primaryBtnText}>Cho Đánh Giá</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
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
    prodImg: { width: 60, height: 60, backgroundColor: colors.background, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
    fullImg: { width: '100%', height: '100%' },
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
