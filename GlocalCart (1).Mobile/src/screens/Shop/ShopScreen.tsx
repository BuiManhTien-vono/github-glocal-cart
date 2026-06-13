import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Loading } from '../../components/common/Loading';
import { ProductCard } from '../../components/shop/ProductCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/apiClient';
import { useFollowShopStore } from '../../store/useFollowShopStore';
import { borderRadius, colors, shadow, spacing } from '../../theme/colors';
import { resolveProductImage } from '../../utils/imageUtils';
import { showLoginRequired } from '../../utils/loginRequired';
import { getFlashSalePricing } from '../../utils/flashSalePricing';

const COVER_HEIGHT = 208;

const DEFAULT_SHOP = {
  name: 'Glocal Cart Official Store',
  logo: 'https://ui-avatars.com/api/?name=GC&background=FF6B35&color=fff&size=80&bold=true',
  banner: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop',
  rating: 4.8,
  followers: 12500,
};

export default function ShopScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { shopId, shopName: routeShopName } = route.params || {};
  const { isLoggedIn, setGuestMode } = useAuth();
  const { isFollowing, toggleFollow, loadFollowedShops } = useFollowShopStore();

  const currentShopId = Number(shopId || 0);
  const [activeTab, setActiveTab] = useState<'shop' | 'products'>('shop');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followCount, setFollowCount] = useState(DEFAULT_SHOP.followers);
  const [showTopButton, setShowTopButton] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const topButtonOpacity = useRef(new Animated.Value(0)).current;

  const firstProduct = products[0];
  const targetShopId = currentShopId || Number(firstProduct?.sellerId || 0);
  const currentShopName = routeShopName || firstProduct?.sellerName || DEFAULT_SHOP.name;
  const shopFollowed = targetShopId > 0 ? isFollowing(targetShopId) : false;

  const headerHeight = insets.top + 46;
  const compactTrigger = COVER_HEIGHT - headerHeight - 6;

  const tabs = useMemo(
    () => [
      { key: 'shop' as const, label: 'Shop' },
      { key: 'products' as const, label: 'San pham' },
    ],
    []
  );

  const headerWhiteOpacity = scrollY.interpolate({
    inputRange: [0, 1, 88],
    outputRange: [0, 0.18, 1],
    extrapolate: 'clamp',
  });

  const compactOpacity = scrollY.interpolate({
    inputRange: [compactTrigger - 24, compactTrigger],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const topIconColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['#FFFFFF', colors.primary],
    extrapolate: 'clamp',
  });

  const fetchProducts = useCallback(async () => {
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
  }, [currentShopId]);

  useEffect(() => {
    fetchProducts();
    if (isLoggedIn) loadFollowedShops();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fetchProducts, fadeAnim, isLoggedIn, loadFollowedShops]);

  useEffect(() => {
    Animated.timing(topButtonOpacity, {
      toValue: showTopButton ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showTopButton, topButtonOpacity]);

  useEffect(() => {
    const requestedTab = route.params?.activeTab;
    if (requestedTab === 'shop' || requestedTab === 'products') {
      setActiveTab(requestedTab);
    } else if (requestedTab === 'categories') {
      setActiveTab('shop');
    }
  }, [route.params?.activeTab]);

  const requireLogin = (message: string) => {
    if (isLoggedIn) return false;
    showLoginRequired(() => setGuestMode(false), message);
    return true;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleFollow = async () => {
    if (requireLogin('Bạn cần đăng nhập để theo dõi shop.')) return;
    if (!targetShopId) {
      Alert.alert('Khong the theo doi', 'Shop nay chua co thong tin nguoi ban.');
      return;
    }

    const wasFollowing = shopFollowed;
    setFollowCount(prev => Math.max(0, wasFollowing ? prev - 1 : prev + 1));

    try {
      await toggleFollow({
        id: targetShopId,
        name: currentShopName,
        logoUrl: DEFAULT_SHOP.logo,
      });
    } catch (error: any) {
      setFollowCount(prev => Math.max(0, wasFollowing ? prev + 1 : prev - 1));
      Alert.alert('Loi', error?.message || 'Khong the cap nhat theo doi shop.');
    }
  };

  const handleChat = () => {
    if (requireLogin('Bạn cần đăng nhập để nhắn tin với người bán.')) return;
    if (!targetShopId) {
      Alert.alert('Khong the mo chat', 'Shop nay chua co thong tin nguoi ban.');
      return;
    }

    navigation.navigate('ChatDetail', {
      shopId: targetShopId,
      shopName: currentShopName,
      peerId: targetShopId,
      peerName: currentShopName,
    });
  };

  const openProduct = (productId: number, product?: any) => {
    navigation.navigate('ProductDetail', { productId, product });
  };

  const flashSaleProducts = products.filter(item => getFlashSalePricing(item).hasDiscount).slice(0, 6);
  const bestSellers = products.slice(0, 8);
  const recommendedProducts = products.slice(0, 10);

  const renderFloatingHeader = () => (
    <Animated.View pointerEvents="box-none" style={[styles.floatingHeader, { height: headerHeight }]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.white, opacity: headerWhiteOpacity }]} />
      <View style={[styles.headerRow, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Animated.View style={[styles.previewTabsInHeader, { opacity: compactOpacity }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewTabsHeaderScroll}>
            {tabs.map(tab => (
              <TouchableOpacity key={tab.key} style={styles.headerTab} onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.headerTabText, activeTab === tab.key && styles.headerTabTextActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Search')}>
            <Animated.Text style={{ color: topIconColor }}>
              <Ionicons name="search" size={22} />
            </Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Cart')}>
            <Animated.Text style={{ color: topIconColor }}>
              <Ionicons name="cart-outline" size={22} />
            </Animated.Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderCover = () => (
    <View style={[styles.cover, { paddingTop: insets.top + 54 }]}>
      <Image source={{ uri: DEFAULT_SHOP.banner }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <View style={styles.coverOverlay} />
      <View style={styles.shopInfoLine}>
        <Image source={{ uri: DEFAULT_SHOP.logo }} style={styles.shopLogo} contentFit="cover" />
        <View style={styles.shopMeta}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ShopDetail', { shopId: targetShopId, shopName: currentShopName })}
            activeOpacity={0.8}
            style={styles.shopNameLink}
          >
            <View style={styles.shopNameRow}>
              <Text style={styles.shopName} numberOfLines={1}>{currentShopName}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.shopStatRow}>
            <Ionicons name="star" size={12} color="#FACC15" />
            <Text style={styles.shopStatText}>{DEFAULT_SHOP.rating}</Text>
            <Text style={styles.shopStatText}>|</Text>
            <Text style={styles.shopStatText}>{followCount >= 1000 ? `${(followCount / 1000).toFixed(1)}k` : followCount} theo doi</Text>
          </View>
        </View>
        <View style={styles.shopActions}>
          <TouchableOpacity style={[styles.followBtn, shopFollowed && styles.followBtnActive]} onPress={handleFollow}>
            <Ionicons name={shopFollowed ? 'checkmark' : 'add'} size={15} color={colors.white} />
            <Text style={styles.followBtnText}>{shopFollowed ? 'Dang theo doi' : 'Theo doi'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.white} />
            <Text style={styles.chatBtnText}>Nhan tin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPreviewTabs = () => (
    <View style={styles.overlapWrap}>
      <View style={styles.previewTabPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewTabScroll}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.previewTabItem, activeTab === tab.key && styles.previewTabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.previewTabText, activeTab === tab.key && styles.previewTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderShopTab = () => (
    <View>
      {flashSaleProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="flash" size={20} color="#ee4d2d" />
              <Text style={styles.flashTitle}>FLASH SALE</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {flashSaleProducts.map((item) => {
              const pricing = getFlashSalePricing(item);
              const mainImage = resolveProductImage(item) || 'https://via.placeholder.com/120';

              return (
                <TouchableOpacity key={item.id} style={styles.flashCard} onPress={() => openProduct(item.id, item)}>
                  <View style={styles.flashImgWrap}>
                    <Image source={{ uri: mainImage }} style={styles.flashImg} contentFit="cover" />
                    <View style={styles.discountBadge}><Text style={styles.discountText}>-{pricing.discountPercent}%</Text></View>
                  </View>
                  <Text style={styles.flashPrice}>đ{pricing.salePrice.toLocaleString('vi-VN')}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {bestSellers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="trophy" size={18} color={colors.warning} />
              <Text style={styles.sectionTitle}>Ban chay nhat</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveTab('products')}>
              <Text style={styles.seeAllText}>Xem tat ca</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {bestSellers.map((item, idx) => {
              const mainImage = resolveProductImage(item) || 'https://via.placeholder.com/150';
              return (
                <TouchableOpacity key={item.id} style={styles.bestCard} onPress={() => openProduct(item.id)}>
                  <View style={styles.bestRank}><Text style={styles.bestRankText}>#{idx + 1}</Text></View>
                  <Image source={{ uri: mainImage }} style={styles.bestImg} contentFit="cover" />
                  <Text style={styles.bestName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.bestPrice}>d{Number(item.price || 0).toLocaleString('vi-VN')}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {recommendedProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Goi y cho ban</Text>
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

  const renderProductsTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tat ca san pham ({products.length})</Text>
      </View>
      {products.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Chua co san pham nao</Text>
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

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <Loading message="Dang tai cua hang..." />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} progressViewOffset={headerHeight} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: (event: any) => {
              const shouldShow = event.nativeEvent.contentOffset.y > 320;
              setShowTopButton(prev => (prev === shouldShow ? prev : shouldShow));
            },
          }
        )}
      >
        {renderCover()}
        <View style={styles.content}>
          {renderPreviewTabs()}
          {activeTab === 'shop' ? renderShopTab() : renderProductsTab()}
        </View>
      </Animated.ScrollView>
      {renderFloatingHeader()}
      <Animated.View
        pointerEvents={showTopButton ? 'auto' : 'none'}
        style={[styles.topButtonWrap, { bottom: Math.max(insets.bottom, 12) + 18, opacity: topButtonOpacity }]}
      >
        <TouchableOpacity style={styles.topButton} onPress={scrollToTop} activeOpacity={0.85}>
          <Ionicons name="arrow-up" size={22} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  content: { backgroundColor: colors.background },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerRow: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTabsInHeader: {
    flex: 1,
    minWidth: 0,
    height: 34,
    justifyContent: 'center',
  },
  previewTabsHeaderScroll: { alignItems: 'center' },
  headerTab: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  headerTabText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  headerTabTextActive: { color: colors.primary },
  cover: {
    height: COVER_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  shopInfoLine: {
    marginTop: 6,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
  },
  shopLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.white,
    marginRight: 10,
  },
  shopMeta: { flex: 1, justifyContent: 'center' },
  shopNameLink: { alignSelf: 'flex-start', maxWidth: '100%' },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 5 },
  shopName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 3,
  },
  shopStatRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shopStatText: { fontSize: 12, fontWeight: '600', color: colors.white },
  shopActions: { width: 96, gap: 7 },
  followBtn: {
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  followBtnActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  followBtnText: { fontSize: 12, fontWeight: '800', color: colors.white },
  chatBtn: {
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  chatBtnText: { fontSize: 12, fontWeight: '800', color: colors.white },
  overlapWrap: { marginTop: -20, zIndex: 4 },
  previewTabPanel: {
    minHeight: 44,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: colors.white,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.md,
  },
  previewTabScroll: { alignItems: 'center', paddingHorizontal: 6 },
  previewTabItem: {
    height: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  previewTabItemActive: { borderBottomColor: colors.primary },
  previewTabText: { fontSize: 13, fontWeight: '700', color: colors.text },
  previewTabTextActive: { color: colors.primary },
  section: { backgroundColor: colors.white, marginTop: 8, paddingVertical: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  seeAllText: { fontSize: 12, color: colors.textSecondary },
  horizontalList: { paddingHorizontal: 12, gap: 10 },
  flashTitle: { fontSize: 16, fontWeight: '800', color: '#ee4d2d', fontStyle: 'italic' },
  flashCard: { width: 110, alignItems: 'center' },
  flashImgWrap: {
    width: 110,
    height: 110,
    backgroundColor: '#f5f5f5',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
  },
  flashImg: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255,212,36,0.92)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  discountText: { fontSize: 10, color: '#ee4d2d', fontWeight: '700' },
  flashPrice: { fontSize: 14, fontWeight: '700', color: '#ee4d2d', marginBottom: 4 },
  bestCard: {
    width: 130,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    position: 'relative',
  },
  bestRank: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
    zIndex: 2,
  },
  bestRankText: { fontSize: 11, fontWeight: '800', color: colors.white },
  bestImg: { width: '100%', height: 120 },
  bestName: { fontSize: 12, color: colors.text, paddingHorizontal: 6, paddingTop: 6, height: 36 },
  bestPrice: { fontSize: 14, fontWeight: '700', color: colors.primary, padding: 6 },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  emptyWrap: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  topButtonWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 40,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
});
