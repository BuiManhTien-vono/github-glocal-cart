import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function SellerDashboardScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const stats = [
        { label: 'Doanh thu', value: '45.0M', icon: 'wallet-outline', color: colors.success },
        { label: 'Đơn chờ duyệt', value: '12', icon: 'cube-outline', color: colors.warning },
        { label: 'Sản phẩm', value: '34', icon: 'pricetags-outline', color: colors.primary },
        { label: 'Đánh giá', value: '4.8', icon: 'star-outline', color: '#F59E0B' },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kênh Người Bán</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Banner Tổng quan */}
                <View style={styles.banner}>
                    <Text style={styles.bannerTitle}>Hiệu suất hôm nay</Text>
                </View>
                <View style={styles.floatingStatsContainer}>
                    <View style={styles.statsRow}>
                        {stats.slice(0, 2).map((s, i) => (
                            <View key={i} style={[styles.statBox, i === 0 && styles.statBorderRight, styles.statBorderBottom]}>
                                <Ionicons name={s.icon as any} size={28} color={s.color} style={{ marginBottom: 8 }} />
                                <Text style={styles.statVal}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.statsRow}>
                        {stats.slice(2, 4).map((s, i) => (
                            <View key={i} style={[styles.statBox, i === 0 && styles.statBorderRight]}>
                                <Ionicons name={s.icon as any} size={28} color={s.color} style={{ marginBottom: 8 }} />
                                <Text style={styles.statVal}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Menu Quản lý */}
                <View style={styles.menuContainer}>
                    <Text style={styles.sectionTitle}>Quản lý Cửa Hàng</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ShopView', { shopId: 1 })}>
                        <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="storefront-outline" size={24} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuLabel}>Xem Shop của tôi</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Hiển thị giao diện người mua</Text>
                        </View>
                        <Ionicons name="eye-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SellerOrders')}>
                        <View style={[styles.menuIcon, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="receipt-outline" size={24} color={colors.warning} />
                        </View>
                        <Text style={styles.menuLabel}>Quản lý Đơn Hàng</Text>
                        <View style={styles.badge}><Text style={styles.badgeText}>12</Text></View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SellerProducts')}>
                        <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="shirt-outline" size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.menuLabel}>Quản lý Sản Phẩm</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SellerShopInfo')}>
                        <View style={[styles.menuIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                            <Ionicons name="color-palette-outline" size={24} color="#8B5CF6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuLabel}>Trang trí Shop</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Thay đổi tên, logo, ảnh bìa, mô tả</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SellerCategories')}>
                        <View style={[styles.menuIcon, { backgroundColor: '#06B6D4' + '20' }]}>
                            <Ionicons name="folder-outline" size={24} color="#06B6D4" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuLabel}>Danh mục Shop</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Thêm, sửa, xóa danh mục riêng</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SellerFlashSale')}>
                        <View style={[styles.menuIcon, { backgroundColor: '#ee4d2d' + '20' }]}>
                            <Ionicons name="flash-outline" size={24} color="#ee4d2d" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuLabel}>Cài đặt Flash Sale</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Bật/tắt giảm giá cho sản phẩm</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIcon, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="pie-chart-outline" size={24} color={colors.success} />
                        </View>
                        <Text style={styles.menuLabel}>Tài Chính & Doanh Thu</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIcon, { backgroundColor: colors.secondary + '20' }]}>
                            <Ionicons name="megaphone-outline" size={24} color={colors.secondary} />
                        </View>
                        <Text style={styles.menuLabel}>Kênh Marketing</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.primary, zIndex: 10 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
    scrollContent: { paddingBottom: 40 },

    banner: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 60, paddingTop: 16 },
    bannerTitle: { fontSize: 18, color: colors.white, fontWeight: '700', marginBottom: 16 },
    floatingStatsContainer: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: -40, borderRadius: 16, ...shadow.md, overflow: 'hidden' },
    statsRow: { flexDirection: 'row' },
    statBox: { flex: 1, padding: 16, paddingVertical: 20, alignItems: 'center', backgroundColor: colors.white },
    statBorderRight: { borderRightWidth: 1, borderRightColor: colors.borderLight },
    statBorderBottom: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    statVal: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 2 },
    statLabel: { fontSize: 13, color: colors.textSecondary },

    menuContainer: { padding: 16, marginTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 16, borderRadius: borderRadius.md, marginBottom: 12, ...shadow.sm },
    menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
    badge: { backgroundColor: colors.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
    badgeText: { color: colors.white, fontSize: 12, fontWeight: '700' }
});
