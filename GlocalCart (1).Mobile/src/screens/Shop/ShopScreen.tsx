import { Image } from 'expo-image';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Animated, Dimensions, RefreshControl, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { Loading } from '../../components/common/Loading';
import { ProductCard } from '../../components/shop/ProductCard';
import { resolveProductImage } from '../../utils/imageUtils';
import { useAuth } from '../../context/AuthContext';
import { useFollowShopStore } from '../../store/useFollowShopStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 180;

// ─── Mock Shop Data ───
const MOCK_SHOP = {
  id: 1,
  name: 'Glocal Cart Official Store',
  logo: 'https://ui-avatars.com/api/?name=GC&background=FF6B35&color=fff&size=80&bold=true',
  banner: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop',
  rating: 4.8,
  followers: 12500,
  // responseRate: '98%',
  // responseTime: 'trong vài phút',
  // joined: '2 năm trước',
  // productsCount: 256,
  isFollowing: false,
  // description: 'Chuyên cung cấp các sản phẩm công nghệ, thời trang, gia dụng chính hãng với giá tốt nhất.'
};

const MOCK_SHOP_CATEGORIES = [
  { id: 'sc1', name: 'Điện thoại & Phụ kiện', productCount: 45, icon: 'phone-portrait-outline' },
  { id: 'sc2', name: 'Laptop & Máy tính', productCount: 32, icon: 'laptop-outline' },
  { id: 'sc3', name: 'Thời trang Nam', productCount: 68, icon: 'shirt-outline' },
  { id: 'sc4', name: 'Thời trang Nữ', productCount: 54, icon: 'woman-outline' },
  { id: 'sc5', name: 'Đồ gia dụng', productCount: 27, icon: 'home-outline' },
  { id: 'sc6', name: 'Sách & Văn phòng phẩm', productCount: 19, icon: 'book-outline' },
  { id: 'sc7', name: 'Mỹ phẩm', productCount: 11, icon: 'color-palette-outline' },
];

