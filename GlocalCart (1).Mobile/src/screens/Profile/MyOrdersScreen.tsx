import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function MyOrdersScreen({ route, navigation }: any) {
    const insets = useSafeAreaInsets();
    const initialTab = route.params?.activeTab || 'Tất cả';
    const tabs = ['Tất cả', 'Chờ xác nhận', 'Đang giao', 'Đã giao', 'Đánh giá', 'Đã hủy'];
    const [activeTab, setActiveTab] = useState(initialTab);

    const mockOrders = [
        { id: 'ORD202611', status: 'Đang giao', total: 32035000, itemsCount: 2, date: '12/10/2026', firstProductName: 'MacBook Pro M2 2023', shopName: 'Apple Official Store' },
        { id: 'ORD202612', status: 'Đã giao', total: 150000, itemsCount: 1, date: '01/10/2026', firstProductName: 'Ốp lưng Silicone iPhone 15', shopName: 'Phụ Kiện Số 1' },
        { id: 'ORD202613', status: 'Chờ xác nhận', total: 450000, itemsCount: 3, date: '15/10/2026', firstProductName: 'Áo sơ mi nam công sở', shopName: 'VietTien' },
    ];

    const filteredOrders = activeTab === 'Tất cả'
        ? mockOrders
        : activeTab === 'Đánh giá'
            ? mockOrders.filter(o => o.status === 'Đã giao') // For mock purposes, show delivered orders that need review
            : mockOrders.filter(o => o.status === activeTab);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Chờ xác nhận': return colors.warning;
            case 'Đang giao': return colors.secondary;
            case 'Đã giao': return colors.success;
            case 'Đã hủy': return colors.danger;
            default: return colors.text;
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View style={styles.shopRow}>
                    <Ionicons name="storefront" size={16} color={colors.textSecondary} />
                    <Text style={styles.shopName}>{item.shopName}</Text>
                </View>
                <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>

            <TouchableOpacity style={styles.orderBody} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
                <View style={styles.mockImg}><Ionicons name="cube-outline" size={30} color={colors.textMuted} /></View>
                <View style={styles.orderInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{item.firstProductName}</Text>
                    <Text style={styles.itemCount}>và {item.itemsCount - 1} sản phẩm khác...</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.orderFooter}>
                <Text style={styles.totalText}>Thành tiền: <Text style={styles.amount}>{item.total.toLocaleString('vi-VN')}đ</Text></Text>
            </View>

            <View style={styles.orderActions}>
                {item.status === 'Đã giao' && (
                    <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => navigation.navigate('WriteReview')}>
                        <Text style={styles.primaryBtnText}>Đánh Giá</Text>
                    </TouchableOpacity>
                )}
                {item.status === 'Đang giao' && (
                    <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => navigation.navigate('ShipmentTracking')}>
                        <Text style={styles.primaryBtnText}>Theo dõi Đơn</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.outlineBtnText}>Mua Lại</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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

            <FlatList
                data={filteredOrders}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={60} color={colors.border} />
                        <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
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
