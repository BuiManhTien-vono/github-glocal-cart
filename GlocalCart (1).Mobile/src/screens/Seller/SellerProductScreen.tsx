import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function SellerProductsScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const mockProducts = [
        { id: '1', name: 'MacBook Pro M2 2023 - 512GB', price: 32000000, stock: 15, sales: 120, status: 'active' },
        { id: '2', name: 'Chuột không dây Logitech MX Master 3', price: 2500000, stock: 50, sales: 85, status: 'active' },
        { id: '3', name: 'Bàn phím cơ Keychron K2', price: 1800000, stock: 0, sales: 42, status: 'out_of_stock' },
        { id: '4', name: 'Tai nghe Sony WH-1000XM5', price: 7500000, stock: 10, sales: 0, status: 'hidden' },
    ];

    const renderItem = ({ item }: any) => (
        <View style={styles.prodCard}>
            <View style={styles.prodHeader}>
                <Text style={styles.prodTitle} numberOfLines={2}>{item.name}</Text>
                <TouchableOpacity><Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <View style={styles.prodBody}>
                <View style={styles.imgMock}><Ionicons name="image-outline" size={30} color={colors.textMuted} /></View>
                <View style={styles.prodMetrics}>
                    <Text style={styles.price}>{item.price.toLocaleString('vi-VN')}đ</Text>
                    <View style={styles.metricsRow}>
                        <Text style={styles.metricItem}>Kho: <Text style={{ fontWeight: '600', color: item.stock === 0 ? colors.danger : colors.text }}>{item.stock}</Text></Text>
                        <Text style={styles.metricItem}>Đã bán: <Text style={{ fontWeight: '600' }}>{item.sales}</Text></Text>
                    </View>
                    <View style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : item.status === 'out_of_stock' ? styles.statusOut : styles.statusHidden]}>
                        <Text style={styles.statusText}>
                            {item.status === 'active' ? 'Đang bán' : item.status === 'out_of_stock' ? 'Hết hàng' : 'Đang ẩn'}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Ẩn SP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary }]}>
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Đẩy SP</Text>
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
                <Text style={styles.headerTitle}>Sản Phẩm Của Tôi</Text>
                <TouchableOpacity><Ionicons name="add" size={28} color={colors.primary} /></TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <TextInput style={styles.searchInput} placeholder="Tìm sản phẩm của bạn..." />
                </View>
            </View>

            <FlatList
                data={mockProducts}
                renderItem={renderItem}
                keyExtractor={i => i.id}
                contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

    searchContainer: { backgroundColor: colors.white, paddingHorizontal: 16, paddingBottom: 12 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: 12, height: 44 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },

    prodCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 16, marginBottom: 12, ...shadow.sm },
    prodHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    prodTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, marginRight: 12 },
    prodBody: { flexDirection: 'row', marginBottom: 16 },
    imgMock: { width: 80, height: 80, backgroundColor: colors.background, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    prodMetrics: { flex: 1, justifyContent: 'space-between' },
    price: { fontSize: 16, fontWeight: '700', color: colors.primary },
    metricsRow: { flexDirection: 'row', gap: 16 },
    metricItem: { fontSize: 13, color: colors.textSecondary },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    statusActive: { backgroundColor: colors.success + '20' },
    statusOut: { backgroundColor: colors.danger + '20' },
    statusHidden: { backgroundColor: colors.textMuted + '30' },
    statusText: { fontSize: 11, fontWeight: '600', color: colors.text },

    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 },
    actionBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
    actionBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary }
});