export default function ShopScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { shopId } = route.params || {};
  const { isLoggedIn, setGuestMode } = useAuth();
  const { isFollowing, toggleFollow, loadFollowedShops } = useFollowShopStore();
  const currentShopId = Number(shopId || 0);

  // ─── State ───
  const [activeTab, setActiveTab] = useState<'shop' | 'products' | 'categories'>('shop');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followCount, setFollowCount] = useState(MOCK_SHOP.followers);
  const shopFollowed = isFollowing(currentShopId);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchProducts = async () => {
    try {
      const url = currentShopId > 0 ? `/products?sellerId=${currentShopId}&pageSize=100` : '/products?pageSize=100';
      const res = await apiClient.get(url) as any;
      setProducts(res?.items || (Array.isArray(res) ? res : []));
    } catch (error) {
      console.warn('ShopScreen fetch error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (isLoggedIn) loadFollowedShops();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [isLoggedIn]);

  useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params?.activeTab]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const handleFollow = async () => {
    if (!isLoggedIn) {
      Alert.alert('Yeu cau dang nhap', 'Ban can dang nhap de theo doi shop.', [
        { text: 'De sau', style: 'cancel' },
        { text: 'Dang nhap', onPress: () => setGuestMode(false) },
      ]);
      return;
    }

    const wasFollowing = shopFollowed;
    setFollowCount(prev => Math.max(0, wasFollowing ? prev - 1 : prev + 1));
    try {
      await toggleFollow({
        id: currentShopId,
        name: MOCK_SHOP.name,
        logoUrl: MOCK_SHOP.logo,
      });
    } catch (error: any) {
      setFollowCount(prev => Math.max(0, wasFollowing ? prev + 1 : prev - 1));
      Alert.alert('Loi', error?.message || 'Khong the cap nhat theo doi shop.');
    }
  };

  const handleChat = () => {
    if (!isLoggedIn) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để chat với shop.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => setGuestMode(false) },
      ]);
      return;
    }

    const targetShopId = currentShopId || Number(products[0]?.sellerId || 0);
    const targetShopName = products[0]?.sellerName || MOCK_SHOP.name;

    if (!targetShopId) {
      Alert.alert('Không thể mở chat', 'Shop này chưa có thông tin người bán.');
      return;
    }

    navigation.navigate('ChatDetail', { shopId: targetShopId, shopName: targetShopName });
  };

  // ─── Mock derived data ───
  const flashSaleProducts = products.slice(0, 6);
  const bestSellers = products.slice(0, 8);
  const recommendedProducts = products.slice(0, 10);

  // ─── Tab definitions ───
  const tabs = [
    { key: 'shop' as const, label: 'Shop' },
    { key: 'products' as const, label: 'Sản phẩm' },
    { key: 'categories' as const, label: 'Danh mục' },
  ];

  // ─── Render Shop Tab ───
  const renderShopTab = () => (
    <View>
      {/* Flash Sale Section */}
      {flashSaleProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.flashTitleRow}>
              <Ionicons name="flash" size={20} color="#ee4d2d" />
              <Text style={styles.flashTitle}>FLASH SALE</Text>
              <View style={styles.timerRow}>
                <Text style={styles.timerBox}>02</Text>
                <Text style={styles.timerSep}>:</Text>
                <Text style={styles.timerBox}>45</Text>
                <Text style={styles.timerSep}>:</Text>
                <Text style={styles.timerBox}>30</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả ›</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}>
            {flashSaleProducts.map((item, idx) => {
              const discount = 15 + idx * 5;
              const salePrice = item.price * (1 - discount / 100);
              const mainImage = resolveProductImage(item) || 'https://via.placeholder.com/120';
              const soldPct = 30 + idx * 12;
              return (
                <TouchableOpacity key={item.id} style={styles.flashCard} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
                  <View style={styles.flashImgWrap}>
                    <Image source={{ uri: mainImage }} style={styles.flashImg} />
                    <View style={styles.discountBadge}><Text style={styles.discountText}>-{discount}%</Text></View>
                  </View>
                  <Text style={styles.flashPrice}>₫{salePrice.toLocaleString('vi-VN')}</Text>
                  <View style={styles.soldBar}>
                    <View style={[styles.soldFill, { width: `${Math.min(soldPct, 100)}%` }]} />
                    <Text style={styles.soldText}>Đã bán {soldPct}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trophy" size={18} color={colors.warning} />
              <Text style={styles.sectionTitle}>Bán chạy nhất</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveTab('products')}>
              <Text style={styles.seeAllText}>Xem tất cả ›</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}>
            {bestSellers.map((item, idx) => {
              const mainImage = resolveProductImage(item) || 'https://via.placeholder.com/150';
              return (
                <TouchableOpacity key={item.id} style={styles.bestCard} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
                  <View style={styles.bestRank}>
                    <Text style={styles.bestRankText}>#{idx + 1}</Text>
                  </View>
                  <Image source={{ uri: mainImage }} style={styles.bestImg} />
                  <Text style={styles.bestName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.bestPrice}>₫{item.price.toLocaleString('vi-VN')}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Gợi ý cho bạn */}
      {recommendedProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
            </View>
          </View>
          <View style={styles.productGrid}>
            {recommendedProducts.map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
          </View>
        </View>
      )}
    </View>
  );

  // ─── Render Products Tab ───
  const renderProductsTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tất cả sản phẩm ({products.length})</Text>
      </View>
      {products.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
        </View>
      ) : (
        <View style={styles.productGrid}>
          {products.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </View>
  );

  // ─── Render Categories Tab ───
  const renderCategoriesTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Danh mục của Shop</Text>
      </View>
      {MOCK_SHOP_CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat.id}
          style={styles.catRow}
          onPress={() => navigation.navigate('Category', { categoryId: cat.id, categoryName: cat.name })}
        >
          <View style={styles.catIconCircle}>
            <Ionicons name={cat.icon as any} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.catRowName}>{cat.name}</Text>
            <Text style={styles.catRowCount}>{cat.productCount} sản phẩm</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <Loading message="Đang tải cửa hàng..." />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* ═══ BANNER + SHOP INFO AREA (~20% top) ═══ */}
        <View style={styles.bannerArea}>
          {/* Background banner image */}
          <Image source={{ uri: MOCK_SHOP.banner }} style={styles.bannerImage} />
          <View style={styles.bannerOverlay} />

          {/* Floating header */}
          <View style={[styles.floatHeader, { paddingTop: insets.top + 4 }]}>
            <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.floatHeaderRight}>
              <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="cart-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.floatBtn}>
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Shop Info Card (overlapping the banner bottom) */}
          <View style={styles.shopInfoCard}>
            <View style={styles.shopInfoRight}>
              <Image source={{ uri: MOCK_SHOP.logo }} style={styles.shopLogo} />
              <View style={styles.shopMeta}>
                <TouchableOpacity onPress={() => navigation.navigate('ShopDetail', { shopId: currentShopId, shopName: MOCK_SHOP.name })}>
                  <View style={styles.shopNameRow}>
                    <Text style={styles.shopName}>{MOCK_SHOP.name}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.text} />
                  </View>
                </TouchableOpacity>
                <View style={styles.shopStatRow}>
                  <Ionicons name="star" size={13} color="#FFD700" />
                  <Text style={styles.shopStatText}>{MOCK_SHOP.rating}</Text>
                  <Text style={styles.shopStatDivider}>|</Text>
                  <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.shopStatText}>{followCount >= 1000 ? `${(followCount / 1000).toFixed(1)}k` : followCount} Theo dõi</Text>
                </View>
              </View>
            </View>
            <View style={styles.shopActions}>
              <TouchableOpacity style={[styles.followBtn, shopFollowed && styles.followBtnActive]} onPress={handleFollow}>
                <Ionicons name={shopFollowed ? 'checkmark' : 'add'} size={14} color={shopFollowed ? colors.primary : '#fff'} />
                <Text style={[styles.followBtnText, shopFollowed && styles.followBtnTextActive]}>
                  {shopFollowed ? 'Đang theo dõi' : 'Theo dõi'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
                <Text style={styles.chatBtnText}>Nhắn tin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ═══ TABS BAR (sticky) ═══ */}
        <View style={styles.tabBarContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ═══ TAB CONTENT ═══ */}
        <View style={styles.tabContent}>
          {activeTab === 'shop' && renderShopTab()}
          {activeTab === 'products' && renderProductsTab()}
          {activeTab === 'categories' && renderCategoriesTab()}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, backgroundColor: colors.background },

  // ─── Banner Area ───
  bannerArea: { position: 'relative' },
  bannerImage: { width: '100%', height: BANNER_HEIGHT + 60, resizeMode: 'cover' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // ─── Floating Header ───
  floatHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, zIndex: 10,
  },
  floatHeaderRight: { flexDirection: 'row', gap: 4 },
  floatBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ─── Shop Info Card ───
  shopInfoCard: {
    position: 'absolute', bottom: -30, left: 12, right: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.md,
  },
  shopActions: { flexDirection: 'column', gap: 6, marginRight: 10, width: 100 },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    borderRadius: 4,
    width: '100%',
  },
  followBtnActive: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary },
  followBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  followBtnTextActive: { color: colors.primary },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.primary,
    paddingVertical: 6,
    borderRadius: 4,
    width: '100%',
  },
  chatBtnText: { fontSize: 11, fontWeight: '500', color: colors.primary },
  shopInfoRight: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  shopLogo: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.primary, marginRight: 8 },
  shopMeta: { flex: 1 },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 },
  shopName: { fontSize: 14, fontWeight: '400', color: colors.text },
  shopStatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopStatText: { fontSize: 12, color: colors.textSecondary },
  shopStatDivider: { color: colors.border, marginHorizontal: 4 },

  // ─── Tabs ───
  tabBarContainer: {
    width: '100%',
    backgroundColor: '#fff',
    marginTop: 36,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
  },
  tabBar: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tabItem: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: colors.primary },
  tabLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  tabLabelActive: { color: colors.primary, fontWeight: '700' },

  // ─── Tab Content ───
  tabContent: { paddingBottom: 20 },

  // ─── Section ───
  section: { backgroundColor: '#fff', marginTop: 8, paddingVertical: 14 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  seeAllText: { fontSize: 12, color: colors.textSecondary },

  // ─── Flash Sale ───
  flashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flashTitle: { fontSize: 16, fontWeight: '800', color: '#ee4d2d', fontStyle: 'italic', marginRight: 6 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timerBox: {
    backgroundColor: '#222', color: '#fff', fontSize: 11, fontWeight: '700',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, overflow: 'hidden',
  },
  timerSep: { fontWeight: '700', color: '#222', fontSize: 12 },
  flashCard: { width: 110, alignItems: 'center' },
  flashImgWrap: { width: 110, height: 110, backgroundColor: '#f5f5f5', borderRadius: 6, overflow: 'hidden', marginBottom: 6, position: 'relative' },
  flashImg: { width: '100%', height: '100%' },
  discountBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(255,212,36,0.92)', paddingHorizontal: 4, paddingVertical: 2 },
  discountText: { fontSize: 10, color: '#ee4d2d', fontWeight: '700' },
  flashPrice: { fontSize: 14, fontWeight: '700', color: '#ee4d2d', marginBottom: 4 },
  soldBar: { width: '90%', height: 14, backgroundColor: '#ffbda6', borderRadius: 7, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  soldFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#ee4d2d' },
  soldText: { fontSize: 9, color: '#fff', fontWeight: '600', zIndex: 1 },

  // ─── Best Sellers ───
  bestCard: { width: 130, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden', position: 'relative' },
  bestRank: { position: 'absolute', top: 0, left: 0, backgroundColor: colors.warning, paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8, zIndex: 2 },
  bestRankText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  bestImg: { width: '100%', height: 120 },
  bestName: { fontSize: 12, color: colors.text, paddingHorizontal: 6, paddingTop: 6, height: 36 },
  bestPrice: { fontSize: 14, fontWeight: '700', color: colors.primary, padding: 6 },

  // ─── Product Grid ───
  productGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4, paddingTop: 4,
  },

  // ─── Categories List ───
  catRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  catIconCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  catRowName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  catRowCount: { fontSize: 12, color: colors.textSecondary },

  // ─── Empty ───
  emptyWrap: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: colors.textSecondary },
});

