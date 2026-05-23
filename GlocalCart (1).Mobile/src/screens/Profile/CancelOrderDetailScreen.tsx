import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { Loading } from '../../components/common/Loading';
import { resolveProductImageUrl } from '../../utils/imageUtils';

export default function CancelOrderDetailScreen({ navigation, route }: any) {
    const orderId = route?.params?.orderId;
    const insets = useSafeAreaInsets();
    const [order, setOrder] = useState<any>(null);
    const [reason, setReason] = useState<string>('Không có lý do');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetail();
            fetchOrderLogs();
        }
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

    const fetchOrderLogs = async () => {
        try {
            const logs: any[] = await apiClient.get(`/orders/${orderId}/logs`);
            // Find the latest log where status is Canceled
            const cancelLog = logs.reverse().find(l => l.status === 'Canceled');
            if (cancelLog && cancelLog.note) {
                // Extract reason if it follows the format "Người mua hủy đơn. Lý do: ..."
                const prefix = 'Lý do: ';
                const idx = cancelLog.note.indexOf(prefix);
                if (idx !== -1) {
                    setReason(cancelLog.note.substring(idx + prefix.length));
                } else {
                    setReason(cancelLog.note);
                }
            }
        } catch (error) {
            console.log('fetchOrderLogs error:', error);
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

    const firstItem = order.items?.[0];

    const formattedDate = new Date(order.orderDate).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết đơn hủy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Banner trạng thái */}
                <View style={styles.statusBanner}>
                    <View style={styles.statusTextContainer}>
                        <Text style={styles.statusBig}>Đã hủy đơn hàng</Text>
                        <Text style={styles.statusSub}>vào {formattedDate}</Text>
                    </View>
                    <Ionicons name="checkmark-circle-outline" size={50} color={colors.danger} />
                </View>

                {/* Danh sách SP */}
                <View style={styles.sectionCard}>
                    <View style={styles.shopRow}>
                        <View style={styles.shopBadge}>
                            <Text style={styles.shopBadgeText}>Yêu thích</Text>
                        </View>
                        <Text style={styles.shopName}>{firstItem?.sellerName || 'Cửa hàng'}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </View>

                    {order.items?.map((item: any, idx: number) => {
                        const img = item.productImage ? resolveProductImageUrl(item.productImage) : null;
                        return (
                            <View key={idx} style={[styles.productRow, idx > 0 && { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                                <View style={styles.prodImg}>
                                    {img ? (
                                        <Image source={{ uri: img }} style={styles.fullImg} />
                                    ) : (
                                        <Ionicons name="cube-outline" size={30} color={colors.textMuted} />
                                    )}
                                </View>
                                <View style={styles.prodInfo}>
                                    <Text style={styles.prodTitle} numberOfLines={2}>{item.productName}</Text>
                                    <Text style={styles.prodVariant}>Phân loại hàng: Mặc định</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.prodQty}>x{item.quantity}</Text>
                                        <Text style={styles.prodPrice}>{item.unitPrice?.toLocaleString('vi-VN')}đ</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Thông tin hủy */}
                <View style={styles.sectionCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Yêu cầu bởi</Text>
                        <Text style={styles.infoValue}>Người mua</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Yêu cầu vào</Text>
                        <Text style={styles.infoValue}>{formattedDate}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Lý do</Text>
                        <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', marginLeft: 20 }]}>{reason}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phương thức thanh toán</Text>
                        <Text style={styles.infoValue}>{order.payment?.method === 'CashOnDelivery' ? 'COD' : order.payment?.method}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '500', color: colors.text },
    scrollContent: { paddingBottom: 30 },

    statusBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, padding: 20, marginBottom: 8 },
    statusTextContainer: { flex: 1 },
    statusBig: { fontSize: 20, fontWeight: 'bold', color: colors.danger, marginBottom: 6 },
    statusSub: { fontSize: 14, color: colors.textSecondary },

    sectionCard: { backgroundColor: colors.white, padding: 16, marginBottom: 8 },

    shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    shopBadge: { backgroundColor: colors.danger, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 },
    shopBadgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
    shopName: { fontSize: 14, fontWeight: '600', color: colors.text },

    productRow: { flexDirection: 'row' },
    prodImg: { width: 70, height: 70, backgroundColor: colors.background, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
    fullImg: { width: '100%', height: '100%' },
    prodInfo: { flex: 1 },
    prodTitle: { fontSize: 14, fontWeight: '400', color: colors.text, marginBottom: 4 },
    prodVariant: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
    priceRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10 },
    prodQty: { fontSize: 13, color: colors.textSecondary },
    prodPrice: { fontSize: 14, color: colors.text, fontWeight: '500' },

    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    infoLabel: { fontSize: 14, color: colors.textSecondary },
    infoValue: { fontSize: 14, color: colors.text },
});
