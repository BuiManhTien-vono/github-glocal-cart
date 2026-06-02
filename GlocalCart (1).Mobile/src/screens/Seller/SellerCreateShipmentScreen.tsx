import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { ORDER_TAB_LABELS } from '../../utils/orderDisplayStatus';

const SHIPPING_METHOD = 'Giao Hang Nhanh';

const formatCurrency = (value: any) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const buildAddressText = (address: any) =>
  [
    address?.streetAddress,
    address?.city,
    address?.state,
    address?.zipcode,
    address?.country,
  ].filter(Boolean).join(', ');

const canPushToShipper = (order: any) => {
  const method = order?.payment?.method || order?.paymentMethod;
  const status = order?.payment?.status || order?.paymentStatus;
  return method === 'CashOnDelivery' || method === 'CreditCard' || status === 'Completed';
};

const showMessage = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

export default function SellerCreateShipmentScreen({ route, navigation }: any) {
  const { orderId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await apiClient.get(`/orders/${orderId}`);
        setOrder(data);
      } catch (error) {
        console.warn('Fetch order error:', error);
        showMessage('Lỗi', 'Không thể tải thông tin đơn hàng.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [navigation, orderId]);

  const handleCreateShipment = async () => {
    if (order?.shipment) {
      showMessage('Đã có vận đơn', 'Đang chờ shipper.');
      return;
    }

    if (!canPushToShipper(order)) {
      showMessage(
        'Chưa thể đẩy đơn',
        'Đơn chuyển khoản cần được xác nhận thanh toán trước khi đẩy cho shipper.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/orders/${orderId}/shipment`, {
        shipmentMethod: SHIPPING_METHOD,
      });

      showMessage('Thành công', 'Đã đẩy đơn cho shipper.');
      navigation.navigate('MainTabs', {
        screen: 'Orders',
        params: { activeTab: ORDER_TAB_LABELS.waitingPickup },
      });
    } catch (error: any) {
      showMessage('Lỗi', error?.message || 'Không thể đẩy đơn cho shipper.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) return null;

  const address = order.shippingAddress;
  const items = order.items || order.orderItems || [];
  const recipientName = order.buyerName || order.customerName || 'Người nhận';
  const deliveryAddress = buildAddressText(address) || 'Chưa cập nhật địa chỉ giao hàng';
  const paymentMethod = order.payment?.method || order.paymentMethod || 'Chưa cập nhật';
  const paymentStatus = order.payment?.status || order.paymentStatus || 'Chưa cập nhật';
  const isReadyToPush = canPushToShipper(order) && !order.shipment;
  const submitText = order.shipment
    ? 'Đã tạo vận đơn'
    : isReadyToPush
      ? 'Đẩy đơn cho shipper'
      : 'Chờ thanh toán';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đẩy đơn cho shipper</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <SectionTitle icon="receipt-outline" title="Thông tin đơn hàng" color={colors.primary} />
          <InfoRow label="Mã đơn" value={order.orderNumber || `#${order.id}`} />
          <InfoRow label="Ngày đặt" value={new Date(order.orderDate).toLocaleString('vi-VN')} />
          <InfoRow label="Tổng thu" value={formatCurrency(order.totalAmount)} highlight />
          <InfoRow label="Thanh toán" value={`${paymentMethod} / ${paymentStatus}`} />
        </View>

        <View style={styles.card}>
          <SectionTitle icon="location-outline" title="Điểm giao hàng" color={colors.secondary} />
          <Text style={styles.addressName}>{recipientName}</Text>
          <Text style={styles.addressText}>{deliveryAddress}</Text>
        </View>

        <View style={styles.card}>
          <SectionTitle icon="cube-outline" title={`Sản phẩm (${items.length})`} color={colors.success} />
          {items.map((item: any, index: number) => {
            const imageUri = resolveProductImageUrl(item.productImage);
            return (
              <View key={`${item.id || item.productId}_${index}`} style={styles.productRow}>
                <View style={styles.productImgWrap}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.productImg} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.productName || 'Sản phẩm'}</Text>
                  <Text style={styles.productPrice}>
                    {formatCurrency(item.unitPrice)} x {item.quantity || 1}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <SectionTitle icon="send-outline" title="Trạng thái đẩy đơn" color={colors.warning} />
          <View style={[styles.statusBox, isReadyToPush ? styles.statusReady : styles.statusBlocked]}>
            <Ionicons
              name={isReadyToPush ? 'checkmark-circle' : 'time-outline'}
              size={20}
              color={isReadyToPush ? colors.success : colors.warning}
            />
            <Text style={[styles.statusText, { color: isReadyToPush ? colors.success : colors.warning }]}>
              {isReadyToPush
                ? 'Sẵn sàng đẩy đơn'
                : submitText}
            </Text>
          </View>
          <View style={styles.shippingMethod}>
            <Ionicons name="bicycle-outline" size={20} color={colors.primary} />
            <Text style={styles.shippingMethodText}>{SHIPPING_METHOD}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, (!isReadyToPush || submitting) && styles.submitBtnDisabled]}
          onPress={handleCreateShipment}
          disabled={!isReadyToPush || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>{submitText}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SectionTitle({ icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <View style={styles.cardHeader}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    ...shadow.sm,
    zIndex: 10,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 16,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { flex: 1, textAlign: 'right', fontSize: 14, color: colors.text, fontWeight: '600' },
  valueHighlight: { color: colors.primary, fontWeight: '800' },
  addressName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  addressText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  productImgWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImg: { width: '100%', height: '100%' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4, lineHeight: 19 },
  productPrice: { fontSize: 13, color: colors.textSecondary },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusReady: { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  statusBlocked: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statusText: { flex: 1, fontSize: 13, fontWeight: '800' },
  shippingMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginTop: 12,
  },
  shippingMethodText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  footer: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadow.md,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnDisabled: { backgroundColor: colors.disabled, opacity: 0.9 },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
