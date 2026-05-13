import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

const INITIAL_PRODUCTS = [
    { id: '1', name: 'MacBook Pro M2 2023 - 512GB', price: 32000000, image: '', isFlashSale: true, discount: 15 },
    { id: '2', name: 'Chuột không dây Logitech MX Master 3', price: 2500000, image: '', isFlashSale: false, discount: 0 },
    { id: '3', name: 'Bàn phím cơ Keychron K2', price: 1800000, image: '', isFlashSale: true, discount: 25 },
    { id: '4', name: 'Tai nghe Sony WH-1000XM5', price: 7500000, image: '', isFlashSale: false, discount: 0 },
    { id: '5', name: 'iPad Air M1 64GB Wifi', price: 13990000, image: '', isFlashSale: true, discount: 10 },
    { id: '6', name: 'Áo sơ mi nam công sở Premium', price: 450000, image: '', isFlashSale: false, discount: 0 },
];

export default function SellerFlashSaleScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [products, setProducts] = useState(INITIAL_PRODUCTS);

    const toggleFlashSale = (id: string) => {
        setProducts(prev => prev.map(p =>
            p.id === id
                ? { ...p, isFlashSale: !p.isFlashSale, discount: !p.isFlashSale ? 10 : 0 }
                : p
        ));
    };

    const setDiscount = (id: string, val: string) => {
        const num = parseInt(val) || 0;
        const clamped = Math.min(Math.max(num, 0), 90);
        setProducts(prev => prev.map(p =>
            p.id === id ? { ...p, discount: clamped } : p
        ));
    };

    const flashSaleCount = products.filter(p => p.isFlashSale).length;

    const handleSave = () => {
        const flashItems = products.filter(p => p.isFlashSale);
        Alert.alert(
            'Đã lưu cài đặt Flash Sale ✓',
            `${flashItems.length} sản phẩm đang được Flash Sale.\n\n` +
            flashItems.map(p => `• ${p.name}: -${p.discount}%`).join('\n'),
            [{ text: 'OK' }]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cài đặt Flash Sale</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Stats Banner */}
            <View style={styles.statsBanner}>
                <View style={styles.statItem}>
                    <Ionicons name="flash" size={20} color="#ee4d2d" />
                    <Text style={styles.statValue}>{flashSaleCount}</Text>
                    <Text style={styles.statLabel}>Đang Flash Sale</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Ionicons name="cube-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.statValue}>{products.length - flashSaleCount}</Text>
                    <Text style={styles.statLabel}>Giá thường</Text>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {products.map(product => {
                    const salePrice = product.price * (1 - product.discount / 100);
                    return (
                        <View key={product.id} style={[styles.productCard, product.isFlashSale && styles.productCardActive]}>
                            <View style={styles.productTop}>
                                <View style={styles.imgMock}>
                                    <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                                    <Text style={styles.productPrice}>₫{product.price.toLocaleString('vi-VN')}</Text>
                                </View>
                                <View style={styles.toggleWrap}>
                                    <Switch
                                        value={product.isFlashSale}
                                        onValueChange={() => toggleFlashSale(product.id)}
                                        trackColor={{ false: '#ddd', true: '#ffbda6' }}
                                        thumbColor={product.isFlashSale ? '#ee4d2d' : '#f4f3f4'}
                                    />
                                </View>
                            </View>

                            {product.isFlashSale && (
                                <View style={styles.discountRow}>
                                    <View style={styles.flashBadge}>
                                        <Ionicons name="flash" size={12} color="#fff" />
                                        <Text style={styles.flashBadgeText}>FLASH SALE</Text>
                                    </View>
                                    <View style={styles.discountInput}>
                                        <Text style={styles.discountLabel}>Giảm</Text>
                                        <TextInput
                                            style={styles.discountField}
                                            value={product.discount.toString()}
                                            onChangeText={(val) => setDiscount(product.id, val)}
                                            keyboardType="numeric"
                                            maxLength={2}
                                        />
                                        <Text style={styles.discountLabel}>%</Text>
                                    </View>
                                    <Text style={styles.salePrice}>→ ₫{salePrice.toLocaleString('vi-VN')}</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Bottom Save Bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>Lưu cài đặt ({flashSaleCount} SP)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, paddingVertical: 12,
        backgroundColor: colors.white, ...shadow.sm,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { flex: 1 },

    // Stats Banner
    statsBanner: {
        flexDirection: 'row', backgroundColor: '#fff',
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 12, color: colors.textSecondary },
    statDivider: { width: 1, backgroundColor: colors.borderLight },

    // Product Card
    productCard: {
        backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    },
    productCardActive: { backgroundColor: '#FFF8F5' },
    productTop: { flexDirection: 'row', alignItems: 'center' },
    imgMock: {
        width: 56, height: 56, borderRadius: 8, backgroundColor: colors.background,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 4 },
    productPrice: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    toggleWrap: { marginLeft: 8 },

    // Discount Row
    discountRow: {
        flexDirection: 'row', alignItems: 'center', marginTop: 10,
        paddingTop: 10, borderTopWidth: 1, borderTopColor: '#FFE8DE',
        flexWrap: 'wrap', gap: 8,
    },
    flashBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: '#ee4d2d', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    },
    flashBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    discountInput: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    discountLabel: { fontSize: 13, color: colors.textSecondary },
    discountField: {
        width: 44, height: 32, borderWidth: 1, borderColor: '#ee4d2d',
        borderRadius: 4, textAlign: 'center', fontSize: 15, fontWeight: '700',
        color: '#ee4d2d', backgroundColor: '#fff',
    },
    salePrice: { fontSize: 14, fontWeight: '700', color: '#ee4d2d' },

    // Bottom Bar
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: colors.borderLight,
        ...shadow.md,
    },
    saveBtn: {
        backgroundColor: '#ee4d2d', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 8,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
