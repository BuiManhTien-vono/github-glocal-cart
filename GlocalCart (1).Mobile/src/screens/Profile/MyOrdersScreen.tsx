import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl, Alert, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { notificationHelper } from '../../utils/notificationHelper';

// Xóa mock data cứng, nếu rỗng thì mảng rỗng

export default function MyOrdersScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const initialTab = route.params?.activeTab || 'Tất cả';
  const newOrderFromCheckout = route.params?.newOrder;

  const tabs = ['Tất cả', 'Chờ xác nhận', 'Đang giao', 'Đã giao', 'Đánh giá', 'Đã hủy'];
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cancellation Modal State
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedCancelOrderId, setSelectedCancelOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  
  // Expandable orders
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

  // Review Modal State
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [isReviewLoading, setReviewLoading] = useState(false);

  const toggleExpand = (orderId: number) => {
    setExpandedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
  };

  const cancelReasons = [
    'Thay đổi địa chỉ giao hàng',
    'Đổi ý, không muốn mua nữa',
    'Tìm thấy chỗ mua khác tốt hơn (Rẻ hơn, uy tín hơn, giao nhanh hơn...)',
    'Thay đổi sản phẩm (Kích thước, màu sắc, số lượng...)',
    'Đặt trùng đơn hàng'
  ];

  const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});

  useFocusEffect(
    React.useCallback(() => {
      const loadReviewedKeys = async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const reviewKeys = keys.filter(k => k.startsWith('@reviewed_'));
          const map: Record<string, boolean> = {};
          reviewKeys.forEach(k => map[k] = true);
          setReviewedOrders(map);
        } catch (e) {}
      };
      loadReviewedKeys();
    }, [])
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  // Khi có đơn hàng mới từ checkout, thêm vào đầu danh sách
  useEffect(() => {
    if (newOrderFromCheckout) {
      setOrders(prev => {
        const exists = prev.some(o => o.id === newOrderFromCheckout.id);
        return exists ? prev : [newOrderFromCheckout, ...prev];
      });
    }
  }, [newOrderFromCheckout]);

  const fetchOrders = async () => {
    try {
      const response: any = await apiClient.get('/orders');
      // Dữ liệu trả về có thể nằm trong response.items (PagedResult)
      const apiOrders = response?.items || response || [];
      setOrders(apiOrders);
    } catch (e) {
      console.log('Lấy đơn hàng thất bại', e);
      setOrders([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelOrder = (orderId: number) => {
    setSelectedCancelOrderId(orderId);
    setCancelReason(cancelReasons[0]); // default to first
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancelOrderId) return;
    try {
      setCancelModalVisible(false);
      setIsLoading(true);
      const orderToCancel = orders.find(o => o.id === selectedCancelOrderId);
      await apiClient.patch(`/orders/${selectedCancelOrderId}/cancel`, { reason: cancelReason });
      
      if (orderToCancel) {
        await notificationHelper.updateOrderNotification(
          orderToCancel.orderNumber,
          'Canceled',
          orderToCancel.items?.[0]?.productName,
          orderToCancel.items?.[0]?.productImage
        );
      }
      
      Alert.alert('Thành công', 'Hủy đơn hàng thành công');
      fetchOrders();
    } catch (error) {
      console.log('Cancel order error:', error);
      Alert.alert('Lỗi', 'Không thể hủy đơn hàng lúc này');
      setIsLoading(false);
    }
  };

  const handleRepurchase = async (orderItems: any[]) => {
    try {
      setIsLoading(true);
      for (const item of orderItems) {
        await apiClient.post('/cart/items', { productId: item.productId, quantity: item.quantity });
      }
      // Tự động điều hướng đến giỏ hàng luôn
      navigation.navigate('Cart');
    } catch (error) {
      console.log('Repurchase error:', error);
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReview = async (productId: number) => {
    try {
      setReviewLoading(true);
      setReviewModalVisible(true);
      setSelectedReview(null);
      const res: any = await apiClient.get(`/products/${productId}/reviews`);
      const reviewsList = res?.items || res || [];
      // Tìm review của user hiện tại
      const myReview = reviewsList.find((r: any) => String(r.userId) === String(user?.id));
      if (myReview) {
        setSelectedReview(myReview);
      } else {
        setSelectedReview({ notFound: true });
      }
    } catch (error) {
      console.log('Error fetching review:', error);
      setSelectedReview({ error: true });
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pending': return 'Chờ xác nhận';
      case 'Unshipped': return 'Đang chuẩn bị';
      case 'Shipped': return 'Đang giao';
      case 'Complete': return 'Đã giao';
      case 'Canceled': return 'Đã hủy';
      default: return 'Khác';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return colors.warning;
      case 'Unshipped': return colors.info;
      case 'Shipped': return colors.secondary;
      case 'Complete': return colors.success;
      case 'Canceled': return colors.danger;
      default: return colors.text;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={18} color="#FFD700" style={{ marginRight: 2 }} />
      );
    }
    return <View style={{ flexDirection: 'row', marginVertical: 6 }}>{stars}</View>;
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'Tất cả') return true;
    if (activeTab === 'Đánh giá') return o.status === 'Complete';
    return getStatusText(o.status) === activeTab;
  });

  const renderItem = ({ item }: any) => {
    const statusText = getStatusText(item.status);
    const statusColor = getStatusColor(item.status);
    const firstItem = item.items?.[0];
    const itemsCount = item.items?.length || 0;
    const isExpanded = expandedOrders.includes(item.id);
    const displayItems = isExpanded ? (item.items || []) : ([firstItem].filter(Boolean));

    const isReviewed = item.items?.some((i: any) => reviewedOrders[`@reviewed_${item.id}_${i.productId}`]);

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
          {displayItems.map((prod: any, idx: number) => {
            const productImage = prod?.productImage ? resolveProductImageUrl(prod.productImage) : null;
            return (
              <TouchableOpacity
                key={idx}
                style={[st.orderBody, idx > 0 && { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              >
                <View style={st.imgWrap}>
                  {productImage ? (
                    <Image source={{ uri: productImage }} style={st.productImg} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={30} color={colors.textMuted} />
                  )}
                </View>
                <View style={st.orderInfo}>
                  <Text style={st.productName} numberOfLines={2}>{prod?.productName || 'Sản phẩm'}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>x{prod?.quantity}</Text>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{prod?.unitPrice?.toLocaleString('vi-VN')}đ</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {itemsCount > 1 && (
            <TouchableOpacity style={st.expandBtn} onPress={() => toggleExpand(item.id)}>
              <Text style={st.expandBtnText}>{isExpanded ? 'Thu gọn' : `Xem thêm ${itemsCount - 1} sản phẩm`}</Text>
              <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={st.orderFooter}>
          <Text style={st.totalText}>
            Thành tiền: <Text style={st.amount}>{item.totalAmount?.toLocaleString('vi-VN')}đ</Text>
          </Text>
        </View>

        <View style={st.orderActions}>
          {item.status === 'Complete' && (
            isReviewed ? (
              <TouchableOpacity style={st.actionBtn}
                onPress={() => handleViewReview(firstItem?.productId)}>
                <Text style={st.outlineBtnText}>Xem đánh giá</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[st.actionBtn, st.primaryBtn]}
                onPress={() => navigation.navigate('WriteReview', { 
                  productId: firstItem?.productId, 
                  orderId: item.id,
                  productName: firstItem?.productName,
                  productImage: firstItem?.productImage
                })}>
                <Text style={st.primaryBtnText}>Đánh Giá</Text>
              </TouchableOpacity>
            )
          )}
          {item.status === 'Shipped' && (
            <TouchableOpacity style={[st.actionBtn, st.primaryBtn]}
              onPress={() => navigation.navigate('ShipmentTracking', { orderId: item.id })}>
              <Text style={st.primaryBtnText}>Theo dõi Đơn</Text>
            </TouchableOpacity>
          )}
          {item.status === 'Pending' && (
            <TouchableOpacity style={[st.actionBtn, st.dangerBtn]}
              onPress={() => handleCancelOrder(item.id)}>
              <Text style={st.dangerBtnText}>Hủy Đơn</Text>
            </TouchableOpacity>
          )}
          {item.status === 'Canceled' && (
            <>
              <TouchableOpacity style={[st.actionBtn]}
                onPress={() => navigation.navigate('CancelOrderDetailScreen', { orderId: item.id })}>
                <Text style={st.outlineBtnText}>Chi tiết đơn hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.actionBtn, st.primaryBtn]}
                onPress={() => handleRepurchase(item.items)}>
                <Text style={st.primaryBtnText}>Mua lại</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status !== 'Canceled' && item.status !== 'Pending' && (
            <TouchableOpacity style={st.actionBtn}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
              <Text style={st.outlineBtnText}>Chi tiết</Text>
            </TouchableOpacity>
          )}
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
          horizontal showsHorizontalScrollIndicator={false}
          data={tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[st.tabItem, activeTab === item && st.tabItemActive]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[st.tabText, activeTab === item && st.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={i => i}
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={st.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[colors.primary]} />}
          ListEmptyComponent={() => (
            <View style={st.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={colors.border} />
              <Text style={st.emptyText}>Chưa có đơn hàng nào</Text>
            </View>
          )}
        />
      )}

      {/* Cancel Order Modal */}
      <Modal visible={isCancelModalVisible} animationType="slide" transparent={true}>
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
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={st.reasonItem} onPress={() => setCancelReason(item)}>
                  <Text style={st.reasonText}>{item}</Text>
                  <Ionicons name={cancelReason === item ? 'radio-button-on' : 'radio-button-off'} size={24} color={cancelReason === item ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[st.actionBtn, st.dangerBtn, st.modalConfirmBtn]} onPress={handleConfirmCancel}>
              <Text style={st.dangerBtnText}>Xác nhận hủy đơn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Review Details Modal */}
      <Modal visible={isReviewModalVisible} animationType="slide" transparent={true}>
        <View style={st.modalOverlay}>
          <TouchableOpacity style={st.modalBackdrop} onPress={() => setReviewModalVisible(false)} />
          <View style={[st.modalContent, { height: Dimensions.get('window').height * 0.45 }]}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Đánh giá của tôi</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isReviewLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.textSecondary }}>Đang tải đánh giá...</Text>
              </View>
            ) : selectedReview?.notFound ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
                <Text style={{ marginTop: 12, fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>Không tìm thấy đánh giá của bạn trên hệ thống.</Text>
              </View>
            ) : selectedReview?.error ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Ionicons name="warning-outline" size={48} color={colors.danger} />
                <Text style={{ marginTop: 12, fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>Có lỗi xảy ra khi tải thông tin đánh giá.</Text>
              </View>
            ) : selectedReview ? (
              <View style={{ flex: 1, paddingVertical: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Image source={{ uri: `https://i.pravatar.cc/150?u=${selectedReview.userId}` }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.borderLight, marginRight: 12 }} />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{selectedReview.userName || user?.fullName}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{new Date(selectedReview.createdAt).toLocaleDateString('vi-VN')} {new Date(selectedReview.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>

                {renderStars(selectedReview.rating)}

                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, flex: 1, marginTop: 10 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' }}>" {selectedReview.review || selectedReview.comment || 'Không có bình luận'} "</Text>
                </View>
              </View>
            ) : null}

            <TouchableOpacity style={[st.actionBtn, st.primaryBtn, { marginTop: 12, paddingVertical: 12, alignItems: 'center' }]} onPress={() => setReviewModalVisible(false)}>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  tabsContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tabItem: { paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

  listContent: { padding: spacing.sm },
  orderCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadow.sm, overflow: 'hidden' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shopName: { fontSize: 14, fontWeight: '600', color: colors.text },
  orderStatus: { fontSize: 13, fontWeight: '600' },

  orderBodyContainer: { paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginBottom: 12 },
  orderBody: { flexDirection: 'row' },
  imgWrap: { width: 70, height: 70, backgroundColor: colors.background, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  productImg: { width: '100%', height: '100%' },
  orderInfo: { flex: 1, justifyContent: 'space-between' },
  productName: { fontSize: 14, color: colors.text, lineHeight: 20 },
  itemCount: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  expandBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8, backgroundColor: colors.background, borderRadius: 6 },
  expandBtnText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

  orderFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  totalText: { fontSize: 14, color: colors.text },
  amount: { fontSize: 15, color: colors.primary, fontWeight: '700' },

  orderActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, gap: 10 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  primaryBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  primaryBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  outlineBtnText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  dangerBtn: { borderColor: colors.danger },
  dangerBtnText: { color: colors.danger, fontWeight: '600', fontSize: 13 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyText: { marginTop: 12, color: colors.textSecondary, fontSize: 16 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalContent: { backgroundColor: colors.white, height: Dimensions.get('window').height * 0.6, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  reasonItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  reasonText: { fontSize: 15, color: colors.text, flex: 1, marginRight: 10 },
  modalConfirmBtn: { marginTop: spacing.md, paddingVertical: 14, alignItems: 'center' },
});
