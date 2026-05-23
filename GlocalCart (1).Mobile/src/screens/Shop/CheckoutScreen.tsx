import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Image, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import { useCartStore } from '../../store/useCartStore';
import apiClient from '../../services/api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../../components/common/Loading';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { notificationHelper } from '../../utils/notificationHelper';
import { paymentApi, PaymentInitiateResponse } from '../../services/api/paymentApi';

const BANK_STORAGE_KEY = '@glocal_bank_accounts';
const isWeb = Platform.OS === 'web';

function showAlert(title: string, message: string) {
  if (isWeb) {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function CheckoutScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, clearCart, removeFromCart, fetchCart } = useCartStore();

  const checkoutItems = useMemo(() => {
    const selected = route.params?.selectedItems;
    if (selected?.length) return selected;
    return items;
  }, [items, route.params?.selectedItems]);

  const checkoutTotalAmount = useMemo(
    () => checkoutItems.reduce((sum: number, item: any) => sum + (item.priceSnapshot || 0) * (item.quantity || 1), 0),
    [checkoutItems]
  );

  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [addressMode, setAddressMode] = useState('default');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Web QR Modal states
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<PaymentInitiateResponse | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [isConfirmingQr, setIsConfirmingQr] = useState(false);

  useEffect(() => {
    Promise.all([fetchCart(), fetchAddresses(), loadBankAccounts()]).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (route.params?.selectedAddress) setSelectedAddress(route.params.selectedAddress);
  }, [route.params?.selectedAddress]);

  const fetchAddresses = async () => {
    try {
      const data: any = await apiClient.get('/users/addresses');
      setAddresses(data || []);
      const def = data?.find((a: any) => a.isDefault);
      if (def) setSelectedAddress(def);
      else if (data?.length > 0) setSelectedAddress(data[0]);
    } catch { }
  };

  const loadBankAccounts = async () => {
    try {
      const stored = await AsyncStorage.getItem(BANK_STORAGE_KEY);
      if (stored) setBankAccounts(JSON.parse(stored));
    } catch { }
  };

  const shippingFee = 30000;
  const total = checkoutTotalAmount + shippingFee;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showAlert('Thông báo', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    if (selectedPayment === 'bank' && !selectedBank) {
      showAlert('Thông báo', 'Vui lòng chọn tài khoản ngân hàng để thanh toán.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      await fetchCart();
      const paymentMethodCode = selectedPayment === 'bank' ? 1 : 0;
      const orderData = {
        shippingAddressId: selectedAddress.id,
        paymentMethod: paymentMethodCode,
        note: `Giao hàng đến ${selectedAddress.fullName || user?.fullName}`,
        items: checkoutItems.map((item: any) => ({ productId: item.productId || item.id, quantity: item.quantity })),
      };

      const createdOrder: any = await apiClient.post('/orders', orderData);

      if (route.params?.isBuyNow) {
        // Không xóa giỏ hàng nếu mua ngay
      } else if (route.params?.selectedItems) {
        checkoutItems.forEach((item: any) => removeFromCart(item.id));
      } else {
        clearCart();
      }

      // Trigger notification for new order placed!
      if (createdOrder) {
        await notificationHelper.updateOrderNotification(
          createdOrder.orderNumber || `GLC${createdOrder.id}`,
          'Pending',
          checkoutItems[0]?.productName || 'Sản phẩm',
          checkoutItems[0]?.productImage
        );
      }

      if (paymentMethodCode === 1) {
        if (isWeb) {
          const qr = await paymentApi.initiate(createdOrder.id);
          setQrData(qr);
          setCreatedOrderId(createdOrder.id);
          setShowQrModal(true);
        } else {
          Alert.alert(
            '🎉 Đặt hàng thành công!',
            `Đơn hàng ${createdOrder.orderNumber || '#' + createdOrder.id} đã được tạo. Vui lòng tiến hành thanh toán để người bán xác nhận đơn.`,
            [{
              text: 'Thanh toán ngay',
              onPress: () => navigation.replace('VietQR', { orderId: createdOrder.id }),
            }],
            { cancelable: false }
          );
        }
      } else {
        const successMsg = `Đơn hàng ${createdOrder.orderNumber || '#' + createdOrder.id} đã được đặt.`;
        const navigateToMyOrders = () => {
          navigation.reset({
            index: 0,
            routes: [{
              name: 'MainTabs',
              state: {
                index: 3,
                routes: [
                  { name: 'Home' },
                  { name: 'Cart' },
                  { name: 'Notifications' },
                  {
                    name: 'Profile',
                    state: {
                      routes: [
                        { name: 'ProfileMain' },
                        { name: 'MyOrders', params: { activeTab: 'Chờ xác nhận' } },
                      ],
                    },
                  },
                ],
              },
            }],
          });
        };
        if (isWeb) {
          window.alert(`🎉 Đặt hàng thành công!\n${successMsg}`);
          navigateToMyOrders();
        } else {
          Alert.alert(
            '🎉 Đặt hàng thành công!',
            `${successMsg} Chúng tôi sẽ xác nhận trong thời gian sớm nhất!`,
            [{
              text: 'Xem đơn hàng',
              onPress: navigateToMyOrders,
            }],
            { cancelable: false }
          );
        }
      }
    } catch (error: any) {
      showAlert('Lỗi', error.message || 'Không thể đặt hàng. Vui lòng thử lại.');
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
      window.alert('Thanh toán thành công! Hệ thống đang chờ người bán xác nhận.');
      navigation.reset({
        index: 0,
        routes: [{
          name: 'MainTabs',
          state: {
            index: 3,
            routes: [
              { name: 'Home' },
              { name: 'Cart' },
              { name: 'Notifications' },
              {
                name: 'Profile',
                state: {
                  routes: [
                    { name: 'ProfileMain' },
                    { name: 'MyOrders', params: { activeTab: 'Chờ xác nhận' } },
                  ],
                },
              },
            ],
          },
        }],
      });
    } catch (error: any) {
      window.alert(error.message || 'Có lỗi xảy ra khi xác nhận. Vui lòng thử lại.');
    } finally {
      setIsConfirmingQr(false);
    }
  };

  if (isLoading) return <Loading />;

  const paymentMethods = [
    { key: 'cod', icon: 'cash-outline', label: 'Thanh toán khi nhận hàng (COD)', color: colors.success },
    { key: 'card', icon: 'card-outline', label: 'Thẻ Tín Dụng / Ghi Nợ', color: '#2563EB' },
    { key: 'bank', icon: 'business-outline', label: 'Tài khoản Ngân hàng', color: '#7C3AED' },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Thanh Toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={s.scrollView}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={s.scrollContent}
      >
        {/* Địa chỉ */}
        <TouchableOpacity style={s.card} activeOpacity={0.7}
          onPress={() => navigation.navigate('Addresses', { isSelecting: true })}>
          <View style={s.cardHeaderRow}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={s.cardTitle}>Địa chỉ nhận hàng</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" style={{ marginLeft: 'auto' }} />
          </View>
          {selectedAddress ? (
            <View style={s.addressBox}>
              <Text style={s.addressName}>{selectedAddress.fullName || user?.fullName} | {selectedAddress.phone || user?.phone}</Text>
              <Text style={s.addressText}>
                {[selectedAddress.street, selectedAddress.ward, selectedAddress.district, selectedAddress.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : (
            <Text style={[s.addressText, { color: colors.textMuted, paddingLeft: 28 }]}>Chưa chọn địa chỉ giao hàng</Text>
          )}
        </TouchableOpacity>

        <View style={s.stripe} />

        {/* Sản phẩm */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Sản phẩm ({checkoutItems.length})</Text>
          {checkoutItems.map((item: any, idx: number) => (
            <View key={item.id} style={[s.productRow, idx < checkoutItems.length - 1 && s.borderBottom]}>
              <View style={s.productImgWrap}>
                {item.productImage
                  ? <Image source={{ uri: resolveProductImageUrl(item.productImage) || undefined }} style={s.productImg} />
                  : <Ionicons name="cube-outline" size={24} color={colors.textMuted} />}
              </View>
              <View style={s.productInfo}>
                <Text style={s.productName} numberOfLines={2}>{item.productName}</Text>
                <View style={s.priceRow}>
                  <Text style={s.productPrice}>{item.priceSnapshot.toLocaleString('vi-VN')}đ</Text>
                  <Text style={s.productQty}>x{item.quantity}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Phương thức thanh toán */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Phương thức thanh toán</Text>
          {paymentMethods.map((pm, idx) => (
            <TouchableOpacity
              key={pm.key}
              style={[s.paymentRow, selectedPayment === pm.key && s.paymentRowActive,
              idx === paymentMethods.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => setSelectedPayment(pm.key)}
            >
              <Ionicons name={pm.icon as any} size={22} color={selectedPayment === pm.key ? pm.color : '#999'} />
              <Text style={[s.paymentText, selectedPayment === pm.key && { color: pm.color, fontWeight: '700' }]}>
                {pm.label}
              </Text>
              {selectedPayment === pm.key
                ? <Ionicons name="checkmark-circle" size={22} color={pm.color} />
                : <Ionicons name="radio-button-off" size={22} color="#ddd" />}
            </TouchableOpacity>
          ))}

          {/* Chọn bank account nếu chọn 'bank' */}
          {selectedPayment === 'bank' && (
            <View style={s.bankPicker}>
              {bankAccounts.length === 0 ? (
                <TouchableOpacity style={s.addBankBtn}
                  onPress={() => navigation.navigate('AccountSettings')}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 14 }}>Thêm tài khoản ngân hàng</Text>
                </TouchableOpacity>
              ) : (
                bankAccounts.map((b, i) => (
                  <TouchableOpacity key={i} style={[s.bankItem, selectedBank?.id === b.id && s.bankItemActive]}
                    onPress={() => setSelectedBank(b)}>
                    <Ionicons name="card" size={20} color={selectedBank?.id === b.id ? colors.primary : '#999'} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={s.bankName}>{b.bankName}</Text>
                      <Text style={s.bankNumber}>**** {b.accountNumber?.slice(-4)}</Text>
                    </View>
                    {selectedBank?.id === b.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Tổng tiền */}
        <View style={s.card}>
          {[
            { label: 'Tổng tiền hàng', value: checkoutTotalAmount },
            { label: 'Phí vận chuyển', value: shippingFee },
          ].map(row => (
            <View key={row.label} style={s.summaryRow}>
              <Text style={s.summaryLabel}>{row.label}</Text>
              <Text style={s.summaryValue}>{row.value.toLocaleString('vi-VN')}đ</Text>
            </View>
          ))}
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>Tổng thanh toán</Text>
            <Text style={s.totalValue}>{total.toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View
        style={[
          s.bottomBar,
          isWeb && ({
            position: 'sticky',
            bottom: 0,
            zIndex: 100,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
          } as object),
          {
            paddingBottom: isWeb ? 16 : Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : insets.bottom + 12,
          },
        ]}
      >
        <View style={s.bottomLeft}>
          <Text style={s.bottomLabel}>Tổng thanh toán</Text>
          <Text style={s.bottomPrice}>{total.toLocaleString('vi-VN')}đ</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            s.orderBtn,
            isWeb && ({ cursor: 'pointer' } as object),
            isPlacingOrder && s.orderBtnDisabled,
            pressed && !isPlacingOrder && s.orderBtnPressed,
          ]}
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
          accessibilityRole="button"
          accessibilityLabel="Đặt hàng"
        >
          <Text style={s.orderBtnText}>{isPlacingOrder ? 'Đang đặt...' : 'Đặt Hàng'}</Text>
        </Pressable>
      </View>

      {/* Web QR Modal */}
      {Platform.OS === 'web' && qrData && (
        <Modal visible={showQrModal} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Thanh toán VietQR</Text>
                <TouchableOpacity onPress={() => setShowQrModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <Text style={s.instructionTitle}>Quét mã QR để thanh toán</Text>
              <Text style={s.instructionText}>Sử dụng ứng dụng ngân hàng của bạn để quét mã QR bên dưới.</Text>
              
              <View style={s.qrContainer}>
                <Image source={{ uri: qrData.vietQrUrl }} style={s.qrImage} resizeMode="contain" />
              </View>

              <View style={s.infoBox}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Số tiền:</Text>
                  <Text style={s.infoValueHighlight}>{qrData.amount.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Nội dung CK:</Text>
                  <Text style={s.infoValue}>Thanh toan {qrData.orderId}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[s.primaryBtn, isConfirmingQr && { opacity: 0.7 }]} 
                onPress={handleConfirmWebQr}
                disabled={isConfirmingQr}
              >
                <Text style={s.primaryBtnText}>
                  {isConfirmingQr ? 'Đang xử lý...' : 'Tôi đã chuyển khoản'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  backBtn: { padding: 8, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: isWeb ? 24 : 40, flexGrow: 1 },

  card: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  stripe: { height: 4, backgroundColor: colors.primary + '20', marginBottom: 8 },

  addressBox: { paddingLeft: 28 },
  addressName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  addressText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  productRow: { flexDirection: 'row', paddingVertical: 12 },
  borderBottom: { borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  productImgWrap: {
    width: 60, height: 60, backgroundColor: '#f5f5f5', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden',
  },
  productImg: { width: '100%', height: '100%' },
  productInfo: { flex: 1, justifyContent: 'space-between' },
  productName: { fontSize: 14, color: colors.text, fontWeight: '500' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  productQty: { fontSize: 13, color: colors.textSecondary },

  paymentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0',
  },
  paymentRowActive: { backgroundColor: '#FFFAF9' },
  paymentText: { flex: 1, fontSize: 15, color: colors.text },

  bankPicker: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
  addBankBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  bankItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee',
    marginBottom: 8, backgroundColor: '#fafafa',
  },
  bankItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  bankName: { fontSize: 14, fontWeight: '600', color: '#333' },
  bankNumber: { fontSize: 12, color: '#999', marginTop: 2 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
  totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#eee' },
  totalLabel: { fontSize: 16, color: colors.text, fontWeight: '700' },
  totalValue: { fontSize: 18, color: colors.primary, fontWeight: '800' },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    minHeight: 72,
  },
  bottomLeft: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  bottomLabel: { fontSize: 12, color: colors.textSecondary },
  bottomPrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
  orderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    minWidth: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBtnPressed: { opacity: 0.85 },
  orderBtnDisabled: { opacity: 0.6 },
  orderBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Web Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400, ...shadow.sm },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  instructionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  instructionText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  qrContainer: { width: 200, height: 200, alignSelf: 'center', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 24, padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 12 },
  qrImage: { width: '100%', height: '100%' },
  infoBox: { backgroundColor: colors.background, padding: 16, borderRadius: 8, gap: 12, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  infoValueHighlight: { fontSize: 18, fontWeight: '700', color: colors.primary },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center', paddingVertical: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
