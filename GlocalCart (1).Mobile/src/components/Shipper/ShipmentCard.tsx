import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Shipment } from '../../services/api/shipperService';

interface ShipmentCardProps {
  shipment: Shipment;
  onPress: () => void;
  onAction?: () => void;
  actionText?: string;
  actionColor?: string;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, onPress, onAction, actionText, actionColor = colors.primary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const isCOD = false; // Tạm bỏ qua PaymentMethod vì Backend DTO chưa hỗ trợ

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Header: Order Number and Status */}
      <View style={styles.header}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.orderNumber}>#{shipment.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, isCOD ? styles.statusCOD : styles.statusPaid]}>
          <Text style={[styles.statusText, isCOD ? styles.statusCODText : styles.statusPaidText]}>
            {shipment.shipmentStatus === 'Pending' ? 'Chờ nhận' : shipment.shipmentStatus === 'Shipped' ? 'Đang giao' : 'Đã giao'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Body: Buyer Info & Address */}
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

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.etaText}>
            Dự kiến: <Text style={{fontWeight: '600'}}>{shipment.estimatedArrival ? new Date(shipment.estimatedArrival).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</Text>
          </Text>
        </View>

        {shipment.shipperName && (
          <View style={[styles.infoRow, styles.shipperInfoRow]}>
            <Ionicons name="bicycle-outline" size={16} color={colors.primary} />
            <Text style={styles.shipperLabel}>Shipper: </Text>
            <Text style={styles.shipperNameText}>{shipment.shipperName}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* Footer: Amount & Action */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.amountLabel}>{isCOD ? 'Cần thu tiền (COD)' : 'Tổng giá trị'}</Text>
          <Text style={[styles.amountValue, isCOD && styles.amountCOD]}>
            {formatCurrency(shipment.totalAmount)}
          </Text>
        </View>
        
        {onAction && actionText && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: actionColor }]} 
            onPress={onAction}
          >
            <Text style={styles.actionBtnText}>{actionText}</Text>
          </TouchableOpacity>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusCOD: {
    backgroundColor: '#FFF3E0',
  },
  statusCODText: {
    color: '#E65100',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusPaid: {
    backgroundColor: '#E8F5E9',
  },
  statusPaidText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 12,
  },
  body: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  buyerPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    lineHeight: 20,
  },
  etaText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  shipperInfoRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  shipperLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  shipperNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  amountCOD: {
    color: colors.primary,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
