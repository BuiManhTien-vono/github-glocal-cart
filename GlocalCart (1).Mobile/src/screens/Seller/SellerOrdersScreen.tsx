import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../context/AuthContext';
import {
  ORDER_TAB_LABELS,
  SELLER_ORDER_TABS,
  getOrderDisplayLabel,
  matchesTabLabel,
} from '../../utils/orderDisplayStatus';
import {
  onDeliveryRealtime,
  startDeliveryRealtime,
} from '../../services/realtime/deliveryRealtime';

const formatCurrency = (value: any) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const getItems = (order: any) => order.items || order.orderItems || [];

const canCreateShipment = (order: any) => {
  const method = order.payment?.method || order.paymentMethod;
  const status = order.payment?.status || order.paymentStatus;
  return method === 'CashOnDelivery' || method === 'CreditCard' || status === 'Completed';
};

const canCancelOrder = (order: any) => {
  return order.status !== 'Canceled'
    && order.status !== 'Complete'
    && order.shipment?.status !== 'Delivered';
};

const statusColor = (label: string) => {
  if (label === ORDER_TAB_LABELS.pending) return colors.warning;
  if (label === ORDER_TAB_LABELS.waitingPickup) return colors.info;
  if (label === ORDER_TAB_LABELS.delivering) return colors.primary;
  if (label === ORDER_TAB_LABELS.delivered) return colors.success;
  if (label === ORDER_TAB_LABELS.canceled) return colors.danger;
  return colors.text;
};

export default function SellerOrdersScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const tabs = SELLER_ORDER_TABS;
  const initialTab = tabs.includes(route.params?.activeTab)
    ? route.params.activeTab
    : ORDER_TAB_LABELS.pending;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data: any = await apiClient.get('/orders/seller');
      setOrders(data?.items || []);
    } catch (error) {
      console.warn('fetch seller orders error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [fetchOrders])
  );

  useEffect(() => {
    startDeliveryRealtime();
    const offOrder = onDeliveryRealtime('OrderUpdated', fetchOrders);
    const offShipment = onDeliveryRealtime('ShipmentUpdated', fetchOrders);
    const offPayment = onDeliveryRealtime('PaymentUpdated', fetchOrders);
    return () => {
      offOrder();
      offShipment();
      offPayment();
    };
  }, [fetchOrders]);

  useEffect(() => {
    if (tabs.includes(route.params?.activeTab)) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params?.activeTab, tabs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const openCreateShipment = (id: number) => {
    navigation.navigate('SellerCreateShipment', { orderId: id });
  };

  const cancelOrder = async (id: number, reason: string) => {
    if (!reason.trim()) {
      if (Platform.OS === 'web') window.alert('Lý do hủy đơn không được để trống.');
      else Alert.alert('Loi', 'Lý do hủy đơn không được để trống.');
      return;
    }

    try {
      await apiClient.patch(`/orders/${id}/reject`, { reason });
      if (Platform.OS === 'web') window.alert('Đã hủy đơn hàng.');
      else Alert.alert('Thành công', 'Đã hủy đơn hàng.');
      fetchOrders();
    } catch (error: any) {
      if (Platform.OS === 'web') window.alert(error.message || 'Không thể hủy đơn hàng.');
      else Alert.alert('Loi', error.message || 'Không thể hủy đơn hàng.');
    }
  };

  const handleCancel = (id: number) => {
    if (Platform.OS === 'web') {
      const reason = window.prompt('Nhập lý do hủy đơn:');
      if (reason !== null) cancelOrder(id, reason);
      return;
    }

    Alert.prompt(
      'Hủy đơn hàng',
      'Nhập lý do hủy đơn:',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: (reason?: string) => cancelOrder(id, reason || ''),
        },
      ]
    );
  };

  const filtered = orders.filter((order) =>
    matchesTabLabel(order.status, order.shipment?.status, activeTab)
  );

  const renderItem = ({ item }: any) => {
    const label = getOrderDisplayLabel(item.status, item.shipment?.status);
    const itemList = getItems(item);
    const firstItem = itemList[0];
    const productImage = resolveProductImageUrl(firstItem?.productImage);
    const allowCreateShipment = isAdmin || canCreateShipment(item);
    const allowCancel = canCancelOrder(item);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderId}>Đơn: {item.orderNumber || `#${item.id}`}</Text>
            <Text style={styles.buyerName}>Người mua: {item.buyerName || `ID: ${item.buyerId || 'N/A'}`}</Text>
          </View>
          <View style={styles.orderHeaderRight}>
            <Text style={[styles.statusBadge, { color: statusColor(label) }]}>{label}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.orderDate).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.orderBody}>
          <View style={styles.imgMock}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
            )}
          </View>
          <View style={styles.bodyInfo}>
            <Text style={styles.productName} numberOfLines={2}>{firstItem?.productName || 'Sản phẩm'}</Text>
            <Text style={styles.itemCount}>Tổng cộng: {itemList.length} sản phẩm</Text>
            <Text style={styles.totalText}>
              Tổng thu: <Text style={styles.totalPrice}>{formatCurrency(item.totalAmount)}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('SellerOrderDetail', { orderId: item.id, order: item })}
          >
            <Text style={styles.outlineBtnText}>Chi tiết</Text>
          </TouchableOpacity>

          {allowCancel && (
            <TouchableOpacity style={styles.denyBtn} onPress={() => handleCancel(item.id)}>
              <Text style={styles.denyBtnText}>Hủy đơn</Text>
            </TouchableOpacity>
          )}

          {label === ORDER_TAB_LABELS.pending && (
            <>
              {allowCreateShipment ? (
                <TouchableOpacity style={styles.approveBtn} onPress={() => openCreateShipment(item.id)}>
                  <Text style={styles.approveBtnText}>Đẩy đơn</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.disabledBtn} disabled>
                  <Text style={styles.disabledBtnText}>Chờ thanh toan</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý đơn khách</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tabItem, activeTab === item && styles.tabItemActive]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={60} color={colors.borderLight} />
            <Text style={styles.emptyText}>Không có đơn hàng nào.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  tabsContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tabItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.primary, fontWeight: '800' },
  listContent: { padding: 12, paddingBottom: 50 },
  orderCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 16, marginBottom: 12, ...shadow.sm },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 12,
    marginBottom: 12,
    gap: 12,
  },
  orderHeaderLeft: { flex: 1 },
  orderHeaderRight: { alignItems: 'flex-end' },
  orderId: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  buyerName: { fontSize: 13, color: colors.textSecondary },
  orderDate: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  statusBadge: { fontSize: 13, fontWeight: '800' },
  orderBody: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  imgMock: {
    width: 60,
    height: 60,
    backgroundColor: colors.background,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: '100%' },
  bodyInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  itemCount: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  totalText: { fontSize: 13, color: colors.textSecondary },
  totalPrice: { fontSize: 16, fontWeight: '800', color: colors.primary },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 },
  denyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.borderLight },
  denyBtnText: { color: colors.text, fontWeight: '700' },
  approveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.primary },
  approveBtnText: { color: colors.white, fontWeight: '700' },
  disabledBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.disabled },
  disabledBtnText: { color: colors.white, fontWeight: '700' },
  outlineBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  outlineBtnText: { color: colors.textSecondary, fontWeight: '700' },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: colors.textSecondary },
});
