import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { Loading } from '../../components/common/Loading';

export default function MyOrdersScreen({ route, navigation }: any) {
    const insets = useSafeAreaInsets();
    const initialTab = route.params?.activeTab || 'Tất cả';
    const tabs = ['Tất cả', 'Chờ xác nhận', 'Đang giao', 'Đã giao', 'Đánh giá', 'Đã hủy'];
    const [activeTab, setActiveTab] = useState(initialTab);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data: any = await apiClient.get('/orders/my');
            setOrders(data || []);
        } catch (error) {
            console.log('fetchOrders error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
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

    const filteredOrders = orders.filter(o => {
        const statusText = getStatusText(o.status);
        if (activeTab === 'Tất cả') return true;
        if (activeTab === 'Đánh giá') return o.status === 3; // Delivered
        return statusText === activeTab;
    });

    const getStatusColor = (status: number) => {
        switch (status) {
            case 0: return colors.warning;
            case 1: return colors.info;
            case 2: return colors.secondary;
            case 3: return colors.success;
            case 4: return colors.danger;
            default: return colors.text;
        }
    };

    const renderItem = ({ item }: any) => {
        const statusText = getStatusText(item.status);
        const statusColor = getStatusColor(item.status);
        const firstItem = item.orderItems?.[0];
        const itemsCount = item.orderItems?.length || 0;

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View style={styles.shopRow}>
                        <Ionicons name="receipt-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.shopName}>Đơn hàng: {item.orderNumber}</Text>
                    </View>
                    <Text style={[styles.orderStatus, { color: statusColor }]}>{statusText}</Text>
                </View>

                <TouchableOpacity style={styles.orderBody} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
                    <View style={styles.mockImg}><Ionicons name="cube-outline" size={30} color={colors.textMuted} /></View>
                    <View style={styles.orderInfo}>
                        <Text style={styles.productName} numberOfLines={2}>
                            {firstItem?.productName || 'Sản phẩm không tên'}
                        </Text>
                        {itemsCount > 1 && (
                            <Text style={styles.itemCount}>và {itemsCount - 1} sản phẩm khác...</Text>
                        )}
                    </View>
                </TouchableOpacity>

                <View style={styles.orderFooter}>
                    <Text style={styles.totalText}>Thành tiền: <Text style={styles.amount}>{item.totalAmount.toLocaleString('vi-VN')}đ</Text></Text>
                </View>

                <View style={styles.orderActions}>
                    {item.status === 3 && ( // Delivered
                        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => navigation.navigate('WriteReview', { productId: firstItem?.productId, orderId: item.id })}>
                            <Text style={styles.primaryBtnText}>Đánh Giá</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 2 && ( // Shipping
                        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => navigation.navigate('ShipmentTracking', { orderId: item.id })}>
                            <Text style={styles.primaryBtnText}>Theo dõi Đơn</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
                        <Text style={styles.outlineBtnText}>Chi tiết</Text>
                    </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Đơn mua</Text>
                <TouchableOpacity style={styles.backBtn}><Ionicons name="search" size={22} color={colors.text} /></TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={tabs}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.tabItem, activeTab === item && styles.tabItemActive]}
                            onPress={() => setActiveTab(item)}
                        >
                            <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(i) => i}
                />
            </View>

            {isLoading ? <Loading /> : (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[colors.primary]} />
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={60} color={colors.border} />
                            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
                        </View>
                    )}
                />
            )}
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

    listContent: { padding: spacing.sm },
    orderCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadow.sm, overflow: 'hidden' },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    shopName: { fontSize: 14, fontWeight: '700', color: colors.text },
    orderStatus: { fontSize: 13, fontWeight: '700' },

    orderBody: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    mockImg: { width: 60, height: 60, backgroundColor: colors.background, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    orderInfo: { flex: 1 },
    productName: { fontSize: 15, color: colors.text, fontWeight: '500', marginBottom: 4 },
    itemCount: { fontSize: 13, color: colors.textSecondary },

    orderFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    totalText: { fontSize: 14, color: colors.text },
    amount: { fontSize: 16, color: colors.primary, fontWeight: '700' },

    orderActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, gap: 10 },
    actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
    primaryBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
    primaryBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
    outlineBtnText: { color: colors.text, fontWeight: '600', fontSize: 13 },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    emptyText: { marginTop: 12, color: colors.textSecondary, fontSize: 16 }
});
