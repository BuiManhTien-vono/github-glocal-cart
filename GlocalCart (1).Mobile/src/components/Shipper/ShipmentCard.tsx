import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const isCOD = shipment.paymentStatus !== 'Completed';
  const badgeLabel = getShipmentBadgeLabel(shipment.shipmentStatus);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
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

      <View style={styles.divider} />

      <View style={styles.body}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.buyerName}>{shipment.buyerName}</Text>
          <Text style={styles.buyerPhone}> - {shipment.buyerPhone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.addressText} numberOfLines={2}>{shipment.deliveryAddress}</Text>
        </View>

        {countdownLabel && (
          <View style={styles.infoRow}>
            <Ionicons name="timer-outline" size={16} color={colors.warning} />
            <Text style={styles.countdownText}>{countdownLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View>
          <Text style={styles.amountLabel}>{isCOD ? 'Cần thu tiền (COD)' : 'Tổng giá trị'}</Text>
          <Text style={[styles.amountValue, isCOD && styles.amountCOD]}>
            {formatCurrency(shipment.totalAmount)}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {onSecondaryAction && secondaryActionText && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: secondaryActionColor, marginRight: 8 }]}
              onPress={onSecondaryAction}
            >
              <Text style={styles.actionBtnText}>{secondaryActionText}</Text>
            </TouchableOpacity>
          )}
          {countdownLabel && !onAction && (
            <View style={[styles.actionBtn, styles.countdownBtn]}>
              <Text style={styles.countdownBtnText}>{countdownLabel}</Text>
            </View>
          )}
          {onAction && actionText && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: actionDisabled ? colors.border : actionColor },
              ]}
              onPress={onAction}
              disabled={actionDisabled}
            >
              <Text style={styles.actionBtnText}>{actionText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderIdContainer: { flexDirection: 'row', alignItems: 'center' },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginLeft: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusCOD: { backgroundColor: '#FFF3E0' },
  statusCODText: { color: '#E65100', fontSize: 12, fontWeight: 'bold' },
  statusPaid: { backgroundColor: '#E8F5E9' },
  statusPaidText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: colors.borderLight, marginBottom: 12 },
  body: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  buyerName: { fontSize: 14, fontWeight: '600', color: colors.text, marginLeft: 8 },
  buyerPhone: { fontSize: 14, color: colors.textSecondary },
  addressText: { flex: 1, fontSize: 14, color: colors.text, marginLeft: 8, lineHeight: 20 },
  countdownText: { fontSize: 13, color: colors.warning, marginLeft: 8, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  amountValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  amountCOD: { color: colors.primary },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  countdownBtn: { backgroundColor: colors.borderLight },
  countdownBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
});
