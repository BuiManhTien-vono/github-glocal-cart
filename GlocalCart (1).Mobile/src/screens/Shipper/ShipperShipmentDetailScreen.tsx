import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { colors } from '../../theme/colors';
import { Shipment, shipperService } from '../../services/api/shipperService';
import { useAuth } from '../../context/AuthContext';

export default function ShipperShipmentDetailScreen() {
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [shipment, setShipment] = useState<Shipment>(route.params?.shipment);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleCall = () => {
    if (shipment.buyerPhone) {
      Linking.openURL(`tel:${shipment.buyerPhone}`);
    }
  };

  const handleOpenMap = () => {
    // Fallback if they want to open in external maps app
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shipment.deliveryAddress)}`;
    Linking.openURL(url);
  };

  const handleAction = async () => {
    // If not assigned to me yet
    if (!shipment.shipperId) {
      Alert.alert('Nhận đơn', 'Bạn muốn nhận giao đơn hàng này?', [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Nhận đơn', 
          onPress: async () => {
            try {
              await shipperService.acceptShipment(shipment.shipmentId);
              Alert.alert('Thành công', 'Đã nhận đơn hàng!');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể nhận đơn.');
            }
          } 
        }
      ]);
    } else if (shipment.shipmentStatus !== 'Delivered') {
      Alert.alert('Xác nhận đã giao', 'Bạn xác nhận đã giao đơn hàng này thành công?', [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: async () => {
            try {
              await shipperService.deliverShipment(shipment.shipmentId);
              Alert.alert('Thành công', 'Đơn hàng đã được đánh dấu hoàn thành!');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Lỗi khi xác nhận giao hàng.');
            }
          } 
        }
      ]);
    }
  };

  const isCOD = false; // Tạm bỏ qua PaymentMethod vì Backend DTO chưa hỗ trợ

  // Toàn độ mẫu cho bản đồ (nên dùng Geocoding API từ deliveryAddress trong thực tế)
  const mockLocation = {
    latitude: 16.0544,
    longitude: 108.2022,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            initialRegion={mockLocation}
          >
            <Marker coordinate={mockLocation} title="Điểm giao hàng" description={shipment.deliveryAddress} />
          </MapView>
          <TouchableOpacity style={styles.openMapBtn} onPress={handleOpenMap}>
            <Ionicons name="map" size={20} color="#FFF" />
            <Text style={styles.openMapText}>Mở ứng dụng Bản đồ</Text>
          </TouchableOpacity>
        </View>

        {/* Order ID & Status */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Mã đơn hàng</Text>
            <Text style={styles.valueBold}>#{shipment.orderNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Mã vận đơn</Text>
            <Text style={styles.valueBold}>{shipment.trackingNumber}</Text>
          </View>
        </View>

        {/* Shipper Info (If assigned) */}
        {shipment.shipperName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin vận chuyển</Text>
            <View style={styles.buyerRow}>
              <View style={[styles.buyerIconBg, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name="bicycle" size={20} color={colors.primary} />
              </View>
              <View style={styles.buyerDetails}>
                <Text style={styles.buyerName}>{shipment.shipperName}</Text>
                <Text style={styles.buyerPhone}>Shipper của GlocalCart</Text>
              </View>
              <View style={styles.badgePaid}>
                <Text style={styles.badgePaidText}>Đang giao</Text>
              </View>
            </View>
          </View>
        )}

        {/* Buyer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
          <View style={styles.buyerRow}>
            <View style={styles.buyerIconBg}>
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View style={styles.buyerDetails}>
              <Text style={styles.buyerName}>{shipment.buyerName}</Text>
              <Text style={styles.buyerPhone}>{shipment.buyerPhone}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.addressText}>{shipment.deliveryAddress}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Phương thức</Text>
            <View style={[styles.badge, isCOD ? styles.badgeCOD : styles.badgePaid]}>
              <Text style={[styles.badgeText, isCOD ? styles.badgeCODText : styles.badgePaidText]}>
                {isCOD ? 'Thu hộ COD' : 'Chuyển khoản'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Tổng tiền</Text>
            <Text style={styles.totalAmount}>{formatCurrency(shipment.totalAmount)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {shipment.shipmentStatus !== 'Delivered' ? (
          <TouchableOpacity 
            style={styles.mainActionBtn} 
            onPress={handleAction}
          >
            <Text style={styles.mainActionText}>
              {!shipment.shipperId ? 'Nhận Giao Đơn Này' : 'Xác Nhận Đã Giao'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBtn}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.completedBtnText}>Đơn Hàng Đã Hoàn Thành</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  mapContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  openMapBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  openMapText: {
    color: '#FFF',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  valueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  buyerPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeCOD: {
    backgroundColor: '#FFF3E0',
  },
  badgeCODText: {
    color: '#E65100',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgePaid: {
    backgroundColor: '#E8F5E9',
  },
  badgePaidText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: 24, // extra padding for bottom safe area
  },
  mainActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mainActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  completedBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
