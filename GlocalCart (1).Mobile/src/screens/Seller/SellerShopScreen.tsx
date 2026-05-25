import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImage } from '../../utils/imageUtils';
import { getCategoryIcon } from '../../utils/categoryIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 208;
const PRODUCT_GAP = 10;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 32 - PRODUCT_GAP) / 2;

const PREVIEW_TABS = [
  { id: 'shop', label: 'Shop' },
  { id: 'products', label: 'Sản phẩm' },
  { id: 'categories', label: 'Danh mục hàng' },
];

const currency = (value: any) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const shortNumber = (value: number) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
};

const getOrderItems = (order: any) => order?.items || order?.orderItems || [];

export default function SellerShopScreen({ navigation }: any): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const topButtonOpacity = useRef(new Animated.Value(0)).current;

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const [isHeaderAtTop, setIsHeaderAtTop] = useState(true);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const shopData = {
    name: 'Glocal Cart Official Store',
    logo: 'https://ui-avatars.com/api/?name=GC&background=FF6B35&color=fff&size=120&bold=true',
    banner: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=380&fit=crop',
    rating: 4.8,
    followerCount: '15.2k',
  };

  const headerHeight = insets.top + 58;
  const compactTrigger = COVER_HEIGHT - headerHeight - 6;

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

  const topTextColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['#FFFFFF', colors.text],
    extrapolate: 'clamp',
  });
  const topHeaderSearchOpacity = scrollY.interpolate({
    inputRange: [0, 55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const loadData = useCallback(async () => {
    try {
      const [productsRes, ordersRes, categoriesRes]: any[] = await Promise.all([
        apiClient.get('/products/my-products?pageSize=100'),
        apiClient.get('/orders/seller'),
        apiClient.get('/categories'),
      ]);

      const productItems = productsRes?.items || (Array.isArray(productsRes) ? productsRes : []);
      const orderItems = ordersRes?.items || (Array.isArray(ordersRes) ? ordersRes : []);
      const categoryItems = categoriesRes?.items || categoriesRes?.data || (Array.isArray(categoriesRes) ? categoriesRes : []);
      const rootCategories = categoryItems.filter((cat: any) => !cat.parentCategoryId && !cat.parentId);

      setProducts(productItems);
      setOrders(orderItems);
      setCategories((rootCategories.length ? rootCategories : categoryItems).map((cat: any) => ({
        ...cat,
        icon: getCategoryIcon(cat.name, cat.icon),
      })));
    } catch (error) {
      console.warn('SellerShop fetch error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    Animated.timing(topButtonOpacity, {
      toValue: showTopButton ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showTopButton, topButtonOpacity]);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter(product => String(product.name || '').toLowerCase().includes(keyword));
  }, [products, query]);

  const completedOrders = useMemo(
    () => orders.filter(order =>
      order.status === 'Complete' ||
      order.status === 'Delivered' ||
      order.shipment?.status === 'Delivered'
    ),
    [orders]
  );

  const stats = useMemo(() => {
    const revenue = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const soldItems = completedOrders.reduce(
      (sum, order) => sum + getOrderItems(order).reduce((total: number, item: any) => total + Number(item.quantity || 0), 0),
      0
    );

    return {
      newOrders: orders.filter(order => order.status === 'Pending').length,
      activeProducts: products.filter(product => product.isActive !== false && product.isLocked !== true).length,
      outOfStock: products.filter(product => Number(product.availableItemCount ?? product.stock ?? 0) <= 0).length,
      hiddenProducts: products.filter(product => product.isActive === false || product.isLocked === true).length,
      revenue,
      soldItems,
      rating: shopData.rating,
    };
  }, [completedOrders, orders, products, shopData.rating]);

  const flashProducts = filteredProducts.slice(0, 8);
  const bestProducts = [...filteredProducts]
    .sort((a, b) => Number(b.soldCount || b.sales || 0) - Number(a.soldCount || a.sales || 0))
    .slice(0, 8);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        setShowTopButton(y > 320);
        setIsHeaderAtTop(y < 55);
      },
    }
  );

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const reloadSellerHome = () => {
    setActiveTab('shop');
    setQuery('');
    setIsPreviewMode(false);
    scrollToTop();
    setRefreshing(true);
    loadData();
  };

  const goOrders = (activeTab?: string) => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('Orders', activeTab ? { activeTab } : undefined);
      return;
    }
    navigation.navigate('SellerOrders', activeTab ? { activeTab } : undefined);
  };

  const openShopDecoration = () => navigation.navigate('SellerShopInfo');

  const renderCollapsedHeader = () => (
    <Animated.View pointerEvents="box-none" style={[styles.floatingHeader, { height: headerHeight }]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.white, opacity: headerWhiteOpacity }]} />
      <View style={[styles.headerRow, { paddingTop: insets.top }]}>
        <Animated.View
          pointerEvents={isHeaderAtTop ? 'auto' : 'none'}
          style={[
            styles.absoluteTopHeaderSearch,
            { opacity: topHeaderSearchOpacity, left: 10, right: 52, top: insets.top + 10 },
          ]}
        >
          <Ionicons name="search-outline" size={17} color="rgba(255,255,255,0.9)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm sản phẩm trong shop"
            placeholderTextColor="rgba(255,255,255,0.78)"
            style={styles.topHeaderSearchInput}
          />
        </Animated.View>
        {isPreviewMode ? (
          <>
            <TouchableOpacity style={styles.headerIconBtn} onPress={reloadSellerHome}>
              <Animated.Text style={{ color: topTextColor }}>
                <Ionicons name="storefront-outline" size={23} />
              </Animated.Text>
            </TouchableOpacity>
            <Animated.View style={[styles.previewTabsInHeader, { opacity: compactOpacity }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {PREVIEW_TABS.map(tab => (
                  <TouchableOpacity key={tab.id} style={styles.headerTab} onPress={() => setActiveTab(tab.id)}>
                    <Text style={[styles.headerTabText, activeTab === tab.id && styles.headerTabTextActive]} numberOfLines={1}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
            <View style={styles.headerActions}>
              <Animated.View style={{ opacity: compactOpacity }}>
                <TouchableOpacity style={styles.headerIconBtn}>
                  <Ionicons name="search-outline" size={23} color={colors.primary} />
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={{ opacity: compactOpacity }}>
                <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('ChatList')}>
                  <Ionicons name="chatbubble-ellipses-outline" size={23} color={colors.primary} />
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity style={styles.topVisibleIconBtn} onPress={() => setIsPreviewMode(false)}>
                <Animated.Text style={{ color: topTextColor }}>
                  <Ionicons name="eye-off-outline" size={23} />
                </Animated.Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.headerIconBtn} onPress={reloadSellerHome}>
              <Animated.Text style={{ color: topTextColor }}>
                <Ionicons name="storefront-outline" size={23} />
              </Animated.Text>
            </TouchableOpacity>
            <Animated.View style={[styles.collapsedSearchBox, { opacity: compactOpacity }]}>
              <Ionicons name="search-outline" size={17} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Tìm sản phẩm trong shop"
                placeholderTextColor={colors.textMuted}
                style={styles.collapsedSearchInput}
              />
            </Animated.View>
            <View style={styles.headerActions}>
              <Animated.View style={{ opacity: compactOpacity }}>
                <TouchableOpacity style={styles.headerIconBtn} onPress={openShopDecoration}>
                  <Ionicons name="brush-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={{ opacity: compactOpacity }}>
                <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('ChatList')}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity style={styles.topVisibleIconBtn} onPress={() => setIsPreviewMode(true)}>
                <Animated.Text style={{ color: topTextColor }}>
                  <Ionicons name="eye-outline" size={22} />
                </Animated.Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      {!isPreviewMode && (
        <Animated.View style={[styles.compactStatsRow, { top: headerHeight, opacity: compactOpacity }]}>
          <Text style={styles.compactStatText}>Đơn mới <Text style={styles.compactStatValue}>{stats.newOrders}</Text></Text>
          <Text style={styles.compactStatText}>SP <Text style={styles.compactStatValue}>{stats.activeProducts}</Text></Text>
          <Text style={styles.compactStatText}>DT <Text style={styles.compactStatValue}>{shortNumber(stats.revenue)}</Text></Text>
        </Animated.View>
      )}
    </Animated.View>
  );

  const renderSearchBox = () => (
    <View style={styles.coverSearch}>
      <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.9)" />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Tìm kiếm sản phẩm trong Shop"
        placeholderTextColor="rgba(255,255,255,0.78)"
        style={styles.coverSearchInput}
      />
    </View>
  );

  const renderCover = () => (
    <View style={[styles.cover, { paddingTop: insets.top + 54 }]}>
      <Image source={{ uri: shopData.banner }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <View style={styles.coverOverlay} />

      <View style={styles.shopInfoLine}>
        <TouchableOpacity style={styles.logoWrap} onPress={openShopDecoration}>
          <Image source={{ uri: shopData.logo }} style={styles.shopLogo} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shopMeta} onPress={openShopDecoration} activeOpacity={0.8}>
          <Text style={styles.shopName} numberOfLines={1}>{shopData.name}</Text>
          <View style={styles.shopStatsLine}>
            <Ionicons name="star" size={12} color="#FACC15" />
            <Text style={styles.shopStatsText}>{shopData.rating}</Text>
            <Text style={styles.shopStatsText}>|</Text>
            <Text style={styles.shopStatsText}>{shopData.followerCount} người theo dõi</Text>
          </View>
        </TouchableOpacity>

        {isPreviewMode ? (
          <View style={styles.previewShopActions}>
            <TouchableOpacity style={styles.followBtn}>
              <Ionicons name="add" size={15} color={colors.white} />
              <Text style={styles.followText}>Theo dõi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatCoverBtn} onPress={() => navigation.navigate('ChatList')}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.white} />
              <Text style={styles.followText}>Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.chatInlineBtn} onPress={() => navigation.navigate('ChatList')}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.white} />
            <Text style={styles.followText}>Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderManagementStats = () => (
    <View style={styles.overlapWrap}>
      <View style={styles.statsPanel}>
        <TouchableOpacity style={styles.statBox} onPress={() => goOrders('Chờ xác nhận')}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.newOrders}</Text>
          <Text style={styles.statLabel}>Đơn mới</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('SellerProducts')}>
          <Text style={[styles.statValue, { color: colors.secondary }]}>{stats.activeProducts}</Text>
          <Text style={styles.statLabel}>Đang bán</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('SellerProducts')}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{stats.outOfStock}</Text>
          <Text style={styles.statLabel}>Hết hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('SellerRevenue')}>
          <Text style={[styles.statValue, { color: colors.success }]}>{shortNumber(stats.revenue)}</Text>
          <Text style={styles.statLabel}>Doanh thu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPreviewTabs = () => (
    <View style={styles.overlapWrap}>
      <View style={styles.previewTabPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewTabScroll}>
          {PREVIEW_TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.previewTabItem, activeTab === tab.id && styles.previewTabItemActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.previewTabText, activeTab === tab.id && styles.previewTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderCategoryStrip = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Danh mục</Text>
        {!isPreviewMode && (
          <TouchableOpacity style={styles.smallLinkBtn} onPress={() => navigation.navigate('SellerCategories')}>
            <Ionicons name="settings-outline" size={14} color={colors.primary} />
            <Text style={styles.smallLinkText}>Quản lý</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryItem}
            onPress={() => navigation.navigate('SellerCategories', { categoryId: cat.id })}
          >
            <View style={styles.categoryIcon}>
              <Ionicons name={getCategoryIcon(cat.name, cat.icon)} size={24} color={colors.primary} />
            </View>
            <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderProductTile = (item: any, mode: 'manage' | 'preview' = 'preview', layout: 'grid' | 'compact' = 'grid') => {
    const imageUri = resolveProductImage(item) || undefined;
    const stock = Number(item.availableItemCount ?? item.stock ?? 0);
    const hidden = item.isActive === false || item.isLocked === true;

    return (
      <TouchableOpacity
        key={item.id}
        style={layout === 'compact' ? styles.compactProductCard : styles.productTile}
        activeOpacity={0.85}
        onPress={() => mode === 'manage'
          ? navigation.navigate('SellerEditProduct', { productId: item.id, product: item })
          : navigation.navigate('ProductDetail', { productId: item.id, product: item })}
      >
        <Image source={{ uri: imageUri }} style={layout === 'compact' ? styles.compactProductImage : styles.productImage} contentFit="cover" />
        {hidden && <Text style={styles.hiddenBadge}>Ẩn</Text>}
        {layout === 'compact' && <Text style={styles.flashBadge}>SALE</Text>}
        <View style={styles.productBody}>
          <Text style={styles.productName} numberOfLines={2}>{item.name || 'Sản phẩm'}</Text>
          <Text style={styles.productPrice}>{currency(item.price)}</Text>
          {mode === 'manage' ? (
            <View style={styles.manageMetaRow}>
              <Text style={[styles.stockText, stock <= 0 && { color: colors.danger }]}>Kho: {stock}</Text>
              <TouchableOpacity style={styles.editMiniBtn} onPress={() => navigation.navigate('SellerEditProduct', { productId: item.id, product: item })}>
                <Text style={styles.editMiniText}>Sửa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.soldText}>Đã bán {item.soldCount || item.sales || 0}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFlashSale = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.flashTitleRow}>
          <Ionicons name="flash" size={19} color="#EE4D2D" />
          <Text style={styles.flashTitle}>FLASH SALE</Text>
        </View>
        {!isPreviewMode && (
          <TouchableOpacity style={styles.smallLinkBtn} onPress={() => navigation.navigate('SellerFlashSale')}>
            <Ionicons name="settings-outline" size={14} color={colors.primary} />
            <Text style={styles.smallLinkText}>Cài đặt</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalProductScroll}>
        {flashProducts.map(item => renderProductTile(item, 'preview', 'compact'))}
      </ScrollView>
    </View>
  );

  const renderBestSellers = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sản phẩm bán chạy</Text>
        <TouchableOpacity onPress={() => setActiveTab('products')}>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalProductScroll}>
        {bestProducts.map(item => renderProductTile(item, 'preview', 'compact'))}
      </ScrollView>
    </View>
  );

  const renderProductGrid = (mode: 'manage' | 'preview') => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{mode === 'manage' ? `Sản phẩm có quyền quản lý (${filteredProducts.length})` : `Tất cả sản phẩm (${filteredProducts.length})`}</Text>
        {mode === 'manage' && (
          <TouchableOpacity style={styles.smallLinkBtn} onPress={() => navigation.navigate('SellerProducts')}>
            <Ionicons name="albums-outline" size={14} color={colors.primary} />
            <Text style={styles.smallLinkText}>Quản lý</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.productGrid}>
        {filteredProducts.map(item => renderProductTile(item, mode))}
      </View>
    </View>
  );

  const renderTools = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Công cụ quản lý</Text>
      </View>
      <View style={styles.toolsGrid}>
        <ToolButton icon="receipt-outline" label="Đơn hàng" color={colors.primary} onPress={() => goOrders()} />
        <ToolButton icon="cube-outline" label="Sản phẩm" color={colors.secondary} onPress={() => navigation.navigate('SellerProducts')} />
        <ToolButton icon="folder-open-outline" label="Danh mục" color="#8B5CF6" onPress={() => navigation.navigate('SellerCategories')} />
        <ToolButton icon="pie-chart-outline" label="Doanh thu" color={colors.success} onPress={() => navigation.navigate('SellerRevenue')} />
        <ToolButton icon="star-outline" label="Đánh giá" color={colors.warning} onPress={() => navigation.navigate('SellerReview')} />
        <ToolButton icon="brush-outline" label="Trang trí" color="#EC4899" onPress={openShopDecoration} />
      </View>
    </View>
  );

  const renderManagementContent = () => (
    <>
      {renderManagementStats()}
      {renderCategoryStrip()}
      {renderFlashSale()}
      {renderProductGrid('manage')}
      {renderTools()}
    </>
  );

  const renderPreviewContent = () => (
    <>
      {renderPreviewTabs()}
      {activeTab === 'shop' && (
        <>
          {renderFlashSale()}
          {renderBestSellers()}
          {renderCategoryStrip()}
          {renderProductGrid('preview')}
        </>
      )}
      {activeTab === 'products' && renderProductGrid('preview')}
      {activeTab === 'categories' && renderCategoryStrip()}
    </>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải trang quản lý shop...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {renderCollapsedHeader()}

      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} progressViewOffset={headerHeight} />}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCover()}
        <View style={styles.content}>
          {isPreviewMode ? renderPreviewContent() : renderManagementContent()}
        </View>
      </Animated.ScrollView>

      {showTopButton && (
        <Animated.View style={[styles.scrollTopWrap, { opacity: topButtonOpacity, bottom: Math.max(insets.bottom, 12) + 12 }]}>
          <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop}>
            <Ionicons name="arrow-up" size={22} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

function ToolButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.toolButton} onPress={onPress}>
      <View style={[styles.toolIconWrap, { backgroundColor: color + '14' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.toolLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
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
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteTopHeaderSearch: {
    position: 'absolute',
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 4,
  },
  topHeaderSearchInput: {
    flex: 1,
    height: 38,
    marginLeft: 7,
    color: colors.white,
    fontSize: 13,
    paddingVertical: 0,
  },
  topVisibleIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.26)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsedSearchBox: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  collapsedSearchInput: {
    flex: 1,
    height: 36,
    marginLeft: 6,
    color: colors.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  previewTabsInHeader: {
    flex: 1,
    minWidth: 0,
  },
  headerTab: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  headerTabText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  headerTabTextActive: {
    color: colors.primary,
  },
  compactStatsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: 30,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  compactStatText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  compactStatValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  cover: {
    height: COVER_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  coverTopSearch: {
    paddingHorizontal: spacing.md,
  },
  coverSearch: {
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.26)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  coverSearchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    color: colors.white,
    fontSize: 14,
    paddingVertical: 0,
  },
  shopInfoLine: {
    marginTop: 6,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
  },
  logoWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  shopLogo: {
    width: '100%',
    height: '100%',
  },
  shopMeta: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  shopName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 3,
  },
  shopStatsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  shopStatsText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  previewShopActions: {
    width: 92,
    gap: 7,
  },
  followBtn: {
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  chatCoverBtn: {
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  chatInlineBtn: {
    width: 92,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  followText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    backgroundColor: colors.background,
  },
  overlapWrap: {
    marginTop: 6,
    paddingHorizontal: spacing.md,
    marginBottom: 8,
    zIndex: 4,
  },
  statsPanel: {
    minHeight: 64,
    borderRadius: 10,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 9,
    ...shadow.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  previewTabPanel: {
    minHeight: 58,
    borderRadius: 10,
    backgroundColor: colors.white,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.md,
  },
  previewTabScroll: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  previewTabItem: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  previewTabItemActive: {
    borderBottomColor: colors.primary,
  },
  previewTabText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  previewTabTextActive: {
    color: colors.primary,
  },
  section: {
    backgroundColor: colors.white,
    marginBottom: 8,
    paddingVertical: 13,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  smallLinkBtn: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallLinkText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  categoryItem: {
    width: 72,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  categoryName: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    fontWeight: '700',
  },
  flashTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  flashTitle: {
    color: '#EE4D2D',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  horizontalProductScroll: {
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  compactProductCard: {
    width: 118,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  compactProductImage: {
    width: '100%',
    height: 118,
    backgroundColor: colors.background,
  },
  productGrid: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PRODUCT_GAP,
  },
  productTile: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: 2,
  },
  productImage: {
    width: '100%',
    height: GRID_ITEM_WIDTH,
    backgroundColor: colors.background,
  },
  productBody: {
    padding: 8,
  },
  productName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  productPrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 5,
  },
  soldText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  manageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  stockText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  editMiniBtn: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: colors.primaryBg,
  },
  editMiniText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  hiddenBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    color: colors.white,
    backgroundColor: colors.textSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '800',
  },
  flashBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    color: colors.white,
    backgroundColor: '#EE4D2D',
    borderRadius: 4,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '900',
  },
  toolsGrid: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolButton: {
    width: (SCREEN_WIDTH - 32 - 20) / 3,
    alignItems: 'center',
    paddingVertical: 10,
  },
  toolIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  toolLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  scrollTopWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 40,
  },
  scrollTopBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});
