import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { ShipmentCard } from '../../components/Shipper/ShipmentCard';
import { Shipment, shipperService } from '../../services/api/shipperService';

export default function ShipperDeliveringScreen() {
  const [deliveringShipments, setDeliveringShipments] = useState<Shipment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const loadData = async () => {
    setRefreshing(true);
    try {
      // Backend api /shipper/shipments/mine returns Shipped items
      const response: any = await shipperService.getMyShipments();
      const items = response?.items || [];
      // Filter for Shipped only
      setDeliveringShipments(items.filter((s: Shipment) => s.shipmentStatus === 'Shipped'));
    } catch (e) {
      console.log('Lỗi tải danh sách', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Hiện không có đơn hàng nào đang giao.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn đang giao</Text>
        <Text style={styles.headerSubtitle}>Bạn đang giao {deliveringShipments.length} đơn hàng</Text>
      </View>
      
      <FlatList
        data={deliveringShipments}
        keyExtractor={item => item.shipmentId.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ShipmentCard
            shipment={item}
            onPress={() => navigation.navigate('ShipperShipmentDetail', { shipmentId: item.shipmentId, shipment: item })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[colors.primary]} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Safe space for bottom tab
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
