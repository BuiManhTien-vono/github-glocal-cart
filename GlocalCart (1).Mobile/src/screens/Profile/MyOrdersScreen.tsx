import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { notificationHelper } from '../../utils/notificationHelper';
import {
  BUYER_ORDER_TABS,
  getOrderDisplayLabel,
  matchesTabLabel,
} from '../../utils/orderDisplayStatus';

type PaymentMethod = 'Cash' | 'Transfer';

const cancelReasons = [
  'Thay đổi địa chỉ giao hàng',
  'Đổi ý, không muốn mua nữa',
  'Tìm thấy nơi mua khác tốt hơn',
  'Thay đổi sản phẩm',
  'Đặt trùng đơn hàng',
];

const getOrderItems = (order: any) => order?.items || order?.orderItems || [];

export default function MyOrdersScreen({ route, navigation }: any): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const tabs = BUYER_ORDER_TABS;

  const initialTab = route.params?.activeTab;
  const [activeTab, setActiveTab] = useState(tabs.includes(initialTab) ? initialTab : tabs[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});

  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash');

  const [confirmReceiptVisible, setConfirmReceiptVisible] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<any>(null);

  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedCancelOrderId, setSelectedCancelOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState(cancelReasons[0]);

  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [isReviewLoading, setReviewLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response: any = await apiClient.get('/orders');
      const apiOrders = response?.items || response || [];
      setOrders(Array.isArray(apiOrders) ? apiOrders : []);
    } catch (error) {
      console.log('Fetch orders failed:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const nextTab = route.params?.activeTab;
    if (nextTab && tabs.includes(nextTab)) {
      setActiveTab(nextTab);
    }
  }, [route.params?.activeTab, tabs]);

  useEffect(() => {
    const newOrder = route.params?.newOrder;
    if (!newOrder) return;

    setOrders(prev => {
      const exists = prev.some(order => order.id === newOrder.id);
      return exists ? prev : [newOrder, ...prev];
    });
  }, [route.params?.newOrder]);

  useFocusEffect(
    useCallback(() => {
      const loadReviewedKeys = async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const map: Record<string, boolean> = {};
          keys.filter(key => key.startsWith('@reviewed_')).forEach(key => {
            map[key] = true;
          });
          setReviewedOrders(map);
        } catch {}
      };

      loadReviewedKeys();
    }, [])
  );

  const openPaymentModal = useCallback((order: any) => {
    setSelectedOrderForPayment(order);
    setSelectedMethod('Cash');
    setPaymentModalVisible(true);
  }, []);

  useEffect(() => {
    const orderIdParam = route.params?.openPaymentForOrderId ?? route.params?.openConfirmReceiptForOrderId;
    if (!orderIdParam || orders.length === 0) return;

    const order = orders.find(item => item.id === orderIdParam || item.orderNumber === orderIdParam);
    if (!order) return;

    if (route.params?.openConfirmReceiptForOrderId) {
      setSelectedOrderForReceipt(order);
      setConfirmReceiptVisible(true);
    } else {
      openPaymentModal(order);
    }
  }, [openPaymentModal, orders, route.params?.openConfirmReceiptForOrderId, route.params?.openPaymentForOrderId]);

  const filteredOrders = useMemo(
    () => orders.filter(order => matchesTabLabel(order.status, order.shipment?.status, activeTab)),
    [activeTab, orders]
  );

  const getStatusColor = (label: string) => {
    if (label === tabs[1]) return colors.warning;
    if (label === tabs[2]) return colors.info;
    if (label === tabs[3]) return colors.secondary;
    if (label === tabs[4]) return colors.success;
    if (label === tabs[5]) return colors.danger;
    return colors.text;
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleConfirmReceipt = async (order: any) => {
    try {
      const result: any = await apiClient.post(`/orders/${order.id}/confirm-receipt`);
      if (result?.requiresPayment) {
        setConfirmReceiptVisible(false);
        openPaymentModal(order);
        return;
      }

      Alert.alert('Thành công', result?.message || 'Đã xác nhận nhận hàng.');
      setConfirmReceiptVisible(false);
      fetchOrders();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể xác nhận nhận hàng.');
    }
  };

  const handleCancelOrder = (orderId: number) => {
    setSelectedCancelOrderId(orderId);
    setCancelReason(cancelReasons[0]);
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancelOrderId) return;

    try {
      setCancelModalVisible(false);
      setIsLoading(true);
      const orderToCancel = orders.find(order => order.id === selectedCancelOrderId);
      await apiClient.patch(`/orders/${selectedCancelOrderId}/cancel`, { reason: cancelReason });

      if (orderToCancel) {
        const firstItem = getOrderItems(orderToCancel)[0];
        await notificationHelper.updateOrderNotification(
          orderToCancel.orderNumber,
          'Canceled',
          firstItem?.productName,
          firstItem?.productImage
        );
      }

      Alert.alert('Thành công', 'Hủy đơn hàng thành công.');
      fetchOrders();
    } catch (error) {
      console.log('Cancel order error:', error);
      Alert.alert('Lỗi', 'Không thể hủy đơn hàng lúc này.');
      setIsLoading(false);
    }
  };

  const handleRepurchase = async (orderItems: any[]) => {
    try {
      setIsLoading(true);
      for (const item of orderItems || []) {
        await apiClient.post('/cart/items', { productId: item.productId, quantity: item.quantity });
      }
      navigation.navigate('Cart');
    } catch (error) {
      console.log('Repurchase error:', error);
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
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
      console.log('Fetch review error:', error);
      setSelectedReview({ error: true });
    } finally {
      setReviewLoading(false);
    }
  };

  const submitPaymentChoice = async () => {
    if (!selectedOrderForPayment) return;

    try {
      if (selectedMethod === 'Cash') {
        await apiClient.post(`/orders/${selectedOrderForPayment.id}/payment-method`, { method: 'Cash' });
        Alert.alert('Thành công', 'Đã báo với shipper bạn sẽ thanh toán tiền mặt.');
      } else {
        await apiClient.post(`/orders/${selectedOrderForPayment.id}/payment-method`, { method: 'Transfer' });
        await apiClient.post(`/orders/${selectedOrderForPayment.id}/confirm-transfer`);
        Alert.alert('Thành công', 'Đã báo chuyển khoản thành công. Vui lòng chờ shipper xác nhận.');
      }

      setPaymentModalVisible(false);
      fetchOrders();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Thao tác thất bại.');
    }
  };

  const renderStars = (rating: number) => (
    <View style={st.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={18}
          color="#FFD700"
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );

  const renderItem = ({ item }: any) => {
    const statusText = getOrderDisplayLabel(item.status, item.shipment?.status);
    const statusColor = getStatusColor(statusText);
    const orderItems = getOrderItems(item);
    const firstItem = orderItems[0];
    const isExpanded = expandedOrders.includes(item.id);
    const displayItems = isExpanded ? orderItems : orderItems.slice(0, 1);
    const isArrived = item.shipment?.status === 'Arrived';
    const isReviewed = orderItems.some((orderItem: any) => reviewedOrders[`@reviewed_${item.id}_${orderItem.productId}`]);

    return (
      <View style={st.orderCard}>
        <View style={st.orderHeader}>
          <View style={st.shopRow}>
            <Ionicons name="receipt-outline" size={15} color={colors.textSecondary} />
            <Text style={st.shopName}>Đơn hàng: {item.orderNumber}</Text>
          </View>
          <Text style={[st.orderStatus, { color: statusColor }]}>{statusText}</Text>
        </View>

        <View style={st.orderBodyContainer}>
          {displayItems.map((product: any, index: number) => {
            const imageUri = product?.productImage ? resolveProductImageUrl(product.productImage) : null;

            return (
              <TouchableOpacity
                key={`${item.id}_${product?.productId ?? index}`}
                style={[st.orderBody, index > 0 && st.orderBodySeparated]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              >
                <View style={st.imgWrap}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={st.productImg} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={30} color={colors.textMuted} />
                  )}
                </View>
                <View style={st.orderInfo}>
                  <Text style={st.productName} numberOfLines={2}>
                    {product?.productName || 'Sản phẩm'}
                  </Text>
                  <View style={st.productMetaRow}>
                    <Text style={st.quantityText}>x{product?.quantity ?? 0}</Text>
                    <Text style={st.priceText}>
                      {Number(product?.unitPrice ?? product?.priceSnapshot ?? 0).toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {orderItems.length > 1 && (
            <TouchableOpacity style={st.expandBtn} onPress={() => toggleExpand(item.id)}>
              <Text style={st.expandBtnText}>
                {isExpanded ? 'Thu gọn' : `Xem thêm ${orderItems.length - 1} sản phẩm`}
              </Text>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={st.orderFooter}>
          <Text style={st.totalText}>
            Thành tiền: <Text style={st.amount}>{Number(item.totalAmount || 0).toLocaleString('vi-VN')}đ</Text>
          </Text>
        </View>

        <View style={st.orderActions}>
          {item.status === 'Pending' && (
            <TouchableOpacity style={[st.actionBtn, st.dangerBtn]} onPress={() => handleCancelOrder(item.id)}>
              <Text style={st.dangerBtnText}>Hủy đơn</Text>
            </TouchableOpacity>
          )}

          {item.status === 'Shipped' && !isArrived && (
            <TouchableOpacity
              style={[st.actionBtn, st.primaryBtn]}
              onPress={() => navigation.navigate('ShipmentTracking', { orderId: item.id })}
            >
              <Text style={st.primaryBtnText}>Theo dõi đơn</Text>
            </TouchableOpacity>
          )}

          {isArrived && (
            <TouchableOpacity
              style={[st.actionBtn, st.primaryBtn]}
              onPress={() => {
                setSelectedOrderForReceipt(item);
                setConfirmReceiptVisible(true);
              }}
            >
              <Text style={st.primaryBtnText}>Đã nhận hàng</Text>
            </TouchableOpacity>
          )}

          {item.status === 'Complete' && (
            isReviewed ? (
              <TouchableOpacity style={st.actionBtn} onPress={() => handleViewReview(firstItem?.productId)}>
                <Text style={st.outlineBtnText}>Xem đánh giá</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[st.actionBtn, st.primaryBtn]}
                onPress={() => navigation.navigate('WriteReview', {
                  productId: firstItem?.productId,
                  orderId: item.id,
                  productName: firstItem?.productName,
                  productImage: firstItem?.productImage,
                })}
              >
                <Text style={st.primaryBtnText}>Đánh giá</Text>
              </TouchableOpacity>
            )
          )}

          {item.status === 'Canceled' && (
            <>
              <TouchableOpacity style={st.actionBtn} onPress={() => navigation.navigate('CancelOrderDetailScreen', { orderId: item.id })}>
                <Text style={st.outlineBtnText}>Chi tiết hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.actionBtn, st.primaryBtn]} onPress={() => handleRepurchase(orderItems)}>
                <Text style={st.primaryBtnText}>Mua lại</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={st.actionBtn} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
            <Text style={st.outlineBtnText}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Đơn mua</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={st.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              style={[st.tabItem, activeTab === tab && st.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
        />
      </View>

      {isLoading ? (
        <View style={st.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={st.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={st.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders();
              }}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={() => (
            <View style={st.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={colors.border} />
              <Text style={st.emptyText}>Chưa có đơn hàng nào</Text>
            </View>
          )}
        />
      )}

      <Modal visible={confirmReceiptVisible} transparent animationType="fade" onRequestClose={() => setConfirmReceiptVisible(false)}>
        <View style={st.centerModalOverlay}>
          <View style={st.centerModalContent}>
            <Text style={st.modalTitle}>Xác nhận đã nhận hàng</Text>
            <Text style={st.modalDescription}>
              Shipper đã giao đơn #{selectedOrderForReceipt?.orderNumber} đến bạn. Bạn đã nhận đủ hàng chưa?
            </Text>
            <TouchableOpacity
              style={st.submitPayBtn}
              onPress={() => selectedOrderForReceipt && handleConfirmReceipt(selectedOrderForReceipt)}
            >
              <Text style={st.submitPayBtnText}>Đã nhận hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.cancelTextBtn} onPress={() => setConfirmReceiptVisible(false)}>
              <Text style={st.cancelText}>Để sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isCancelModalVisible} animationType="slide" transparent onRequestClose={() => setCancelModalVisible(false)}>
        <View style={st.modalOverlay}>
          <TouchableOpacity style={st.modalBackdrop} onPress={() => setCancelModalVisible(false)} />
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Lý do hủy đơn</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cancelReasons}
              keyExtractor={(_, index) => String(index)}
              renderItem={({ item }) => (
                <TouchableOpacity style={st.reasonItem} onPress={() => setCancelReason(item)}>
                  <Text style={st.reasonText}>{item}</Text>
                  <Ionicons
                    name={cancelReason === item ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={cancelReason === item ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[st.primaryBtn, st.modalConfirmBtn]} onPress={handleConfirmCancel}>
              <Text style={st.primaryBtnText}>Xác nhận hủy đơn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={paymentModalVisible} transparent animationType="slide" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={st.modalOverlay}>
          <TouchableOpacity style={st.modalBackdrop} onPress={() => setPaymentModalVisible(false)} />
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Thanh toán nhận hàng</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedOrderForPayment && (
              <View style={st.modalBody}>
                <Text style={st.orderCodeLabel}>Mã đơn hàng: <Text style={st.boldText}>{selectedOrderForPayment.orderNumber}</Text></Text>
                <View style={st.amountSection}>
                  <Text style={st.amountLabel}>Số tiền cần thanh toán</Text>
                  <Text style={st.amountValue}>{Number(selectedOrderForPayment.totalAmount || 0).toLocaleString('vi-VN')}đ</Text>
                </View>

                <Text style={st.sectionTitle}>Chọn phương thức thanh toán</Text>
                <View style={st.methodRow}>
                  <TouchableOpacity
                    style={[st.methodBtn, selectedMethod === 'Cash' && st.methodBtnActive]}
                    onPress={() => setSelectedMethod('Cash')}
                  >
                    <Ionicons name="cash-outline" size={20} color={selectedMethod === 'Cash' ? colors.primary : colors.textSecondary} />
                    <Text style={[st.methodText, selectedMethod === 'Cash' && st.methodTextActive]}>Tiền mặt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.methodBtn, selectedMethod === 'Transfer' && st.methodBtnActive]}
                    onPress={() => setSelectedMethod('Transfer')}
                  >
                    <Ionicons name="qr-code-outline" size={20} color={selectedMethod === 'Transfer' ? colors.primary : colors.textSecondary} />
                    <Text style={[st.methodText, selectedMethod === 'Transfer' && st.methodTextActive]}>Chuyển khoản</Text>
                  </TouchableOpacity>
                </View>

                {selectedMethod === 'Transfer' && (
                  <View style={st.qrSection}>
                    <Text style={st.qrInstruction}>Quét mã để chuyển khoản cho shipper</Text>
                    <Image
                      source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=GlocalCartPayOrder_${selectedOrderForPayment.orderNumber}` }}
                      style={st.qrImage}
                    />
                    <Text style={st.qrNote}>Nội dung chuyển khoản: <Text style={st.boldText}>{selectedOrderForPayment.orderNumber}</Text></Text>
                  </View>
                )}

                <TouchableOpacity style={st.submitPayBtn} onPress={submitPaymentChoice}>
                  <Text style={st.submitPayBtnText}>Tôi đã thanh toán</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={isReviewModalVisible} animationType="slide" transparent onRequestClose={() => setReviewModalVisible(false)}>
        <View style={st.modalOverlay}>
          <TouchableOpacity style={st.modalBackdrop} onPress={() => setReviewModalVisible(false)} />
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Đánh giá của tôi</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isReviewLoading ? (
              <View style={st.reviewState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={st.loadingText}>Đang tải đánh giá...</Text>
              </View>
            ) : selectedReview?.notFound ? (
              <View style={st.reviewState}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
                <Text style={st.emptyText}>Không tìm thấy đánh giá của bạn.</Text>
              </View>
            ) : selectedReview?.error ? (
              <View style={st.reviewState}>
                <Ionicons name="warning-outline" size={48} color={colors.danger} />
                <Text style={st.emptyText}>Có lỗi xảy ra khi tải đánh giá.</Text>
              </View>
            ) : selectedReview ? (
              <View style={st.reviewBody}>
                <Text style={st.reviewUser}>{selectedReview.userName || user?.fullName || 'Bạn'}</Text>
                {renderStars(Number(selectedReview.rating || 0))}
                <View style={st.reviewTextBox}>
                  <Text style={st.reviewText}>{selectedReview.review || selectedReview.comment || 'Không có bình luận'}</Text>
                </View>
              </View>
            ) : null}

            <TouchableOpacity style={[st.primaryBtn, st.closeReviewBtn]} onPress={() => setReviewModalVisible(false)}>
              <Text style={st.primaryBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  tabsContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tabItem: { paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  listContent: { padding: spacing.sm },
  orderCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadow.sm, overflow: 'hidden' },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  shopName: { fontSize: 14, fontWeight: '600', color: colors.text },
  orderStatus: { fontSize: 13, fontWeight: '700' },
  orderBodyContainer: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  orderBody: { flexDirection: 'row' },
  orderBodySeparated: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  imgWrap: { width: 70, height: 70, backgroundColor: colors.background, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  productImg: { width: '100%', height: '100%' },
  orderInfo: { flex: 1, justifyContent: 'space-between' },
  productName: { fontSize: 14, color: colors.text, fontWeight: '500', lineHeight: 20 },
  productMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  quantityText: { fontSize: 13, color: colors.textSecondary },
  priceText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  expandBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8, backgroundColor: colors.background, borderRadius: 6 },
  expandBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  orderFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  totalText: { fontSize: 14, color: colors.text },
  amount: { fontSize: 15, color: colors.primary, fontWeight: '700' },
  orderActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', padding: 12, gap: 10 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  primaryBtn: { backgroundColor: colors.primary, borderColor: colors.primary, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  outlineBtnText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  dangerBtn: { borderColor: colors.danger },
  dangerBtnText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyText: { marginTop: 12, color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.md, maxHeight: '85%' },
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  centerModalContent: { backgroundColor: colors.white, borderRadius: 16, margin: 24, padding: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 12, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalDescription: { color: colors.textSecondary, marginVertical: 12, lineHeight: 20 },
  modalBody: { gap: 12 },
  reasonItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  reasonText: { fontSize: 15, color: colors.text, flex: 1, marginRight: 10 },
  modalConfirmBtn: { marginTop: spacing.md, paddingVertical: 14 },
  cancelTextBtn: { marginTop: 12, alignItems: 'center' },
  cancelText: { color: colors.textSecondary },
  orderCodeLabel: { fontSize: 14, color: colors.textSecondary },
  boldText: { fontWeight: '700' },
  amountSection: { backgroundColor: colors.background, padding: 16, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  amountLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  amountValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 8 },
  methodRow: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  methodBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  methodText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  methodTextActive: { color: colors.primary, fontWeight: '700' },
  qrSection: { alignItems: 'center', padding: 12, backgroundColor: colors.background, borderRadius: 10, marginVertical: 8 },
  qrInstruction: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  qrImage: { width: 180, height: 180, borderRadius: 8, marginBottom: 8 },
  qrNote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  submitPayBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  submitPayBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  reviewState: { minHeight: 180, justifyContent: 'center', alignItems: 'center', padding: 20 },
  reviewBody: { paddingVertical: 10 },
  reviewUser: { fontSize: 15, fontWeight: '700', color: colors.text },
  starsRow: { flexDirection: 'row', marginVertical: 8 },
  reviewTextBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginTop: 8 },
  reviewText: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
  closeReviewBtn: { marginTop: 12, paddingVertical: 12 },
});
