import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import { useCartStore } from '../../store/useCartStore';
import apiClient from '../../services/api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../../components/common/Loading';
import { paymentApi, PaymentInitiateResponse } from '../../services/api/paymentApi';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { notificationHelper } from '../../utils/notificationHelper';

const isWeb = Platform.OS === 'web';

function showAlert(title: string, message: string) {
  if (isWeb) window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

const getItemPrice = (item: any) => Number(item.priceSnapshot ?? item.currentPrice ?? item.price ?? 0);
const getItemProductId = (item: any) => item.productId || item.id;

export default function CheckoutScreen({ navigation, route }: any): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, clearCart, fetchCart, removeFromCart } = useCartStore();

  const checkoutItems = useMemo(() => {
    const selected = route.params?.selectedItems;
    return selected?.length ? selected : items;
  }, [items, route.params?.selectedItems]);

  const checkoutSubtotal = useMemo(
    () => checkoutItems.reduce((sum: number, item: any) => sum + getItemPrice(item) * Number(item.quantity || 1), 0),
    [checkoutItems]
  );

  const [selectedPayment, setSelectedPayment] = useState<'cod' | 'bank'>('cod');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<PaymentInitiateResponse | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [isConfirmingQr, setIsConfirmingQr] = useState(false);

  const shippingFee = 30000;
  const total = checkoutSubtotal + shippingFee;

  const fetchAddresses = async () => {
    try {
      const data: any = await apiClient.get('/users/addresses');
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      const selected = route.params?.selectedAddress;
      const def = list.find((address: any) => address.isDefault);
      setSelectedAddress(selected || def || list[0] || null);
    } catch (error) {
      console.log('Checkout fetch addresses error:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchCart(), fetchAddresses()]).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (route.params?.selectedAddress) setSelectedAddress(route.params.selectedAddress);
  }, [route.params?.selectedAddress]);

  const navigateToOrderDetail = (orderId: number) => {
    navigation.navigate('MainTabs', {
      screen: 'Profile',
      params: { screen: 'OrderDetail', params: { orderId, fromPayment: true } },
    });
  };

  const clearPurchasedItems = async () => {
    if (route.params?.isBuyNow) return;
    if (route.params?.selectedItems?.length) {
      await Promise.all(route.params.selectedItems.map((item: any) => removeFromCart(item.id)));
      return;
    }
    await clearCart();
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showAlert('Thông báo', 'Vui lòng chọn địa chỉ giao hàng.');
      return;
    }
    if (!checkoutItems.length) {
      showAlert('Thông báo', 'Giỏ hàng của bạn đang trống.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const paymentMethodCode = selectedPayment === 'bank' ? 1 : 0;
      const orderData = {
        shippingAddressId: selectedAddress.id,
        paymentMethod: paymentMethodCode,
        note: `Giao hàng đến ${selectedAddress.fullName || user?.fullName || 'người nhận'}`,
        items: checkoutItems.map((item: any) => ({
          productId: getItemProductId(item),
          quantity: Number(item.quantity || 1),
        })),
      };

      const createdOrder: any = await apiClient.post('/orders', orderData);

      await notificationHelper.updateOrderNotification(
        createdOrder.orderNumber || `GC-${createdOrder.id}`,
        'Pending',
        checkoutItems[0]?.productName || checkoutItems[0]?.name || 'Sản phẩm',
        checkoutItems[0]?.productImage
      );

      await clearPurchasedItems();
      await fetchCart();

      if (paymentMethodCode === 1) {
        if (isWeb) {
          const qr = await paymentApi.initiate(createdOrder.id);
          setQrData(qr);
          setCreatedOrderId(createdOrder.id);
          setShowQrModal(true);
        } else {
          Alert.alert(
            'Đặt hàng thành công',
            `Đơn hàng ${createdOrder.orderNumber || '#' + createdOrder.id} đã được tạo. Vui lòng thanh toán để người bán xác nhận đơn.`,
            [{ text: 'Thanh toán ngay', onPress: () => navigation.replace('VietQR', { orderId: createdOrder.id }) }],
            { cancelable: false }
          );
        }
      } else if (isWeb) {
        window.alert(`Đặt hàng thành công!\nĐơn hàng ${createdOrder.orderNumber || '#' + createdOrder.id} đã được đặt.`);
        navigateToOrderDetail(createdOrder.id);
      } else {
        Alert.alert(
          'Đặt hàng thành công',
          `Đơn hàng ${createdOrder.orderNumber || '#' + createdOrder.id} đã được đặt.`,
          [{ text: 'Xem đơn hàng', onPress: () => navigateToOrderDetail(createdOrder.id) }],
          { cancelable: false }
        );
      }
    } catch (error: any) {
      showAlert('Lỗi', error?.message || 'Không thể đặt hàng. Vui lòng thử lại.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleConfirmWebQr = async () => {
    if (!createdOrderId) return;
    setIsConfirmingQr(true);
    try {
      await paymentApi.confirmTransfer(createdOrderId);
      setShowQrModal(false);
      window.alert('Thanh toán thành công. Hệ thống đang chờ người bán xác nhận.');
      navigateToOrderDetail(createdOrderId);
    } catch (error: any) {
      window.alert(error?.message || 'Có lỗi xảy ra khi xác nhận thanh toán.');
    } finally {
      setIsConfirmingQr(false);
    }
  };

  if (isLoading) return <Loading />;

  const paymentMethods = [
    { key: 'cod' as const, icon: 'cash-outline', label: 'Thanh toán khi nhận hàng (COD)', color: colors.success },
    { key: 'bank' as const, icon: 'qr-code-outline', label: 'Chuyển khoản qua VietQR', color: colors.secondary },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <TouchableOpacity
          style={s.card}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Addresses', { isSelecting: true })}
        >
          <View style={s.cardHeaderRow}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={s.cardTitle}>Địa chỉ nhận hàng</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
          </View>
          {selectedAddress ? (
            <View style={s.addressBox}>
              <Text style={s.addressName}>
                {selectedAddress.fullName || user?.fullName} | {selectedAddress.phone || user?.phone}
              </Text>
              <Text style={s.addressText}>
                {[
                  selectedAddress.streetAddress || selectedAddress.street,
                  selectedAddress.ward,
                  selectedAddress.district || selectedAddress.state,
                  selectedAddress.city,
                  selectedAddress.zipcode,
                  selectedAddress.country,
                ].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : (
            <Text style={[s.addressText, { color: colors.textMuted, paddingLeft: 28 }]}>Chưa chọn địa chỉ giao hàng</Text>
          )}
        </TouchableOpacity>

        <View style={s.card}>
          <Text style={s.cardTitle}>Sản phẩm ({checkoutItems.length})</Text>
          {checkoutItems.map((item: any, idx: number) => {
            const image = item.productImage ? resolveProductImageUrl(item.productImage) : null;
            return (
              <View key={`${item.id}_${idx}`} style={[s.productRow, idx < checkoutItems.length - 1 && s.borderBottom]}>
                <View style={s.productImgWrap}>
                  {image ? (
                    <Image source={{ uri: image }} style={s.productImg} />
                  ) : (
                    <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
                  )}
                </View>
                <View style={s.productInfo}>
                  <Text style={s.productName} numberOfLines={2}>{item.productName || item.name}</Text>
                  <View style={s.priceRow}>
                    <Text style={s.productPrice}>{getItemPrice(item).toLocaleString('vi-VN')}đ</Text>
                    <Text style={s.productQty}>x{item.quantity}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Phương thức thanh toán</Text>
          {paymentMethods.map((pm, idx) => (
            <TouchableOpacity
              key={pm.key}
              style={[s.paymentRow, selectedPayment === pm.key && s.paymentRowActive, idx === paymentMethods.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => setSelectedPayment(pm.key)}
            >
              <Ionicons name={pm.icon as any} size={22} color={selectedPayment === pm.key ? pm.color : colors.textMuted} />
              <Text style={[s.paymentText, selectedPayment === pm.key && { color: pm.color, fontWeight: '700' }]}>
                {pm.label}
              </Text>
              {selectedPayment === pm.key ? (
                <Ionicons name="checkmark-circle" size={22} color={pm.color} />
              ) : (
                <Ionicons name="radio-button-off" size={22} color={colors.border} />
              )}
            </TouchableOpacity>
          ))}
          {selectedPayment === 'bank' && (
            <View style={s.bankHint}>
              <Text style={s.bankHintText}>Hệ thống sẽ tạo mã VietQR để bạn thanh toán bằng ứng dụng ngân hàng.</Text>
            </View>
          )}
        </View>

        <View style={s.card}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tổng tiền hàng</Text>
            <Text style={s.summaryValue}>{checkoutSubtotal.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Phí vận chuyển</Text>
            <Text style={s.summaryValue}>{shippingFee.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>Tổng thanh toán</Text>
            <Text style={s.totalValue}>{total.toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : insets.bottom + 12 }]}>
        <View style={s.bottomLeft}>
          <Text style={s.bottomLabel}>Tổng thanh toán</Text>
          <Text style={s.bottomPrice}>{total.toLocaleString('vi-VN')}đ</Text>
        </View>
        <Pressable
          style={({ pressed }) => [s.orderBtn, isPlacingOrder && s.orderBtnDisabled, pressed && !isPlacingOrder && s.orderBtnPressed]}
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
        >
          {isPlacingOrder ? <ActivityIndicator color={colors.white} /> : <Text style={s.orderBtnText}>Đặt hàng</Text>}
        </Pressable>
      </View>

      {Platform.OS === 'web' && qrData && (
        <Modal visible={showQrModal} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Quét mã VietQR</Text>
              <Image source={{ uri: qrData.vietQrUrl }} style={s.qrImage} resizeMode="contain" />
              <Text style={s.modalAmount}>{Number(qrData.amount || total).toLocaleString('vi-VN')}đ</Text>
              <Text style={s.modalHint}>Sau khi chuyển khoản, bấm xác nhận để cập nhật trạng thái thanh toán.</Text>
              <TouchableOpacity style={s.confirmBtn} onPress={handleConfirmWebQr} disabled={isConfirmingQr}>
                <Text style={s.confirmBtnText}>{isConfirmingQr ? 'Đang xác nhận...' : 'Tôi đã chuyển khoản'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowQrModal(false)}>
                <Text style={s.cancelBtnText}>Để sau</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.sm, paddingBottom: 120 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginLeft: 8 },
  addressBox: { paddingLeft: 28 },
  addressName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  addressText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  productRow: { flexDirection: 'row', paddingVertical: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  productImgWrap: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 12 },
  productImg: { width: '100%', height: '100%' },
  productInfo: { flex: 1, justifyContent: 'space-between' },
  productName: { fontSize: 14, color: colors.text, fontWeight: '600', lineHeight: 19 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 14, color: colors.primary, fontWeight: '800' },
  productQty: { fontSize: 13, color: colors.textSecondary },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  paymentRowActive: { backgroundColor: colors.primaryBg, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 },
  paymentText: { flex: 1, fontSize: 14, color: colors.text },
  bankHint: { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, marginTop: 8 },
  bankHintText: { fontSize: 12, color: colors.secondary, lineHeight: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  totalLabel: { fontSize: 15, color: colors.text, fontWeight: '800' },
  totalValue: { fontSize: 18, color: colors.primary, fontWeight: '900' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    ...shadow.lg,
  },
  bottomLeft: { flex: 1 },
  bottomLabel: { fontSize: 12, color: colors.textSecondary },
  bottomPrice: { fontSize: 18, color: colors.primary, fontWeight: '900', marginTop: 2 },
  orderBtn: { minWidth: 130, height: 44, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  orderBtnDisabled: { opacity: 0.7 },
  orderBtnPressed: { transform: [{ scale: 0.98 }] },
  orderBtnText: { color: colors.white, fontSize: 15, fontWeight: '800', textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: colors.white, borderRadius: 16, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 14 },
  qrImage: { width: 240, height: 240, marginBottom: 10 },
  modalAmount: { fontSize: 22, fontWeight: '900', color: colors.primary },
  modalHint: { marginTop: 8, fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  confirmBtn: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'stretch', alignItems: 'center' },
  confirmBtnText: { color: colors.white, fontWeight: '800' },
  cancelBtn: { marginTop: 12 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
});
