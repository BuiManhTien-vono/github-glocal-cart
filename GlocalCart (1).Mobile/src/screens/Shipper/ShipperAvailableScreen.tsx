import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { ShipmentCard } from '../../components/Shipper/ShipmentCard';
import { Shipment, shipperService } from '../../services/api/shipperService';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';

export default function ShipperAvailableScreen() {
  const { user } = useAuth();
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const loadData = async () => {
    setRefreshing(true);
    try {
      const response: any = await shipperService.getAvailableShipments();
      setAvailableShipments(response?.items || []);
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

  const handleAccept = async (shipment: Shipment) => {
    try {
      await shipperService.acceptShipment(shipment.shipmentId);
      Alert.alert('Thành công', 'Đã nhận giao đơn hàng này.');
      loadData(); // Tải lại danh sách
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể nhận đơn.');
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Hiện không có đơn hàng nào chờ nhận.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn chờ nhận</Text>
        <Text style={styles.headerSubtitle}>Bạn có {availableShipments.length} đơn hàng mới</Text>
      </View>
      
      <FlatList
        data={availableShipments}
        keyExtractor={item => item.shipmentId.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ShipmentCard
            shipment={item}
            onPress={() => navigation.navigate('ShipperShipmentDetail', { shipmentId: item.shipmentId, shipment: item })}
            onAction={() => handleAccept(item)}
            actionText="Nhận đơn"
            actionColor={colors.primary}
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
