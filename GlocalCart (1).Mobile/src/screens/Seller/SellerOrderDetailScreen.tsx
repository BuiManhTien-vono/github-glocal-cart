import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { getOrderDisplayLabel, getShipmentBadgeLabel } from '../../utils/orderDisplayStatus';
import {
  onDeliveryRealtime,
  startDeliveryRealtime,
} from '../../services/realtime/deliveryRealtime';

const getOrderItems = (order: any) => order?.items || order?.orderItems || [];
const currency = (value: any) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

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

const statusColor = (label: string) => {
  if (label === 'Chờ xác nhận') return colors.warning;
  if (label === 'Chờ lấy hàng') return colors.info;
  if (label === 'Đang giao') return colors.primary;
  if (label === 'Đã giao') return colors.success;
  if (label === 'Đã hủy') return colors.danger;
  return colors.textSecondary;
};

export default function SellerOrderDetailScreen({ navigation, route }: any): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const orderId = route?.params?.orderId;
  const [order, setOrder] = useState<any>(route?.params?.order || null);
  const [loading, setLoading] = useState(!route?.params?.order);
  const [refreshing, setRefreshing] = useState(false);

  const items = useMemo(() => getOrderItems(order), [order]);
  const statusLabel = order ? getOrderDisplayLabel(order.status, order.shipment?.status) : '';
  const payment = order?.payment;
  const shipment = order?.shipment;
  const address = order?.shippingAddress;

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const data: any = await apiClient.get(`/orders/${orderId}`);
      setOrder(data);
    } catch (error) {
      console.warn('SellerOrderDetail fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!orderId) return;
    startDeliveryRealtime();
    const refreshIfCurrentOrder = (payload: any) => {
      if (!payload.orderId || String(payload.orderId) === String(orderId)) fetchOrder();
    };
    const offOrder = onDeliveryRealtime('OrderUpdated', refreshIfCurrentOrder);
    const offShipment = onDeliveryRealtime('ShipmentUpdated', refreshIfCurrentOrder);
    const offPayment = onDeliveryRealtime('PaymentUpdated', refreshIfCurrentOrder);
    return () => {
      offOrder();
      offShipment();
      offPayment();
    };
  }, [fetchOrder, orderId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="document-text-outline" size={56} color={colors.textMuted} />
        <Text style={styles.emptyText}>Không tìm thấy đơn hàng.</Text>
        <TouchableOpacity style={styles.backPrimaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backPrimaryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderNumber}>{order.orderNumber || `#${order.id}`}</Text>
              <Text style={styles.mutedText}>Tạo lúc {formatTime(order.orderDate)}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor(statusLabel)}18` }]}>
              <Text style={[styles.statusText, { color: statusColor(statusLabel) }]}>{statusLabel}</Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thu</Text>
            <Text style={styles.totalValue}>{currency(order.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Người mua</Text>
          <InfoRow icon="person-outline" label="Tên" value={order.buyerName || `ID: ${order.buyerId || 'N/A'}`} />
          {!!order.note && <InfoRow icon="chatbox-ellipses-outline" label="Ghi chú" value={order.note} />}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sản phẩm trong đơn</Text>
          {items.map((item: any) => {
            const imageUri = resolveProductImageUrl(item.productImage);
            return (
              <View key={item.id || item.productId} style={styles.itemRow}>
                <View style={styles.itemImageWrap}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.productName || 'Sản phẩm'}</Text>
                  <Text style={styles.mutedText}>SL: {item.quantity} x {currency(item.unitPrice)}</Text>
                </View>
                <Text style={styles.itemSubtotal}>{currency(item.subtotal ?? Number(item.unitPrice || 0) * Number(item.quantity || 0))}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vận đơn</Text>
          {shipment ? (
            <>
              <InfoRow icon="receipt-outline" label="Mã vận đơn" value={shipment.trackingNumber || `#${shipment.id}`} />
              <InfoRow icon="business-outline" label="Đơn vị" value={shipment.shipmentMethod || 'Chưa cập nhật'} />
              <InfoRow icon="flag-outline" label="Trạng thái" value={shipment.status ? getShipmentBadgeLabel(shipment.status) : 'Chưa cập nhật'} />
              <InfoRow icon="time-outline" label="Tạo vận đơn" value={formatTime(shipment.shipmentDate)} />
              <InfoRow icon="person-outline" label="Shipper" value={shipment.shipperName || 'Chưa có shipper nhận đơn'} />
              {!!shipment.shipperPhone && <InfoRow icon="call-outline" label="SĐT shipper" value={shipment.shipperPhone} />}
              {!!shipment.deliveredAt && <InfoRow icon="checkmark-circle-outline" label="Đã giao lúc" value={formatTime(shipment.deliveredAt)} />}
            </>
          ) : (
            <Text style={styles.emptyInline}>Đơn hàng chưa tạo vận đơn.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          <InfoRow icon="location-outline" label="Địa chỉ" value={[
            address?.streetAddress,
            address?.city,
            address?.state,
            address?.zipcode,
            address?.country,
          ].filter(Boolean).join(', ') || 'Chưa cập nhật'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <InfoRow icon="card-outline" label="Phương thức" value={payment?.method || order.paymentMethod || 'Chưa cập nhật'} />
          <InfoRow icon="wallet-outline" label="Trạng thái" value={payment?.status || 'Chưa cập nhật'} />
          <InfoRow icon="cash-outline" label="Tiền hàng" value={currency(order.totalAmount)} />
          <InfoRow icon="bicycle-outline" label="Phí giao" value={currency(order.shippingFee)} />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  emptyText: { marginTop: 12, color: colors.textSecondary, fontSize: 15 },
  backPrimaryBtn: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
  backPrimaryText: { color: colors.white, fontWeight: '700' },
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
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  orderNumber: { color: colors.text, fontSize: 17, fontWeight: '900' },
  mutedText: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '800' },
  totalRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { color: colors.textSecondary, fontSize: 14 },
  totalValue: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  infoLabel: { width: 88, color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  infoValue: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  itemImageWrap: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 10 },
  itemImage: { width: '100%', height: '100%' },
  itemInfo: { flex: 1 },
  itemName: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  itemSubtotal: { color: colors.primary, fontSize: 13, fontWeight: '800', marginLeft: 8 },
  emptyInline: { color: colors.textSecondary, fontSize: 13 },
});
