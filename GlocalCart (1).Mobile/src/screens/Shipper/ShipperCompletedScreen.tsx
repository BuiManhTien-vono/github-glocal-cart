import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ShipmentCard } from '../../components/Shipper/ShipmentCard';
import { Shipment, shipperService } from '../../services/api/shipperService';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';

export default function ShipperCompletedScreen() {
  const [completedShipments, setCompletedShipments] = useState<Shipment[]>([]);
  const navigation = useNavigation<any>();

  const loadData = async () => {
    try {
      const response: any = await shipperService.getMyShipments();
      const items = response?.items || [];
      // Mặc định API có thể trả về cả Shipped và Delivered, nhưng tạm lọc local nếu cần
      setCompletedShipments(items.filter((s: Shipment) => s.shipmentStatus === 'Delivered'));
    } catch (e) {
      console.log('Lỗi tải danh sách', e);
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
      <Text style={styles.emptyText}>Bạn chưa hoàn thành đơn hàng nào.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đã hoàn thành</Text>
        <Text style={styles.headerSubtitle}>Tổng cộng {completedShipments.length} đơn hàng</Text>
      </View>
      
      <FlatList
        data={completedShipments}
        keyExtractor={item => item.shipmentId.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ShipmentCard
            shipment={item}
            onPress={() => navigation.navigate('ShipperShipmentDetail', { shipmentId: item.shipmentId, shipment: item })}
          />
        )}
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
    paddingBottom: 100,
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
