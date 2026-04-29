import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function SellerOrdersScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const tabs = ['Chờ xác nhận', 'Đã lấy hàng', 'Hoàn tất', 'Đã hủy'];
    const [activeTab, setActiveTab] = useState('Chờ xác nhận');

    const [mockOrders, setMockOrders] = useState([
        { id: 'ORD202611', buyer: 'Nguyễn Văn A', status: 'Chờ xác nhận', itemsCount: 2, total: 32000000, date: '18:30 19/10/2026' },
        { id: 'ORD202612', buyer: 'Trần Thị B', status: 'Chờ xác nhận', itemsCount: 1, total: 500000, date: '14:20 19/10/2026' },
        { id: 'ORD202613', buyer: 'Lê Văn C', status: 'Đã lấy hàng', itemsCount: 3, total: 1200000, date: '10:00 18/10/2026' },
    ]);

    const handleApprove = (id: string) => {
        setMockOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Đã lấy hàng' } : o));
        if (Platform.OS === 'web') window.alert('Đã cập nhật trạng thái đơn thành: Đã lấy hàng');
    };

    const handleDeny = (id: string) => {
        setMockOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Đã hủy' } : o));
        if (Platform.OS === 'web') window.alert('Đã từ chối đơn hàng này');
    };

    const filtered = mockOrders.filter(o => o.status === activeTab);

    const renderItem = ({ item }: any) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderId}>{item.id}</Text>
                    <Text style={styles.buyerName}>Người mua: {item.buyer}</Text>
                </View>
                <Text style={styles.orderDate}>{item.date}</Text>
            </View>
            <View style={styles.orderBody}>
                <View style={styles.imgMock}><Ionicons name="cube-outline" size={24} color={colors.textMuted} /></View>
                <View style={styles.bodyInfo}>
                    <Text style={styles.itemCount}>Tổng số {item.itemsCount} sản phẩm</Text>
                    <Text style={styles.totalText}>Tổng thu: <Text style={styles.totalPrice}>{item.total.toLocaleString('vi-VN')}đ</Text></Text>
                </View>
            </View>
            <View style={styles.actionRow}>
                {item.status === 'Chờ xác nhận' && (
                    <>
                        <TouchableOpacity style={styles.denyBtn} onPress={() => handleDeny(item.id)}>
                            <Text style={styles.denyBtnText}>Từ chối</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                            <Text style={styles.approveBtnText}>Chuẩn bị hàng</Text>
                        </TouchableOpacity>
                    </>
                )}
                {item.status !== 'Chờ xác nhận' && (
                    <TouchableOpacity style={styles.outlineBtn}>
                        <Text style={styles.outlineBtnText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

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
                keyExtractor={i => i.id}
                contentContainerStyle={{ padding: 12 }}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', padding: 40 }}>
                        <Ionicons name="document-text-outline" size={60} color={colors.border} />
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
    orderDate: { fontSize: 12, color: colors.textMuted },

    orderBody: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
    imgMock: { width: 48, height: 48, backgroundColor: colors.background, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    bodyInfo: { flex: 1 },
    itemCount: { fontSize: 14, color: colors.text, marginBottom: 6 },
    totalText: { fontSize: 14, color: colors.textSecondary },
    totalPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },

    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    denyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.borderLight },
    denyBtnText: { color: colors.text, fontWeight: '600' },
    approveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.primary },
    approveBtnText: { color: colors.white, fontWeight: '600' },
    outlineBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
    outlineBtnText: { color: colors.textSecondary, fontWeight: '600' },
});
