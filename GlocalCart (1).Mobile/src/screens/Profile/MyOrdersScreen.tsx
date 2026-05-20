import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import {
  BUYER_ORDER_TABS,
  getOrderDisplayLabel,
  matchesTabLabel,
} from '../../utils/orderDisplayStatus';

// Xóa mock data cứng, nếu rỗng thì mảng rỗng

export default function MyOrdersScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const initialTab = route.params?.activeTab || 'Tất cả';
  const newOrderFromCheckout = route.params?.newOrder;

  const tabs = BUYER_ORDER_TABS;
  const [activeTab, setActiveTab] = useState(
    tabs.includes(initialTab) ? initialTab : 'Tất cả'
  );
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Trạng thái cho Modal Thanh Toán
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [confirmReceiptVisible, setConfirmReceiptVisible] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmReceipt = async (order: any) => {
    try {
      const result: any = await apiClient.post(`/orders/${order.id}/confirm-receipt`);
      if (result?.requiresPayment) {
        setConfirmReceiptVisible(false);
        handleOpenPaymentModal(order);
        return;
      }
      Alert.alert('Thành công', result?.message || 'Đã xác nhận nhận hàng.');
      setConfirmReceiptVisible(false);
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể xác nhận nhận hàng');
    }
  };

  const handleOpenConfirmReceipt = (order: any) => {
    setSelectedOrderForReceipt(order);
    setConfirmReceiptVisible(true);
  };

  const handleOpenPaymentModal = (order: any) => {
    setSelectedOrderForPayment(order);
    setSelectedMethod('Cash');
    setPaymentModalVisible(true);
  };

  useEffect(() => {
    const orderIdParam = route.params?.openPaymentForOrderId ?? route.params?.openConfirmReceiptForOrderId;
    if (orderIdParam && orders.length > 0) {
      const order = orders.find(o => o.id === orderIdParam || o.orderNumber === orderIdParam);
      if (order) {
        if (route.params?.openConfirmReceiptForOrderId) {
          handleOpenConfirmReceipt(order);
        } else {
          handleOpenPaymentModal(order);
        }
      }
    }
  }, [route.params?.openPaymentForOrderId, route.params?.openConfirmReceiptForOrderId, orders]);

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

  const getStatusColor = (label: string) => {
    switch (label) {
      case 'Chờ xác nhận': return colors.warning;
      case 'Chờ lấy hàng': return colors.info;
      case 'Chờ giao hàng': return colors.secondary;
      case 'Đã giao': return colors.success;
      case 'Đã hủy': return colors.danger;
      default: return colors.text;
    }
  };

  const filteredOrders = orders.filter(o =>
    matchesTabLabel(o.status, o.shipment?.status, activeTab)
  );

  const renderItem = ({ item }: any) => {
    const statusText = getOrderDisplayLabel(item.status, item.shipment?.status);
    const statusColor = getStatusColor(statusText);
    const isArrived = item.shipment?.status === 'Arrived';
    const firstItem = item.items?.[0] || item.orderItems?.[0];
    const itemsCount = item.items?.length || item.orderItems?.length || 0;
    const productImage = firstItem?.productImage
      ? resolveProductImageUrl(firstItem.productImage)
      : null;

    return (
      <View style={st.orderCard}>
        <View style={st.orderHeader}>
          <View style={st.shopRow}>
            <Ionicons name="receipt-outline" size={15} color={colors.textSecondary} />
            <Text style={st.shopName}>Đơn hàng: {item.orderNumber}</Text>
          </View>
          <Text style={[st.orderStatus, { color: statusColor }]}>{statusText}</Text>
        </View>

        <TouchableOpacity
          style={st.orderBody}
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
            <Text style={st.productName} numberOfLines={2}>{firstItem?.productName || 'Sản phẩm'}</Text>
            {firstItem && (
              <Text style={st.itemPrice}>{(firstItem.unitPrice ?? firstItem.priceSnapshot ?? 0).toLocaleString('vi-VN')}đ x{firstItem.quantity}</Text>
            )}
            {itemsCount > 1 && (
              <Text style={st.itemCount}>và {itemsCount - 1} sản phẩm khác...</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={st.orderFooter}>
          <Text style={st.totalText}>
            Thành tiền: <Text style={st.amount}>{item.totalAmount?.toLocaleString('vi-VN')}đ</Text>
          </Text>
        </View>

        <View style={st.orderActions}>
          {item.status === 'Complete' && (
            <TouchableOpacity style={[st.actionBtn, st.primaryBtn]}
              onPress={() => navigation.navigate('WriteReview', { productId: firstItem?.productId, orderId: item.id })}>
              <Text style={st.primaryBtnText}>Đánh Giá</Text>
            </TouchableOpacity>
          )}
          {item.status === 'Shipped' && !isArrived && (
            <TouchableOpacity style={[st.actionBtn, st.primaryBtn]}
              onPress={() => navigation.navigate('OrderTracking', { notification: { title: 'Chờ giao hàng', orderId: item.orderNumber } })}>
              <Text style={st.primaryBtnText}>Theo dõi Đơn</Text>
            </TouchableOpacity>
          )}
          {isArrived && (
            <TouchableOpacity style={[st.actionBtn, st.primaryBtn]}
              onPress={() => handleOpenConfirmReceipt(item)}>
              <Text style={st.primaryBtnText}>Xác nhận nhận hàng</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={st.actionBtn}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
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

      {/* Modal xác nhận nhận hàng */}
      <Modal
        visible={confirmReceiptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmReceiptVisible(false)}
      >
        <View style={st.modalOverlay}>
          <View style={[st.modalContent, { borderRadius: 16, margin: 24 }]}>
            <Text style={st.modalTitle}>Xác nhận đã nhận hàng</Text>
            <Text style={{ color: colors.textSecondary, marginVertical: 12 }}>
              Shipper đã giao đơn #{selectedOrderForReceipt?.orderNumber} đến bạn. Bạn đã nhận đủ hàng chưa?
            </Text>
            <TouchableOpacity
              style={st.submitPayBtn}
              onPress={() => selectedOrderForReceipt && handleConfirmReceipt(selectedOrderForReceipt)}
            >
              <Text style={st.submitPayBtnText}>Đã nhận hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setConfirmReceiptVisible(false)}>
              <Text style={{ color: colors.textSecondary }}>Để sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Thanh Toán */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Thanh toán nhận hàng</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedOrderForPayment && (
              <View style={st.modalBody}>
                <Text style={st.orderCodeLabel}>Mã đơn hàng: <Text style={{fontWeight: '700'}}>{selectedOrderForPayment.orderNumber}</Text></Text>
                
                <View style={st.amountSection}>
                  <Text style={st.amountLabel}>Số tiền cần thanh toán</Text>
                  <Text style={st.amountValue}>{selectedOrderForPayment.totalAmount?.toLocaleString('vi-VN')}đ</Text>
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
                    <Text style={st.qrInstruction}>Quét mã để chuyển khoản cho Shipper</Text>
                    <Image
                      source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=GlocalCartPayOrder_${selectedOrderForPayment.orderNumber}` }}
                      style={st.qrImage}
                    />
                    <Text style={st.qrNote}>Nội dung chuyển khoản: <Text style={{fontWeight: '700'}}>{selectedOrderForPayment.orderNumber}</Text></Text>
                  </View>
                )}

                <TouchableOpacity
                  style={st.submitPayBtn}
                  onPress={async () => {
                    try {
                      if (selectedMethod === 'Cash') {
                        await apiClient.post(`/orders/${selectedOrderForPayment.id}/payment-method`, { method: 'Cash' });
                        Alert.alert('Thành công', 'Đã báo với Shipper bạn sẽ trả bằng Tiền mặt. Vui lòng thanh toán cho shipper khi nhận hàng.');
                      } else {
                        await apiClient.post(`/orders/${selectedOrderForPayment.id}/payment-method`, { method: 'Transfer' });
                        await apiClient.post(`/orders/${selectedOrderForPayment.id}/confirm-transfer`);
                        Alert.alert('Thành công', 'Đã báo với Shipper bạn chuyển khoản thành công. Vui lòng chờ shipper xác nhận.');
                      }
                      setPaymentModalVisible(false);
                      fetchOrders();
                    } catch (err: any) {
                      Alert.alert('Lỗi', err.message || 'Thao tác thất bại');
                    }
                  }}
                >
                  <Text style={st.submitPayBtnText}>Tôi đã thanh toán</Text>
                </TouchableOpacity>
              </View>
            )}
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
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shopName: { fontSize: 13, fontWeight: '700', color: colors.text },
  orderStatus: { fontSize: 12, fontWeight: '700' },

  orderBody: { flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  imgWrap: { width: 64, height: 64, backgroundColor: colors.background, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  productImg: { width: '100%', height: '100%' },
  orderInfo: { flex: 1 },
  productName: { fontSize: 14, color: colors.text, fontWeight: '500', marginBottom: 4 },
  itemPrice: { fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 2 },
  itemCount: { fontSize: 12, color: colors.textSecondary },

  orderFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  totalText: { fontSize: 14, color: colors.text },
  amount: { fontSize: 15, color: colors.primary, fontWeight: '700' },

  orderActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, gap: 10 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  primaryBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  primaryBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  outlineBtnText: { color: colors.text, fontWeight: '600', fontSize: 13 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyText: { marginTop: 12, color: colors.textSecondary, fontSize: 16 },

  // Styles cho Modal Thanh Toán
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.md, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 12, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBody: { gap: 12 },
  orderCodeLabel: { fontSize: 14, color: colors.textSecondary },
  amountSection: { backgroundColor: colors.background, padding: 16, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  amountLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  amountValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 8 },
  methodRow: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  methodBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  methodText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  methodTextActive: { color: colors.primary, fontWeight: '700' },
  qrSection: { alignItems: 'center', padding: 12, backgroundColor: colors.background, borderRadius: 10, marginVertical: 8 },
  qrInstruction: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  qrImage: { width: 180, height: 180, borderRadius: 8, marginBottom: 8 },
  qrNote: { fontSize: 12, color: colors.textSecondary },
  submitPayBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  submitPayBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
