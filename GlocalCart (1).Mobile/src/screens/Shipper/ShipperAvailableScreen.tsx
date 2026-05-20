import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, Alert, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { ShipmentCard } from '../../components/Shipper/ShipmentCard';
import { Shipment, shipperService } from '../../services/api/shipperService';

export default function ShipperAvailableScreen() {
  const [pendingPickup, setPendingPickup] = useState<Shipment[]>([]); // Đã nhận, chờ lấy hàng (Accepted)
  const [unassigned, setUnassigned] = useState<Shipment[]>([]);       // Chưa có shipper
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Tải đơn chưa có shipper
      const availableRes: any = await shipperService.getAvailableShipments();
      setUnassigned(availableRes?.items || []);

      // Tải đơn đã nhận của shipper, lọc ra các đơn Accepted (chờ lấy hàng)
      const myRes: any = await shipperService.getMyShipments();
      const myItems: Shipment[] = myRes?.items || [];
      const accepted = myItems.filter(s => s.shipmentStatus === 'Accepted');
      setPendingPickup(accepted);
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

  // Poll khi có đơn đang đếm ngược chờ pickup
  useEffect(() => {
    const hasCountdown = pendingPickup.some(s => !s.canConfirmPickup);
    if (hasCountdown) {
      pollRef.current = setInterval(() => loadData(), 2000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pendingPickup, loadData]);

  const handleAcceptShipment = async (shipment: Shipment) => {
    try {
      await shipperService.acceptShipment(shipment.shipmentId);
      Alert.alert('Thành công', 'Đã nhận đơn! Vui lòng chờ để lấy hàng.');
      // Reload tại chỗ, ở lại tab Chờ lấy hàng
      setRefreshing(true);
      loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể nhận đơn.');
    }
  };

  const handleConfirmPickup = async (shipment: Shipment) => {
    try {
      await shipperService.confirmPickup(shipment.shipmentId);
      Alert.alert('Thành công', 'Đã lấy hàng. Đơn chuyển sang đang giao.');
      setRefreshing(true);
      loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xác nhận lấy hàng.');
    }
  };

  const handleNavigateToDetail = (shipment: Shipment) => {
    navigation.navigate('ShipperShipmentDetail', { shipmentId: shipment.shipmentId, shipment });
  };

  const totalCount = pendingPickup.length + unassigned.length;

  const sections = [
    ...(pendingPickup.length > 0
      ? [{
          title: `Chờ lấy hàng (${pendingPickup.length})`,
          data: pendingPickup,
          type: 'pickup',
        }]
      : []),
    ...(unassigned.length > 0
      ? [{
          title: `Đơn chờ nhận (${unassigned.length})`,
          data: unassigned,
          type: 'available',
        }]
      : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chờ lấy hàng</Text>
        <Text style={styles.headerSubtitle}>
          {pendingPickup.length > 0
            ? `${pendingPickup.length} đơn đang chờ lấy hàng`
            : `Bạn có ${unassigned.length} đơn chờ nhận`}
        </Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Hiện không có đơn hàng chờ lấy hàng.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.shipmentId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              colors={[colors.primary]}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={[
                styles.sectionDot,
                { backgroundColor: section.type === 'pickup' ? colors.warning ?? '#FF9800' : colors.primary }
              ]} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item, section }: { item: Shipment; section: any }) => {
            if (section.type === 'pickup') {
              // Đơn đã nhận, chờ lấy hàng
              const canPickup = item.canConfirmPickup;
              const countdown = item.pickupCountdownSeconds ?? 0;
              return (
                <ShipmentCard
                  shipment={item}
                  onPress={() => handleNavigateToDetail(item)}
                  onAction={canPickup ? () => handleConfirmPickup(item) : undefined}
                  actionText={canPickup ? 'Đã lấy hàng' : undefined}
                  countdownLabel={!canPickup ? `Chờ lấy hàng (${countdown}s)` : undefined}
                  actionColor={colors.success}
                  actionDisabled={!canPickup}
                />
              );
            }
            // Đơn chưa có shipper
            return (
              <ShipmentCard
                shipment={item}
                onPress={() => handleNavigateToDetail(item)}
                onAction={() => handleAcceptShipment(item)}
                actionText="Nhận đơn"
                actionColor={colors.primary}
              />
            );
          }}
        />
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
