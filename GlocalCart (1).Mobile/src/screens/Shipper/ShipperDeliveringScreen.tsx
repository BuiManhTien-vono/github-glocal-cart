import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { ShipmentCard } from '../../components/Shipper/ShipmentCard';
import { Shipment, shipperService } from '../../services/api/shipperService';

function getShipperActions(shipment: Shipment) {
  if (shipment.shipmentStatus === 'Accepted') {
    if (shipment.canConfirmPickup) {
      return { actionText: 'Đã lấy hàng', onAction: 'pickup' as const };
    }
    return {
      countdownLabel: `Chờ lấy hàng (${shipment.pickupCountdownSeconds ?? 0}s)`,
    };
  }

  if (shipment.shipmentStatus === 'Shipped') {
    if (shipment.canConfirmArrival) {
      return { actionText: 'Đã đến nơi', onAction: 'arrival' as const };
    }
    return {
      countdownLabel: `Đang giao (${shipment.arrivalCountdownSeconds ?? 0}s)`,
    };
  }

  if (shipment.shipmentStatus === 'Arrived') {
    if (shipment.awaitingCash) {
      return { actionText: 'Đã nhận tiền', onAction: 'cash' as const };
    }
    if (shipment.awaitingTransferConfirm) {
      return { actionText: 'Đã nhận chuyển khoản', onAction: 'transfer' as const };
    }
    if (shipment.paymentStatus === 'Completed' && shipment.buyerConfirmedReceipt) {
      return { actionText: 'Hoàn thành đơn', onAction: 'deliver' as const };
    }
  }

  return {};
}

export default function ShipperDeliveringScreen() {
  const [deliveringShipments, setDeliveringShipments] = useState<Shipment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response: any = await shipperService.getMyShipments();
      const allItems: Shipment[] = response?.items || [];
      // Đơn Accepted (chờ lấy hàng) đã hiển thị ở tab "Chờ lấy hàng", loại khỏi tab này
      setDeliveringShipments(allItems.filter(s => s.shipmentStatus !== 'Accepted'));
    } catch (e) {
      console.log('Lỗi tải danh sách', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshing(true);
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  useEffect(() => {
    const hasCountdown = deliveringShipments.some(
      s => s.shipmentStatus === 'Shipped' && !s.canConfirmArrival
    );

    if (hasCountdown) {
      pollRef.current = setInterval(() => loadData(), 2000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [deliveringShipments, loadData]);

  const runAction = async (shipment: Shipment, type: string) => {
    try {
      switch (type) {
        case 'pickup':
          await shipperService.confirmPickup(shipment.shipmentId);
          Alert.alert('Thành công', 'Đã lấy hàng. Đơn chuyển sang chờ giao hàng.');
          break;
        case 'arrival':
          await shipperService.confirmArrival(shipment.shipmentId);
          Alert.alert('Thành công', 'Đã đến nơi. Người mua sẽ nhận thông báo xác nhận nhận hàng.');
          break;
        case 'cash':
          await shipperService.confirmCashReceived(shipment.shipmentId);
          Alert.alert('Thành công', 'Đã xác nhận nhận tiền mặt. Đơn hoàn tất.');
          break;
        case 'transfer':
          await shipperService.confirmTransferReceived(shipment.shipmentId);
          Alert.alert('Thành công', 'Đã xác nhận nhận chuyển khoản. Đơn hoàn tất.');
          break;
        case 'deliver':
          await shipperService.deliverShipment(shipment.shipmentId);
          Alert.alert('Thành công', 'Đã hoàn thành đơn hàng.');
          break;
      }
      loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Thao tác thất bại');
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Hiện không có đơn đang xử lý.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đang giao</Text>
        <Text style={styles.headerSubtitle}>Đang xử lý {deliveringShipments.length} đơn</Text>
      </View>

      <FlatList
        data={deliveringShipments}
        keyExtractor={item => item.shipmentId.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const actions = getShipperActions(item);
          return (
            <ShipmentCard
              shipment={item}
              countdownLabel={actions.countdownLabel}
              onPress={() =>
                navigation.navigate('ShipperShipmentDetail', {
                  shipmentId: item.shipmentId,
                  shipment: item,
                })
              }
              onAction={actions.onAction ? () => runAction(item, actions.onAction!) : undefined}
              actionText={actions.actionText}
              actionColor={colors.success}
              actionDisabled={!!actions.countdownLabel}
            />
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
