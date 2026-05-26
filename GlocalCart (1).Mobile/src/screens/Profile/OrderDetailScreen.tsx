import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { paymentApi, PaymentStatusResponse } from '../../services/api/paymentApi';
import { Loading } from '../../components/common/Loading';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { getOrderDisplayLabel } from '../../utils/orderDisplayStatus';
import { useAuth } from '../../context/AuthContext';
import { notificationHelper } from '../../utils/notificationHelper';
import {
  onDeliveryRealtime,
  startDeliveryRealtime,
} from '../../services/realtime/deliveryRealtime';

const cancelReasons = [
  'Thay đổi địa chỉ giao hàng',
  'Đổi ý, không muốn mua nữa',
  'Tìm thấy nơi mua khác tốt hơn',
  'Thay đổi sản phẩm',
  'Đặt trùng đơn hàng',
];

const getOrderItems = (order: any) => order?.items || order?.orderItems || [];

const formatCurrency = (value: any) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatTime = (date?: string | null) => {
  if (!date) return 'Chưa cập nhật';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Chưa cập nhật';
  return parsed.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  if (status === 'Pending') return colors.warning;
  if (status === 'Unshipped') return colors.info;
  if (status === 'Shipped') return colors.secondary;
  if (status === 'Complete') return colors.success;
  if (status === 'Canceled') return colors.danger;
  return colors.textSecondary;
};

const getPaymentText = (status?: string) => {
  switch (status) {
    case 'Unpaid':
      return 'Chưa thanh toán';
    case 'Pending':
      return 'Chờ xác nhận';
    case 'Completed':
      return 'Đã thanh toán';
    case 'Failed':
      return 'Thanh toán thất bại';
    default:
      return status || 'Chưa cập nhật';
  }
};

