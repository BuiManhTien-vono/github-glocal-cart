import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Alert, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImageUrl } from '../../utils/imageUtils';

export default function SellerOrdersScreen({ route, navigation }: any) {
    const insets = useSafeAreaInsets();
    const tabs = ['Chờ xác nhận', 'Vận chuyển', 'Đang giao', 'Hoàn tất', 'Đã hủy'];
    const initialTab = (route.params?.activeTab && route.params.activeTab !== 'Tất cả') ? route.params.activeTab : 'Chờ xác nhận';
    const [activeTab, setActiveTab] = useState(initialTab);

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const data: any = await apiClient.get('/orders/seller');
            setOrders(data?.items || []);
        } catch (error) {
            console.warn('fetch seller orders error', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchOrders();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const handleCreateShipment = (id: number) => {
        navigation.navigate('SellerCreateShipment', { orderId: id });
    };

    const handleDeny = async (id: number) => {
        if (Platform.OS === 'web') {
            const reason = window.prompt('Nhập lý do từ chối (bắt buộc):');
            if (reason === null) return;
            if (!reason.trim()) {
                window.alert('Lý do từ chối không được để trống.');
                return;
            }
            try {
                await apiClient.patch(`/orders/${id}/reject`, { reason });
                window.alert('Đã từ chối đơn hàng.');
                fetchOrders();
            } catch (error: any) {
                window.alert(error.message || 'Không thể từ chối đơn hàng.');
            }
            return;
        }

        Alert.prompt(
            'Từ chối đơn hàng',
            'Nhập lý do từ chối (bắt buộc):',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Từ chối',
                    style: 'destructive',
                    onPress: async (reason?: string) => {
                        if (!reason?.trim()) {
                            Alert.alert('Lỗi', 'Lý do từ chối không được để trống.');
                            return;
                        }
                        try {
                            await apiClient.patch(`/orders/${id}/reject`, { reason });
                            Alert.alert('Thành công', 'Đã từ chối đơn hàng.');
                            fetchOrders();
                        } catch (error: any) {
                            Alert.alert('Lỗi', error.message || 'Không thể từ chối đơn hàng.');
                        }
                    }
                }
            ]
        );
    };

    const getStatusText = (status: string | number) => {
        switch (String(status).toLowerCase()) {
            case '0': case 'pending': return 'Chờ xác nhận';
            case '1': case 'processing': 
            case '5': case 'unshipped': return 'Vận chuyển';
            case '2': case 'shipped': return 'Đang giao';
            case '3': case 'delivered': case 'complete': return 'Hoàn tất';
            case '4': case 'canceled': return 'Đã hủy';
            default: return 'Khác';
        }
    };

    const getStatusColor = (statusText: string) => {
        switch (statusText) {
            case 'Chờ xác nhận': return colors.warning;
            case 'Vận chuyển': return colors.secondary;
            case 'Đang giao': return colors.primary;
            case 'Hoàn tất': return colors.success;
            case 'Đã hủy': return colors.danger;
            default: return colors.text;
        }
    };

    const filtered = orders.filter(o => {
        if (activeTab === 'Tất cả') return true;
        return getStatusText(o.status) === activeTab;
    });

    const renderItem = ({ item }: any) => {
        const statusText = getStatusText(item.status);
        const statusColor = getStatusColor(statusText);
        const firstItem = item.items?.[0] || item.orderItems?.[0];
        const itemsCount = item.items?.length || item.orderItems?.length || 0;
        const productImage = firstItem?.productImage ? resolveProductImageUrl(firstItem.productImage) : null;
        
        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderId}>Đơn: {item.orderNumber}</Text>
                        <Text style={styles.buyerName}>Người mua ID: {item.buyerId}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.statusBadge, { color: statusColor }]}>{statusText}</Text>
                        <Text style={styles.orderDate}>{new Date(item.orderDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                    </View>
                </View>
                <View style={styles.orderBody}>
                    <View style={styles.imgMock}>
                        {productImage ? (
                            <Image source={{ uri: productImage }} style={{ width: '100%', height: '100%', borderRadius: 6 }} resizeMode="cover" />
                        ) : (
                            <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
                        )}
                    </View>
                    <View style={styles.bodyInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{firstItem?.productName || 'Sản phẩm'}</Text>
                        <Text style={styles.itemCount}>Tổng cộng: {itemsCount} sản phẩm</Text>
                        <Text style={styles.totalText}>Tổng thu: <Text style={styles.totalPrice}>{item.totalAmount?.toLocaleString('vi-VN')}đ</Text></Text>
                    </View>
                </View>
                <View style={styles.actionRow}>
                    {statusText === 'Chờ xác nhận' && (
                        <>
                            <TouchableOpacity style={styles.denyBtn} onPress={() => handleDeny(item.id)}>
                                <Text style={styles.denyBtnText}>Từ chối</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.approveBtn} onPress={() => handleCreateShipment(item.id)}>
                                <Text style={styles.approveBtnText}>Tạo vận đơn</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {statusText !== 'Chờ xác nhận' && (
                        <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
                            <Text style={styles.outlineBtnText}>Xem chi tiết</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý Đơn Khách</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={tabs}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={[styles.tabItem, activeTab === item && styles.tabItemActive]} onPress={() => setActiveTab(item)}>
                            <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(i) => i}
                />
            </View>

            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={i => String(i.id)}
                contentContainerStyle={{ padding: 12, paddingBottom: 50 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', padding: 40 }}>
                        <Ionicons name="document-text-outline" size={60} color={colors.borderLight} />
                        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Không có đơn hàng nào.</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

    tabsContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    tabItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: colors.primary },
    tabText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    tabTextActive: { color: colors.primary, fontWeight: '700' },

    orderCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 16, marginBottom: 12, ...shadow.sm },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 12, marginBottom: 12 },
    orderId: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
    buyerName: { fontSize: 13, color: colors.textSecondary },
    orderDate: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    statusBadge: { fontSize: 13, fontWeight: '700' },

    orderBody: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
    imgMock: { width: 60, height: 60, backgroundColor: colors.background, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    bodyInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
    itemCount: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    totalText: { fontSize: 13, color: colors.textSecondary },
    totalPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },

    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    denyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.borderLight },
    denyBtnText: { color: colors.text, fontWeight: '600' },
    approveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.primary },
    approveBtnText: { color: colors.white, fontWeight: '600' },
    outlineBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
    outlineBtnText: { color: colors.textSecondary, fontWeight: '600' },
});
