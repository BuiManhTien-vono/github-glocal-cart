import { Image } from 'expo-image';
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert, StatusBar, Modal, Clipboard, Platform, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/api/apiClient';
import { useCartStore } from '../../store/useCartStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useFollowShopStore } from '../../store/useFollowShopStore';
import { useAuth } from '../../context/AuthContext';
import { ImageSlider } from '../../components/shop/ImageSlider';
import { ReviewSection } from '../../components/shop/ReviewSection';
import { DailyDiscover } from '../../components/shop/DailyDiscover';
import { CartBadge } from '../../components/common/CartBadge';
import { colors } from '../../theme/colors';
import { resolveProductImageUrl } from '../../utils/imageUtils';

type ProductDetailRouteProp = RouteProp<{ params: { productId: number } }, 'params'>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const { isLoggedIn, setGuestMode } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [discoveryProducts, setDiscoveryProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false); // 3-dot menu

  const { addToCart } = useCartStore();
  const { isFavorite, toggleFavorite, loadFavorites } = useFavoritesStore();
  const { isFollowing, toggleFollow, loadFollowedShops } = useFollowShopStore();

  // Shop mock info (sẽ lấy từ API sau)
  const shopId = product?.sellerId || 1;
  const shopName = product?.sellerName || 'Glocal Cart Official';

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  useEffect(() => {
    if (isLoggedIn) loadFollowedShops();
  }, [isLoggedIn, loadFollowedShops]);

  useEffect(() => {
    if (isLoggedIn) loadFavorites();
  }, [isLoggedIn, loadFavorites]);

  const fetchProductDetail = async () => {
    try {
      setIsLoading(true);
      const [res, discoveryRes] = await Promise.all([
        apiClient.get(`/products/${productId}`),
        apiClient.get('/products') as Promise<any>,
      ]);
      setProduct(res);
      setDiscoveryProducts(discoveryRes?.items || discoveryRes || []);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải chi tiết sản phẩm.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.stock <= 0) { Alert.alert('Thông báo', 'Sản phẩm đã hết hàng.'); return; }
    try {
      await addToCart(product, 1);
      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng!', [
        { text: 'Tiếp tục mua sắm', style: 'cancel' },
        { text: 'Đến giỏ hàng', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (product.stock <= 0) { Alert.alert('Thông báo', 'Sản phẩm đã hết hàng.'); return; }
    try {
      navigation.navigate('Checkout', { 
        selectedItems: [{
          id: Date.now(),
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0]?.imageUrl || product.mediaUrl,
          priceSnapshot: product.price,
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          quantity: 1,
        }],
        isBuyNow: true
      });
    } catch {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi.');
    }
  };

  // Chat ngay → ChatDetail với shop cụ thể
  const handleChat = () => {
    if (!isLoggedIn) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để chat với shop.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => setGuestMode(false) },
      ]);
      return;
    }
    navigation.navigate('ChatDetail', { shopId, shopName, productId });
  };

  // Toggle yêu thích
  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để lưu yêu thích.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => setGuestMode(false) },
      ]);
      return;
    }
    if (product) await toggleFavorite(product);
  };

  const handleToggleFollowShop = async () => {
    if (!isLoggedIn) {
      Alert.alert('Yeu cau dang nhap', 'Ban can dang nhap de theo doi shop.', [
        { text: 'De sau', style: 'cancel' },
        { text: 'Dang nhap', onPress: () => setGuestMode(false) },
      ]);
      return;
    }

    try {
      await toggleFollow({
        id: shopId,
        name: shopName,
        logoUrl: product?.sellerLogoUrl,
      });
    } catch (error: any) {
      Alert.alert('Loi', error?.message || 'Khong the cap nhat theo doi shop.');
    }
  };

  // Chia sẻ sản phẩm
  const handleShare = async () => {
    setShowMenu(false);
    const link = `https://glocalcart.app/products/${productId}`;
    if (Platform.OS === 'web') {
      Alert.alert('Link sản phẩm', link);
      return;
    }
    try {
      await Share.share({ message: `${product?.name || 'Sản phẩm'}\n${link}`, url: link });
    } catch {
      Alert.alert('Link sản phẩm', link);
    }
  };

  // Báo cáo sản phẩm
  const handleReport = () => {
    setShowMenu(false);
    navigation.navigate('ReportProduct', { productId, productName: product?.name });
  };

  const isProductFavorite = product ? isFavorite(product.id) : false;
  const shopFollowed = isFollowing(shopId);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy sản phẩm</Text>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const oldPrice = product.price * 1.2;

  const imageUrls = (() => {
    const imgUrls = (product.images || [])
      .map((img: any) => resolveProductImageUrl(img.imageUrl))
      .filter(Boolean) as string[];
    const mediaResolved = resolveProductImageUrl(product.mediaUrl);
    if (mediaResolved && !imgUrls.includes(mediaResolved)) imgUrls.unshift(mediaResolved);
    return imgUrls;
  })();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}
      >
        {/* ─── Image Slider ─── */}
        <View style={styles.sliderContainer}>
          <ImageSlider images={imageUrls} />

          {/* Float header với SafeArea */}
          <View style={[styles.floatHeader, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.floatIconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              {/* Giỏ hàng với badge */}
              <TouchableOpacity style={styles.floatIconBtn} onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="cart-outline" size={24} color="#fff" />
                <CartBadge containerStyle={styles.cartBadge} />
              </TouchableOpacity>
              {/* 3-dot menu */}
              <TouchableOpacity style={styles.floatIconBtn} onPress={() => setShowMenu(true)}>
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ─── Thông tin giá & tên ─── */}
        <View style={styles.infoSection}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || 0)}
            </Text>
            <Text style={styles.oldPrice}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(oldPrice)}
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-20%</Text>
            </View>
          </View>

          <View style={styles.titleRow}>
            <View style={styles.mallBadge}><Text style={styles.mallBadgeText}>Mall</Text></View>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{(product.averageRating || 4.9).toFixed(1)}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.statsText}>Đã bán 1.1k</Text>
            <View style={{ flex: 1 }} />
            {/* Heart icon – toggle favorite */}
            <TouchableOpacity onPress={handleToggleFavorite} style={{ padding: 4 }}>
              <Ionicons
                name={isProductFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isProductFavorite ? colors.danger : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Guarantee ─── */}
        <View style={styles.guaranteeBanner}>
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text style={styles.guaranteeText}>Đổi ý miễn phí 15 ngày</Text>
          <Text style={styles.guaranteeSubText}>100% Chính hãng</Text>
        </View>

        {/* ─── Shop Section ─── */}
        <View style={styles.shopSection}>
          <View style={styles.shopHeader}>
            <Image
              source={{ uri: resolveProductImageUrl(product.sellerLogoUrl) || 'https://via.placeholder.com/100?text=Shop' }}
              style={styles.shopAvatar}
            />
            <View style={styles.shopInfo}>
              <Text style={styles.shopName} onPress={() => navigation.navigate('ShopView', { shopId })}>
                {shopName}
              </Text>
              <View style={styles.shopStatus}>
                <Text style={styles.shopStatusText}>Online 5 phút trước</Text>
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <TouchableOpacity style={styles.viewShopBtn} onPress={() => navigation.navigate('ShopView', { shopId })}>
                <Text style={styles.viewShopText}>Xem Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.followBtn, shopFollowed && styles.followBtnActive]}
                onPress={handleToggleFollowShop}
              >
                <Text style={[styles.followBtnText, shopFollowed && styles.followBtnTextActive]}>
                  {shopFollowed ? '✓ Đang theo dõi' : '+ Theo dõi'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.shopMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>125</Text>
              <Text style={styles.metricLabel}>Sản phẩm</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>4.9</Text>
              <Text style={styles.metricLabel}>Đánh giá</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>99%</Text>
              <Text style={styles.metricLabel}>Phản hồi</Text>
            </View>
          </View>
        </View>

        {/* ─── Chi tiết ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết sản phẩm</Text>
          {[
            { label: 'Danh mục', value: 'Glocal Cart Mall > Thời trang > Khác' },
            { label: 'Thương hiệu', value: 'OEM' },
            { label: 'Kho hàng', value: String(product.stock) },
            { label: 'Gửi từ', value: 'Hà Nội' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </View>

        {/* ─── Mô tả ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.description}>
            {product.description || 'Sản phẩm tuyệt vời từ Glocal Cart. Chất lượng đảm bảo, giao hàng nhanh chóng.'}
          </Text>
        </View>

        {/* ─── Reviews ─── */}
        <ReviewSection productId={product.id} productName={product.name} navigation={navigation} />

        {/* ─── Daily Discover ─── */}
        <DailyDiscover data={discoveryProducts} />
      </ScrollView>

      {/* ─── Footer với SafeArea ─── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
          <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
          <Text style={styles.chatText}>Chat ngay</Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.addToCartBtn, product.stock <= 0 && styles.disabledBtn]}
            onPress={handleAddToCart}
            disabled={product.stock <= 0}
          >
            <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyNowBtn, product.stock <= 0 && styles.disabledBtn]}
            onPress={handleBuyNow}
            disabled={product.stock <= 0}
          >
            <Text style={styles.buyNowText}>Mua ngay</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 3-dot Dropdown Menu ─── */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)} />
        <View style={[styles.menuDropdown, { top: insets.top + 52, right: 16 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#333" />
            <Text style={styles.menuItemText}>Chia sẻ</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
            <Ionicons name="flag-outline" size={20} color={colors.danger} />
            <Text style={[styles.menuItemText, { color: colors.danger }]}>Báo cáo sản phẩm</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: {},

  sliderContainer: { position: 'relative' },
  floatHeader: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16,
  },
  headerRight: { flexDirection: 'row', gap: 12 },
  floatIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  cartBadge: { top: -5, right: -5 },

  infoSection: { backgroundColor: '#fff', padding: 16, paddingTop: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: '700', color: colors.primary, marginRight: 8 },
  oldPrice: { fontSize: 14, color: colors.textMuted, textDecorationLine: 'line-through', marginRight: 8 },
  discountBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  discountText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  mallBadge: { backgroundColor: colors.danger, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, marginRight: 6, marginTop: 2 },
  mallBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  productName: { flex: 1, fontSize: 16, color: colors.text, lineHeight: 22, fontWeight: '500' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, color: colors.text },
  divider: { width: 1, height: 12, backgroundColor: colors.border, marginHorizontal: 8 },
  statsText: { fontSize: 14, color: colors.textSecondary },

  guaranteeBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF0F0', paddingHorizontal: 16, paddingVertical: 10,
    marginBottom: 8, gap: 6,
  },
  guaranteeText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  guaranteeSubText: { fontSize: 12, color: colors.textSecondary, marginLeft: 8 },

  shopSection: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  shopHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  shopAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight },
  shopInfo: { flex: 1, marginLeft: 12 },
  shopName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  shopStatus: { flexDirection: 'row', alignItems: 'center' },
  shopStatusText: { fontSize: 12, color: colors.textSecondary },
  viewShopBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.primary, borderRadius: 4 },
  viewShopText: { color: colors.primary, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  followBtn: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#ccc', borderRadius: 4 },
  followBtnActive: { borderColor: colors.success, backgroundColor: '#ECFDF5' },
  followBtnText: { color: '#666', fontSize: 12, textAlign: 'center' },
  followBtnTextActive: { color: colors.success, fontWeight: '600' },
  shopMetrics: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  metricLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: colors.borderLight },

  section: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12 },
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { width: 100, fontSize: 14, color: colors.textSecondary },
  detailValue: { flex: 1, fontSize: 14, color: colors.text },
  description: { fontSize: 14, color: colors.text, lineHeight: 22 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  chatBtn: { width: 80, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.borderLight, paddingVertical: 10 },
  chatText: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  actionButtons: { flex: 1, flexDirection: 'row' },
  addToCartBtn: { flex: 1, backgroundColor: colors.primaryBg, justifyContent: 'center', alignItems: 'center' },
  addToCartText: { color: colors.primary, fontSize: 15, fontWeight: '500' },
  buyNowBtn: { flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  buyNowText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  disabledBtn: { backgroundColor: '#ccc', opacity: 0.8 },

  // 3-dot menu
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menuDropdown: {
    position: 'absolute', backgroundColor: '#fff', borderRadius: 10,
    minWidth: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuItemText: { fontSize: 15, color: '#333' },
  menuDivider: { height: 0.5, backgroundColor: '#f0f0f0' },
});
