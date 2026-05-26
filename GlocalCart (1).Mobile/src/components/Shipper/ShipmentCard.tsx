import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Shipment } from '../../services/api/shipperService';
import { getShipmentBadgeLabel } from '../../utils/orderDisplayStatus';

interface ShipmentCardProps {
  shipment: Shipment;
  onPress: () => void;
  onAction?: () => void;
  actionText?: string;
  actionColor?: string;
  actionDisabled?: boolean;
  countdownLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionText?: string;
  secondaryActionColor?: string;
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const isCodShipment = (shipment: Shipment) =>
  shipment.paymentMethod === 'CashOnDelivery'
  || shipment.paymentMethod === 'CreditCard'
  || shipment.paymentStatus !== 'Completed';

export const ShipmentCard: React.FC<ShipmentCardProps> = ({
  shipment,
  onPress,
  onAction,
  actionText,
  actionColor = colors.primary,
  actionDisabled = false,
  countdownLabel,
  onSecondaryAction,
  secondaryActionText,
  secondaryActionColor = colors.secondary,
}) => {
  const isCOD = isCodShipment(shipment);
  const badgeLabel = getShipmentBadgeLabel(shipment.shipmentStatus);

  const openMap = () => {
    if (!shipment.deliveryAddress) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shipment.deliveryAddress)}`;
    Linking.openURL(url);
  };

  const callBuyer = () => {
    if (shipment.buyerPhone) Linking.openURL(`tel:${shipment.buyerPhone}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.orderNumber}>#{shipment.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, isCOD ? styles.statusCOD : styles.statusPaid]}>
          <Text style={[styles.statusText, isCOD ? styles.statusCODText : styles.statusPaidText]}>
            {badgeLabel}
          </Text>
        </View>
      </View>

      <View style={styles.routeBox}>
        <View style={styles.routePoint}>
          <Ionicons name="storefront-outline" size={16} color={colors.secondary} />
          <Text style={styles.routeText} numberOfLines={1}>
            {shipment.pickupAddress || 'Điểm lấy hàng tại shop'}
          </Text>
        </View>
        <View style={styles.routePoint}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.routeText} numberOfLines={2}>{shipment.deliveryAddress}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Khoảng cách</Text>
          <Text style={styles.infoValue}>{shipment.distanceKm?.toFixed?.(1) || '--'} km</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tiền ship</Text>
          <Text style={styles.infoValue}>{formatCurrency(shipment.shippingFee)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{isCOD ? 'Cần thu COD' : 'Giá trị đơn'}</Text>
          <Text style={[styles.infoValue, isCOD && styles.amountCOD]}>
            {formatCurrency(shipment.totalAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.buyerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.buyerName}>{shipment.buyerName || 'Người nhận'}</Text>
          <Text style={styles.buyerPhone}>{shipment.buyerPhone || 'Chưa có số điện thoại'}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={callBuyer}>
          <Ionicons name="call" size={18} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={openMap}>
          <Ionicons name="map" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {countdownLabel && (
        <View style={styles.countdownRow}>
          <Ionicons name="timer-outline" size={16} color={colors.warning} />
          <Text style={styles.countdownText}>{countdownLabel}</Text>
        </View>
      )}

      {(onAction || onSecondaryAction) && (
        <View style={styles.actionsContainer}>
          {onSecondaryAction && secondaryActionText && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn, { borderColor: secondaryActionColor }]}
              onPress={onSecondaryAction}
            >
              <Text style={[styles.secondaryBtnText, { color: secondaryActionColor }]}>
                {secondaryActionText}
              </Text>
            </TouchableOpacity>
          )}
          {onAction && actionText && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.primaryBtn,
                { backgroundColor: actionDisabled ? colors.disabled : actionColor },
              ]}
              onPress={onAction}
              disabled={actionDisabled}
            >
              <Text style={styles.actionBtnText}>{actionText}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderIdContainer: { flexDirection: 'row', alignItems: 'center' },
  orderNumber: { fontSize: 16, fontWeight: '800', color: colors.text, marginLeft: 8 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '800' },
  statusCOD: { backgroundColor: '#FFF3E0' },
  statusCODText: { color: '#E65100' },
  statusPaid: { backgroundColor: '#E8F5E9' },
  statusPaidText: { color: '#2E7D32' },
  routeBox: { backgroundColor: colors.background, borderRadius: 10, padding: 10, gap: 8 },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  routeText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  infoGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  infoItem: { flex: 1, backgroundColor: '#FAFAFA', borderRadius: 10, padding: 9 },
  infoLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 4 },
  infoValue: { color: colors.text, fontWeight: '800', fontSize: 12 },
  amountCOD: { color: colors.primary },
  buyerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  buyerName: { fontSize: 14, fontWeight: '700', color: colors.text },
  buyerPhone: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  countdownText: { fontSize: 13, color: colors.warning, fontWeight: '700' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: {},
  secondaryBtn: { backgroundColor: '#FFF', borderWidth: 1 },
  actionBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  secondaryBtnText: { fontWeight: '800', fontSize: 13 },
});
