import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/api/apiClient';
import { useCartStore } from '../../store/useCartStore';
import { ImageSlider } from '../../components/shop/ImageSlider';
import { ReviewSection } from '../../components/shop/ReviewSection';
import { colors } from '../../theme/colors';
import { resolveProductImageUrl } from '../../utils/imageUtils';

type ProductDetailRouteProp = RouteProp<{ params: { productId: number } }, 'params'>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { productId } = route.params;
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { addToCart } = useCartStore();

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/products/${productId}`);
      setProduct(res);
    } catch (error) {
      console.log('fetchProductDetail error:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết sản phẩm.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.stock <= 0) {
      Alert.alert('Thông báo', 'Sản phẩm đã hết hàng.');
      return;
    }

    try {
      await addToCart(product, 1);
      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng!', [
        { text: 'Tiếp tục mua sắm', style: 'cancel' },
        { text: 'Đến giỏ hàng', onPress: () => navigation.navigate('Cart') }
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (product.stock <= 0) {
      Alert.alert('Thông báo', 'Sản phẩm đã hết hàng.');
      return;
    }
    try {
      await addToCart(product, 1);
      navigation.navigate('Checkout', { cartItems: [product.id] });
    } catch (error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.sliderContainer}>
          <ImageSlider images={(() => {
            // Lấy ảnh từ ProductImages
            const imgUrls = (product.images || [])
              .map((img: any) => resolveProductImageUrl(img.imageUrl))
              .filter(Boolean) as string[];
            // Nếu mediaUrl khác ảnh trong images (đã sửa), thêm vào đầu
            const mediaResolved = resolveProductImageUrl(product.mediaUrl);
            if (mediaResolved && !imgUrls.includes(mediaResolved)) {
              imgUrls.unshift(mediaResolved);
            }
            return imgUrls;
          })()} />

          <View style={[styles.floatHeader, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.floatIconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.floatIconBtn} onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="cart-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.floatIconBtn}>
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
            <View style={styles.mallBadge}>
              <Text style={styles.mallBadgeText}>Mall</Text>
            </View>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{(product.averageRating || 4.9).toFixed(1)}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.statsText}>Đã bán 1,1k</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
          </View>
        </View>

        <View style={styles.guaranteeBanner}>
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text style={styles.guaranteeText}>Đổi ý miễn phí 15 ngày</Text>
          <Text style={styles.guaranteeSubText}>100% Chính hãng</Text>
        </View>

        <View style={styles.shopSection}>
          <View style={styles.shopHeader}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100?text=Shop' }}
              style={styles.shopAvatar}
            />
            <View style={styles.shopInfo}>
              <Text style={styles.shopName} onPress={() => navigation.navigate('ShopView', { shopId: 1 })}>Glocal Cart Official</Text>
              <View style={styles.shopStatus}>
                <Text style={styles.shopStatusText}>Online 5 phút trước</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewShopBtn} onPress={() => navigation.navigate('ShopView', { shopId: 1 })}>
              <Text style={styles.viewShopText}>Xem Shop</Text>
            </TouchableOpacity>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết sản phẩm</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Danh mục</Text>
            <Text style={styles.detailValue} numberOfLines={1}>Glocal Cart Mall &gt; Thời trang &gt; Khác</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thương hiệu</Text>
            <Text style={styles.detailValue}>OEM</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kho hàng</Text>
            <Text style={styles.detailValue}>{product.stock}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gửi từ</Text>
            <Text style={styles.detailValue}>Hà Nội</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.description}>{product.description || 'Sản phẩm tuyệt vời từ Glocal Cart. Chất lượng đảm bảo, giao hàng nhanh chóng.'}</Text>
        </View>

        <ReviewSection productId={product.id} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.chatBtn}
          onPress={() => navigation.navigate('ChatDetail', { shopName: 'Glocal Cart Official', conversationId: '1' })}
        >
          <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  sliderContainer: {
    position: 'relative',
  },
  floatHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  floatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  oldPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mallBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 6,
    marginTop: 2,
  },
  mallBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: colors.text,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  statsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 6,
  },
  guaranteeText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  guaranteeSubText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  shopSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  shopStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewShopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
  },
  viewShopText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  shopMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    height: 60,
  },
  chatBtn: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  chatText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  buyNowBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
    opacity: 0.8,
  },
});
