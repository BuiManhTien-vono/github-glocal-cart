import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Dimensions, Animated, Platform, ActivityIndicator,
    RefreshControl, StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImage } from '../../utils/imageUtils';
import { ProductCard } from '../../components/shop/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_BANNER_HEIGHT = 220;

const TABS = [
    { id: 'shop', label: 'Shop' },
    { id: 'products', label: 'Sản phẩm' },
    { id: 'categories', label: 'Danh mục' }
];

const SELLER_CATEGORIES = [
    { id: 'sc1', name: 'Điện thoại', icon: 'phone-portrait-outline' },
    { id: 'sc2', name: 'Laptop', icon: 'laptop-outline' },
    { id: 'sc3', name: 'Thời trang', icon: 'shirt-outline' },
    { id: 'sc4', name: 'Gia dụng', icon: 'home-outline' },
    { id: 'sc5', name: 'Làm đẹp', icon: 'color-palette-outline' },
    { id: 'sc6', name: 'Sách', icon: 'book-outline' },
    { id: 'sc7', name: 'Thể thao', icon: 'football-outline' },
];

export default function SellerShopScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    
    // States
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [activeTab, setActiveTab] = useState('shop');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    // Real seller categories fetched from API
    const [sellerCategories, setSellerCategories] = useState<any[]>([]);

    const loadSellerCategories = async () => {
        try {
            const res = await apiClient.get('/categories');
            const cats = Array.isArray(res) ? res : (res as any)?.data ?? [];
            const flat: any[] = [];
            const flatten = (list: any[], prefix = '') => {
                list.forEach(c => {
                    flat.push({ ...c, name: prefix + c.name, icon: c.icon || 'list-outline' });
                    if (c.subCategories?.length) flatten(c.subCategories, prefix + '  ');
                });
            };
            flatten(cats);
            setSellerCategories(flat);
        } catch {
            setSellerCategories([]);
        }
    };
    
    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Mock Data
    const shopData = {
        name: 'Glocal Cart Official Store',
        logo: 'https://ui-avatars.com/api/?name=GC&background=FF6B35&color=fff&size=120&bold=true',
        banner: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop',
        rating: 4.8,
        reviewCount: 1240,
        followerCount: '15.2k',
    };

    const stats = {
        newOrders: 12,
        pendingReviews: 5,
        totalRevenue: '45.8M',
    };

    const fetchProducts = async () => {
        try {
            const res = await apiClient.get('/products') as any;
            setProducts(res?.items || (Array.isArray(res) ? res : []));
        } catch (error) {
            console.warn('SellerShop fetch error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    // Load seller categories on mount
    useEffect(() => {
        loadSellerCategories();
    }, []);

    const onRefresh = () => { setRefreshing(true); fetchProducts(); };

    // ─── Render Shop Tab Content ───
    const renderShopTab = () => (
        <View>
            {/* 1. Seller Stats Overview (Only in non-guest mode) */}
            {!isPreviewMode && (
                <View style={styles.overviewSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                        <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('SellerOrders')}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.newOrders}</Text>
                            <Text style={styles.statLabel}>Đơn mới</Text>
                        </TouchableOpacity>
                        <View style={styles.statDivider} />
                        <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('SellerReview')}>
                            <Text style={[styles.statValue, { color: colors.secondary }]}>{stats.pendingReviews}</Text>
                            <Text style={styles.statLabel}>Đánh giá</Text>
                        </TouchableOpacity>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: colors.success }]}>{stats.totalRevenue}</Text>
                            <Text style={styles.statLabel}>Doanh thu</Text>
                        </View>
                    </ScrollView>
                </View>
            )}

            {/* 2. Flash Sale Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.flashTitleRow}>
                        <Ionicons name="flash" size={20} color="#ee4d2d" />
                        <Text style={styles.flashTitle}>FLASH SALE</Text>
                    </View>
                    {!isPreviewMode && (
                        <TouchableOpacity 
                            style={styles.manageSmallBtn}
                            onPress={() => navigation.navigate('SellerFlashSale')}
                        >
                            <Ionicons name="settings-outline" size={14} color={colors.primary} />
                            <Text style={styles.manageSmallBtnText}>Cài đặt</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {products.slice(0, 5).map((item, idx) => (
                        <View key={item.id} style={styles.flashCard}>
                            <Image source={{ uri: resolveProductImage(item) ?? undefined }} style={styles.flashImg} />
                            <Text style={styles.flashPrice}>₫{item.price.toLocaleString('vi-VN')}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* 3. Best Sellers */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sản phẩm bán chạy</Text>
                    <TouchableOpacity onPress={() => setActiveTab('products')}>
                        <Text style={styles.seeAllText}>Xem tất cả ›</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {products.slice(0, 8).map((item) => (
                        <View key={item.id} style={styles.bestCard}>
                            <Image source={{ uri: resolveProductImage(item) ?? undefined }} style={styles.bestImg} />
                            <Text style={styles.bestName} numberOfLines={2}>{item.name}</Text>
                            <Text style={styles.bestPrice}>₫{item.price.toLocaleString('vi-VN')}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* 4. Recommendation Grid */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
                </View>
                <View style={styles.productGrid}>
                    {products.slice(0, 10).map(item => (
                        <ProductCard key={item.id} item={item} />
                    ))}
                </View>
            </View>

            {/* 5. Additional Tools (Finance, Marketing) */}
            {!isPreviewMode && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Công cụ quản lý khác</Text>
                    </View>
                    <View style={styles.toolsRow}>
                        <TouchableOpacity style={styles.toolItem}>
                            <View style={[styles.toolIconWrap, { backgroundColor: colors.success + '15' }]}>
                                <Ionicons name="pie-chart-outline" size={24} color={colors.success} />
                            </View>
                            <Text style={styles.toolLabel}>Tài chính</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolItem}>
                            <View style={[styles.toolIconWrap, { backgroundColor: colors.secondary + '15' }]}>
                                <Ionicons name="megaphone-outline" size={24} color={colors.secondary} />
                            </View>
                            <Text style={styles.toolLabel}>Marketing</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolItem}>
                            <View style={[styles.toolIconWrap, { backgroundColor: '#8B5CF6' + '15' }]}>
                                <Ionicons name="analytics-outline" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={styles.toolLabel}>Phân tích</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );

    // ─── Render Products Tab Content ───
    const renderProductsTab = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tất cả sản phẩm ({products.length})</Text>
                {!isPreviewMode && (
                    <TouchableOpacity 
                        style={styles.manageSmallBtn}
                        onPress={() => navigation.navigate('SellerProducts')}
                    >
                        <Ionicons name="shirt-outline" size={14} color={colors.primary} />
                        <Text style={styles.manageSmallBtnText}>Quản lý</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.productGrid}>
                {products.map(item => (
                    <ProductCard key={item.id} item={item} />
                ))}
            </View>
        </View>
    );

    // ─── Render Categories Tab Content ───
    const renderCategoriesTab = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Danh mục của Shop</Text>
                {!isPreviewMode && (
                    <TouchableOpacity 
                        style={styles.manageSmallBtn}
                        onPress={() => navigation.navigate('SellerCategories')}
                    >
                        <Ionicons name="folder-outline" size={14} color={colors.primary} />
                        <Text style={styles.manageSmallBtnText}>Quản lý</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.catList}>
                {['Điện thoại', 'Laptop', 'Thời trang', 'Đồ gia dụng'].map((cat, idx) => (
                    <TouchableOpacity key={idx} style={styles.catRow}>
                        <View style={styles.catIconCircle}>
                            <Ionicons name="layers-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.catName}>{cat}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // ─── Render Seller Dashboard View (Unified) ───
    const renderSellerView = () => (
        <View>
            {/* 1. Seller Stats Overview */}
            <View style={styles.overviewSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                    <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('SellerOrders')}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{stats.newOrders}</Text>
                        <Text style={styles.statLabel}>Đơn mới</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('SellerReview')}>
                        <Text style={[styles.statValue, { color: colors.secondary }]}>{stats.pendingReviews}</Text>
                        <Text style={styles.statLabel}>Đánh giá</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: colors.success }]}>{stats.totalRevenue}</Text>
                        <Text style={styles.statLabel}>Doanh thu</Text>
                    </View>
                </ScrollView>
            </View>

            {/* 2. Categories Horizontal Bar */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>DANH MỤC</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity 
                            style={styles.manageSmallBtn}
                            onPress={() => navigation.navigate('SellerAddCategory')}
                        >
                            <Ionicons name="add" size={14} color={colors.primary} />
                            <Text style={styles.manageSmallBtnText}>Thêm mới</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.manageSmallBtn, { marginLeft: 8 }]}
                            onPress={() => navigation.navigate('SellerCategories')}
                        >
                            <Ionicons name="settings-outline" size={14} color={colors.primary} />
                            <Text style={styles.manageSmallBtnText}>Quản lý</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {sellerCategories.map((cat) => (
                        <TouchableOpacity 
                            key={cat.id} 
                            style={styles.sellerCatItem}
                            onPress={() => navigation.navigate('SellerEditCategory', { category: cat })}
                        >
                            <View style={styles.sellerCatIconWrap}>
                                <Ionicons name={cat.icon as any} size={24} color={colors.primary} />
                            </View>
                            <Text style={styles.sellerCatName} numberOfLines={2}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* 3. Flash Sale Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.flashTitleRow}>
                        <Ionicons name="flash" size={20} color="#ee4d2d" />
                        <Text style={styles.flashTitle}>FLASH SALE</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.manageSmallBtn}
                        onPress={() => navigation.navigate('SellerFlashSale')}
                    >
                        <Ionicons name="settings-outline" size={14} color={colors.primary} />
                        <Text style={styles.manageSmallBtnText}>Quản lý</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {products.slice(0, 5).map((item, idx) => (
                        <View key={item.id} style={styles.flashCard}>
                            <Image source={{ uri: resolveProductImage(item) ?? undefined }} style={styles.flashImg} />
                            <Text style={styles.flashPrice}>₫{item.price.toLocaleString('vi-VN')}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* 4. Products Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>SẢN PHẨM</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity 
                            style={styles.manageSmallBtn}
                            onPress={() => navigation.navigate('SellerAddProduct')}
                        >
                            <Ionicons name="add" size={14} color={colors.primary} />
                            <Text style={styles.manageSmallBtnText}>Thêm mới</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.manageSmallBtn, { marginLeft: 8 }]}
                            onPress={() => navigation.navigate('SellerProducts')}
                        >
                            <Ionicons name="settings-outline" size={14} color={colors.primary} />
                            <Text style={styles.manageSmallBtnText}>Quản lý</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.productGrid}>
                    {products.map(item => (
                        <ProductCard key={item.id} item={item} />
                    ))}
                </View>
            </View>

            {/* 5. Additional Tools */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Công cụ quản lý khác</Text>
                </View>
                <View style={styles.toolsRow}>
                    <TouchableOpacity style={styles.toolItem}>
                        <View style={[styles.toolIconWrap, { backgroundColor: colors.success + '15' }]}>
                            <Ionicons name="pie-chart-outline" size={24} color={colors.success} />
                        </View>
                        <Text style={styles.toolLabel}>Tài chính</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolItem}>
                        <View style={[styles.toolIconWrap, { backgroundColor: colors.secondary + '15' }]}>
                            <Ionicons name="megaphone-outline" size={24} color={colors.secondary} />
                        </View>
                        <Text style={styles.toolLabel}>Marketing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolItem}>
                        <View style={[styles.toolIconWrap, { backgroundColor: '#8B5CF6' + '15' }]}>
                            <Ionicons name="analytics-outline" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={styles.toolLabel}>Phân tích</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[1]}
            >
                {/* ═══ Header Group (Index 0) ═══ */}
                <View style={styles.bannerArea}>
                    <Image source={{ uri: shopData.banner }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                    <View style={styles.bannerOverlay} />

                    {/* Floating Nav */}
                    <View style={[styles.floatNav, { paddingTop: insets.top + 10, paddingBottom: 10 }]}>
                        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.floatNavRight}>
                            <TouchableOpacity style={styles.circleBtn}>
                                <Ionicons name="search" size={22} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.circleBtn, { marginLeft: 10 }]}
                                onPress={() => setIsPreviewMode(!isPreviewMode)}
                            >
                                <Ionicons name={isPreviewMode ? "eye-off-outline" : "eye-outline"} size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Shop Info Card */}
                    <View style={styles.shopInfoCard}>
                        <View style={styles.shopInfoMain}>
                            <View style={styles.logoWrap}>
                                <Image source={{ uri: shopData.logo }} style={styles.shopLogo} />
                                {!isPreviewMode && (
                                    <TouchableOpacity 
                                        style={styles.editShopBadge}
                                        onPress={() => navigation.navigate('SellerShopInfo')}
                                    >
                                        <Ionicons name="camera" size={12} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.shopMeta}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.shopName}>{shopData.name}</Text>
                                    <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                                </View>
                                <View style={styles.statLine}>
                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                    <Text style={styles.statText}> {shopData.rating}</Text>
                                    <Text style={styles.statText}>  |  </Text>
                                    <Text style={styles.statText}>{shopData.followerCount} Theo dõi</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.shopActions}>
                            {isPreviewMode ? (
                                <>
                                    <TouchableOpacity style={styles.followBtn}>
                                        <Ionicons name="add" size={14} color="#fff" />
                                        <Text style={styles.followText}>Theo dõi</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.chatBtn}>
                                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff" />
                                        <Text style={styles.chatText}>Chat</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.decorateBtn}
                                    onPress={() => navigation.navigate('SellerShopInfo')}
                                >
                                    <Ionicons name="brush-outline" size={16} color="#fff" />
                                    <Text style={styles.decorateBtnText}>Trang trí</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* ═══ Sticky Tab Bar (Only in Preview Mode) ═══ */}
                {isPreviewMode && (
                    <View style={styles.tabBarContainer}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tabBarScrollContent}
                        >
                            {TABS.map(tab => (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
                                    onPress={() => setActiveTab(tab.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ═══ Content Area ═══ */}
                <View style={styles.content}>
                    {isPreviewMode ? (
                        <>
                            {activeTab === 'shop' && renderShopTab()}
                            {activeTab === 'products' && renderProductsTab()}
                            {activeTab === 'categories' && renderCategoriesTab()}
                        </>
                    ) : (
                        renderSellerView()
                    )}
                </View>

                {/* Exit Preview Toggle (Floating at bottom when in preview) */}
                {isPreviewMode && (
                    <TouchableOpacity 
                        style={[styles.exitPreviewBtn, { bottom: insets.bottom + 20 }]}
                        onPress={() => setIsPreviewMode(false)}
                    >
                        <Ionicons name="close-circle" size={20} color="#fff" />
                        <Text style={styles.exitPreviewText}>Thoát xem trước</Text>
                    </TouchableOpacity>
                )}
                
                <View style={{ height: 100 }} />
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    
    // Header
    bannerArea: { position: 'relative', overflow: 'hidden', minHeight: 220 },
    bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    floatNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 },
    floatNavRight: { flexDirection: 'row' },
    circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },

    shopInfoCard: {
        marginHorizontal: 16, marginTop: 20, marginBottom: 20,
        backgroundColor: 'transparent', paddingVertical: 12,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    shopInfoMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    logoWrap: { position: 'relative' },
    shopLogo: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#fff' },
    editShopBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
    shopMeta: { marginLeft: 12 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    shopName: { fontSize: 16, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
    statLine: { flexDirection: 'row', alignItems: 'center' },
    statText: { fontSize: 12, color: '#f0f0f0', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },

    shopActions: { alignItems: 'flex-end', gap: 8 },
    followBtn: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, gap: 4 },
    followText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    chatBtn: { borderWidth: 1, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, gap: 4 },
    chatText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    decorateBtn: { backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4, borderWidth: 1, borderColor: '#fff' },
    decorateBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    // Tabs (Scrollable Style)
    tabBarContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.borderLight, elevation: 3 },
    tabBarScrollContent: { paddingHorizontal: 16 },
    tabItem: { paddingVertical: 14, paddingHorizontal: 16, marginRight: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: colors.primary },
    tabLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    tabLabelActive: { color: colors.primary, fontWeight: '700' },

    // Sections
    content: { paddingBottom: 20 },
    overviewSection: { backgroundColor: '#fff', marginTop: 10, paddingVertical: 16 },
    section: { backgroundColor: '#fff', marginTop: 10, paddingVertical: 14 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    seeAllText: { fontSize: 12, color: colors.textSecondary },

    statsScroll: { paddingHorizontal: 16, alignItems: 'center' },
    statBox: { minWidth: 100, alignItems: 'center', justifyContent: 'center' },
    statDivider: { width: 1, height: 40, backgroundColor: colors.borderLight, marginHorizontal: 12 },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontWeight: '500' },

    manageSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.primary },
    manageSmallBtnText: { color: colors.primary, fontSize: 11, fontWeight: '700' },

    headerActions: { flexDirection: 'row', alignItems: 'center' },

    // Seller Categories
    sellerCatItem: { width: 70, alignItems: 'center', marginRight: 15 },
    sellerCatIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: colors.primary + '20' },
    sellerCatName: { fontSize: 12, color: colors.text, textAlign: 'center', fontWeight: '500' },

    // Horizontal Scroll
    horizontalScroll: { paddingHorizontal: 16, paddingBottom: 4 },
    flashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    flashTitle: { fontSize: 16, fontWeight: '900', color: '#ee4d2d', fontStyle: 'italic' },
    flashCard: { width: 100 },
    flashImg: { width: 100, height: 100, borderRadius: 6, backgroundColor: colors.background, marginBottom: 4 },
    flashPrice: { fontSize: 13, fontWeight: '700', color: '#ee4d2d', textAlign: 'center' },

    bestCard: { width: 130, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden' },
    bestImg: { width: 130, height: 130 },
    bestName: { fontSize: 12, color: colors.text, padding: 6, height: 36 },
    bestPrice: { fontSize: 13, fontWeight: '700', color: colors.primary, paddingHorizontal: 6, paddingBottom: 6 },

    // Grid
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 6 },

    // Categories
    catList: { paddingHorizontal: 16 },
    catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    catIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    catName: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },

    // Tools
    toolsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 20, gap: 15 },
    toolItem: { flex: 1, alignItems: 'center', gap: 8 },
    toolIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    toolLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

    // Exit Button
    exitPreviewBtn: { position: 'absolute', alignSelf: 'center', backgroundColor: colors.danger, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, gap: 8, ...shadow.lg },
    exitPreviewText: { color: '#fff', fontSize: 14, fontWeight: '700' }
});