export default function OrderDetailScreen({ navigation, route }: any): React.JSX.Element {
  const orderId = route?.params?.orderId;
  const fromPayment = route?.params?.fromPayment;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState(cancelReasons[0]);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [isReviewLoading, setReviewLoading] = useState(false);

  const orderItems = useMemo(() => getOrderItems(order), [order]);
  const firstItem = orderItems[0];

  const loadReviewedKeys = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const map: Record<string, boolean> = {};
      keys.filter(key => key.startsWith('@reviewed_')).forEach(key => {
        map[key] = true;
      });
      setReviewedOrders(map);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReviewedKeys();
    }, [loadReviewedKeys])
  );

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    try {
      const data: any = await apiClient.get(`/orders/${orderId}`);
      setOrder(data);

      const paymentMethod = String(data?.payment?.method || data?.paymentMethod || '');
      if (paymentMethod === '1' || paymentMethod.includes('Electronic') || paymentMethod.includes('Transfer')) {
        try {
          const status = await paymentApi.getStatus(orderId);
          setPaymentStatus(status);
        } catch (error) {
          console.log('fetch payment status error:', error);
          setPaymentStatus(null);
        }
      } else {
        setPaymentStatus(null);
      }

      const product = getOrderItems(data)[0];
      if (product?.productId && user?.id) {
        try {
          const reviewsResponse: any = await apiClient.get(`/products/${product.productId}/reviews`);
          const reviews = reviewsResponse?.items || reviewsResponse || [];
          const myReview = reviews.find((review: any) => String(review.userId) === String(user.id));
          if (myReview) {
            setReviewedOrders(prev => ({
              ...prev,
              [`@reviewed_${data.id}_${product.productId}`]: true,
            }));
          }
        } catch (error) {
          console.log('fetch review status error:', error);
        }
      }
    } catch (error: any) {
      console.log('fetchOrderDetail error:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, user?.id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  useEffect(() => {
    startDeliveryRealtime();
    const refreshIfCurrentOrder = (payload: any) => {
      if (!payload.orderId || String(payload.orderId) === String(orderId)) {
        fetchOrderDetail();
      }
    };

    const offOrder = onDeliveryRealtime('OrderUpdated', refreshIfCurrentOrder);
    const offShipment = onDeliveryRealtime('ShipmentUpdated', refreshIfCurrentOrder);
    const offPayment = onDeliveryRealtime('PaymentUpdated', refreshIfCurrentOrder);
    return () => {
      offOrder();
      offShipment();
      offPayment();
    };
  }, [fetchOrderDetail, orderId]);

  const handleGoBack = () => {
    if (fromPayment) {
      navigation.navigate('MainTabs', {
        screen: 'Profile',
        params: { screen: 'ProfileMain' },
      });
      return;
    }
    navigation.goBack();
  };

  const handleCancelOrder = () => {
    setCancelReason(cancelReasons[0]);
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelModalVisible(false);
      setIsLoading(true);
      await apiClient.patch(`/orders/${orderId}/cancel`, { reason: cancelReason });

      if (order) {
        await notificationHelper.updateOrderNotification(
          order.orderNumber,
          'Canceled',
          firstItem?.productName,
          firstItem?.productImage
        );
      }

      Alert.alert('Thành công', 'Hủy đơn hàng thành công.', [
        { text: 'OK', onPress: () => navigation.replace('CancelOrderDetailScreen', { orderId }) },
      ]);
    } catch (error: any) {
      console.log('cancel order error:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể hủy đơn hàng lúc này.');
      setIsLoading(false);
    }
  };

  const handleRepurchase = async () => {
    try {
      setIsLoading(true);
      for (const item of orderItems) {
        await apiClient.post('/cart/items', { productId: item.productId, quantity: item.quantity });
      }
      navigation.navigate('Cart');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReview = async (productId?: number) => {
    if (!productId) return;

    try {
      setReviewLoading(true);
      setReviewModalVisible(true);
      setSelectedReview(null);
      const response: any = await apiClient.get(`/products/${productId}/reviews`);
      const reviews = response?.items || response || [];
      const myReview = reviews.find((review: any) => String(review.userId) === String(user?.id));
      setSelectedReview(myReview || { notFound: true });
    } catch (error) {
      console.log('fetch review error:', error);
      setSelectedReview({ error: true });
    } finally {
      setReviewLoading(false);
    }
  };

  const handlePayNow = () => {
    navigation.navigate('VietQR', { orderId });
  };

  if (isLoading) return <Loading />;

  if (!order) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="receipt-outline" size={56} color={colors.textMuted} />
        <Text style={styles.emptyText}>Không tìm thấy thông tin đơn hàng</Text>
        <TouchableOpacity style={styles.outlineBtn} onPress={handleGoBack}>
          <Text style={styles.outlineBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusLabel = getOrderDisplayLabel(order.status, order.shipment?.status);
  const statusColor = getStatusColor(order.status);
  const isReviewed = orderItems.some((item: any) => reviewedOrders[`@reviewed_${order.id}_${item.productId}`]);
  const payment = paymentStatus || order.payment;
  const paymentText = getPaymentText(payment?.status);
  const canPayNow = paymentStatus?.canInitiatePayment || payment?.status === 'Unpaid' || payment?.status === 'Failed';
  const shippingAddress = order.shippingAddress || {};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, { backgroundColor: statusColor }]}>
          <View>
            <Text style={styles.statusTitle}>{statusLabel}</Text>
            <Text style={styles.statusSubtitle}>Mã đơn: {order.orderNumber}</Text>
          </View>
          <Ionicons name="receipt-outline" size={34} color={colors.white} />
        </View>

        {!!order.shipment && (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ShipmentTracking', { orderId: order.id })}
          >
            <View style={styles.cardTitleRow}>
              <Ionicons name="car-outline" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Vận chuyển</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
            <InfoRow label="Trạng thái" value={order.shipment.status || 'Chưa cập nhật'} />
            <InfoRow label="Đơn vị" value={order.shipment.shipmentMethod || 'Chưa cập nhật'} />
            <InfoRow label="Mã vận đơn" value={order.shipment.trackingNumber || 'Chưa cập nhật'} />
            <InfoRow label="Dự kiến giao" value={formatTime(order.shipment.estimatedArrival)} />
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Địa chỉ nhận hàng</Text>
          </View>
          <Text style={styles.addressText}>
            {[shippingAddress.streetAddress, shippingAddress.state, shippingAddress.city, shippingAddress.country]
              .filter(Boolean)
              .join(', ') || 'Chưa cập nhật địa chỉ'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="cube-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Sản phẩm</Text>
          </View>
          {orderItems.map((item: any, index: number) => {
            const imageUri = item.productImage ? resolveProductImageUrl(item.productImage) : null;

            return (
              <View key={`${item.productId}_${index}`} style={[styles.productRow, index > 0 && styles.productDivider]}>
                <View style={styles.productImageWrap}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.productImage} />
                  ) : (
                    <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.productName || 'Sản phẩm'}</Text>
                  <Text style={styles.sellerText}>{item.sellerName || 'GlocalCart'}</Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.quantity}>x{item.quantity || 0}</Text>
                    <Text style={styles.price}>{formatCurrency(item.unitPrice || item.priceSnapshot)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Thanh toán</Text>
          </View>
          <InfoRow label="Phương thức" value={payment?.method || 'Chưa cập nhật'} />
          <InfoRow label="Trạng thái" value={paymentText} />
          <InfoRow label="Tiền hàng" value={formatCurrency(Number(order.totalAmount || 0) - Number(order.shippingFee || 0))} />
          <InfoRow label="Phí vận chuyển" value={formatCurrency(order.shippingFee)} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {order.status === 'Pending' && (
          <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={handleCancelOrder}>
            <Text style={styles.dangerText}>Hủy đơn</Text>
          </TouchableOpacity>
        )}

        {order.status === 'Shipped' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ShipmentTracking', { orderId: order.id })}>
            <Text style={styles.outlineBtnText}>Theo dõi đơn</Text>
          </TouchableOpacity>
        )}

        {order.status === 'Complete' && firstItem && (
          isReviewed ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewReview(firstItem.productId)}>
              <Text style={styles.outlineBtnText}>Xem đánh giá</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={() => navigation.navigate('WriteReview', {
                productId: firstItem.productId,
                orderId: order.id,
                productName: firstItem.productName,
                productImage: firstItem.productImage,
              })}
            >
              <Text style={styles.primaryText}>Đánh giá</Text>
            </TouchableOpacity>
          )
        )}

        {order.status === 'Canceled' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CancelOrderDetailScreen', { orderId: order.id })}>
            <Text style={styles.outlineBtnText}>Chi tiết hủy</Text>
          </TouchableOpacity>
        )}

        {canPayNow && (
          <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={handlePayNow}>
            <Text style={styles.primaryText}>Thanh toán</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={handleRepurchase}>
          <Text style={styles.primaryText}>Mua lại</Text>
        </TouchableOpacity>
      </View>

      <CancelModal
        visible={isCancelModalVisible}
        reason={cancelReason}
        onChangeReason={setCancelReason}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={handleConfirmCancel}
      />

      <ReviewModal
        visible={isReviewModalVisible}
        loading={isReviewLoading}
        review={selectedReview}
        onClose={() => setReviewModalVisible(false)}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function CancelModal({
  visible,
  reason,
  onChangeReason,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  reason: string;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Lý do hủy đơn</Text>
          {cancelReasons.map(item => (
            <TouchableOpacity key={item} style={styles.reasonRow} onPress={() => onChangeReason(item)}>
              <Ionicons
                name={reason === item ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={reason === item ? colors.primary : colors.textMuted}
              />
              <Text style={styles.reasonText}>{item}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalSecondaryBtn} onPress={onClose}>
              <Text style={styles.outlineBtnText}>Đóng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={onConfirm}>
              <Text style={styles.primaryText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReviewModal({
  visible,
  loading,
  review,
  onClose,
}: {
  visible: boolean;
  loading: boolean;
  review: any;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Đánh giá của bạn</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : review?.notFound ? (
            <Text style={styles.modalText}>Chưa tìm thấy đánh giá cho sản phẩm này.</Text>
          ) : review?.error ? (
            <Text style={styles.modalText}>Không thể tải đánh giá.</Text>
          ) : (
            <>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons
                    key={star}
                    name={star <= Number(review?.rating || 0) ? 'star' : 'star-outline'}
                    size={20}
                    color="#FACC15"
                  />
                ))}
              </View>
              <Text style={styles.modalText}>{review?.review || 'Bạn chưa nhập nội dung đánh giá.'}</Text>
            </>
          )}
          <TouchableOpacity style={[styles.modalPrimaryBtn, { alignSelf: 'stretch' }]} onPress={onClose}>
            <Text style={styles.primaryText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginVertical: spacing.md,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  statusCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  statusTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  statusSubtitle: {
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  addressText: {
    color: colors.textSecondary,
    lineHeight: 21,
  },
  productRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  productDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  productImageWrap: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  sellerText: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 12,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  quantity: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  price: {
    color: colors.primary,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: spacing.md,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  dangerBtn: {
    borderColor: colors.danger,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },
  outlineBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  primaryText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  dangerText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
  },
  reasonText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalText: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.sm,
  },
});
