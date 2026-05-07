import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImage } from '../../utils/imageUtils';

interface ProductItem {
    id: number;
    name: string;
    price: number;
    availableItemCount: number;
    isActive: boolean;
    mediaUrl?: string;
    categoryName?: string;
    images?: { id: number; imageUrl: string; isMain: boolean; hasImageData: boolean }[];
    reviewCount?: number;
    averageRating?: number;
    createdAt?: string;
}

export default function SellerProductsScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // Reload khi quay lại màn hình (sau khi thêm/sửa SP)
    useFocusEffect(
        useCallback(() => {
            loadProducts();
        }, [])
    );

    const loadProducts = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/products/my-products?pageSize=100');
            // API trả về PagedResult: { items, totalCount, page, pageSize }
            const items = (res as any)?.items || (res as any) || [];
            setProducts(Array.isArray(items) ? items : []);
        } catch (err: any) {
            console.log('[MyProducts Error]', err?.message);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = searchText.trim()
        ? products.filter(p => p.name?.toLowerCase().includes(searchText.trim().toLowerCase()))
        : products;

    const getStatus = (item: ProductItem) => {
        if (!item.isActive) return 'hidden';
        if (item.availableItemCount === 0) return 'out_of_stock';
        return 'active';
    };

    const getImageUri = (item: ProductItem): string | null => {
        return resolveProductImage(item);
    };

    const renderItem = ({ item }: { item: ProductItem }) => {
        const status = getStatus(item);
        const imageUri = getImageUri(item);

        return (
            <View style={styles.prodCard}>
                <View style={styles.prodHeader}>
                    <Text style={styles.prodTitle} numberOfLines={2}>{item.name}</Text>
                    <TouchableOpacity><Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} /></TouchableOpacity>
                </View>
                <View style={styles.prodBody}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.prodImage} />
                    ) : (
                        <View style={styles.imgMock}><Ionicons name="image-outline" size={30} color={colors.textMuted} /></View>
                    )}
                    <View style={styles.prodMetrics}>
                        <Text style={styles.price}>{item.price.toLocaleString('vi-VN')}đ</Text>
                        <View style={styles.metricsRow}>
                            <Text style={styles.metricItem}>Kho: <Text style={{ fontWeight: '600', color: item.availableItemCount === 0 ? colors.danger : colors.text }}>{item.availableItemCount}</Text></Text>
                        </View>
                        <View style={[styles.statusBadge, status === 'active' ? styles.statusActive : status === 'out_of_stock' ? styles.statusOut : styles.statusHidden]}>
                            <Text style={styles.statusText}>
                                {status === 'active' ? 'Đang bán' : status === 'out_of_stock' ? 'Hết hàng' : 'Đang ẩn'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SellerEditProduct', { product: item })}>
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
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sản Phẩm Của Tôi</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SellerAddProduct')}><Ionicons name="add" size={28} color={colors.primary} /></TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm sản phẩm của bạn..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
                </View>
            ) : filteredProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cube-outline" size={60} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>
                        {searchText ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {searchText ? 'Thử từ khóa khác' : 'Nhấn nút + để thêm sản phẩm đầu tiên'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderItem}
                    keyExtractor={i => String(i.id)}
                    contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
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

    searchContainer: { backgroundColor: colors.white, paddingHorizontal: 16, paddingBottom: 12 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: 12, height: 44 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },

    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: colors.textMuted },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
    emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

    prodCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 16, marginBottom: 12, ...shadow.sm },
    prodHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    prodTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, marginRight: 12 },
    prodBody: { flexDirection: 'row', marginBottom: 16 },
    prodImage: { width: 80, height: 80, borderRadius: 8, marginRight: 16, backgroundColor: colors.background },
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
