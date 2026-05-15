import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImageUrl } from '../../utils/imageUtils';

// Mock data fallback
const MOCK_ORDERS = [
  {
    id: 'mock1', orderNumber: 'GLC240516001', status: 0,
    totalAmount: 320000, createdAt: '2026-05-16T09:00:00Z',
    orderItems: [
      { productId: 1, productName: 'Áo thun nam basic', productImage: null, quantity: 2, price: 159000 },
    ],
  },
  {
    id: 'mock2', orderNumber: 'GLC240514002', status: 2,
    totalAmount: 85000, createdAt: '2026-05-14T14:00:00Z',
    orderItems: [
      { productId: 2, productName: 'Cốc sứ in hình', productImage: null, quantity: 1, price: 85000 },
    ],
  },
];

export default function MyOrdersScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const initialTab = route.params?.activeTab || 'Tất cả';
  const newOrderFromCheckout = route.params?.newOrder;

  const tabs = ['Tất cả', 'Chờ xác nhận', 'Đang giao', 'Đã giao', 'Đánh giá', 'Đã hủy'];
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Khi có đơn hàng mới từ checkout, thêm vào đầu danh sách
  useEffect(() => {
    if (newOrderFromCheckout) {
      setOrders(prev => {
        const exists = prev.some(o => o.id === newOrderFromCheckout.id);
        return exists ? prev : [newOrderFromCheckout, ...prev];
      });
    }
  }, [newOrderFromCheckout]);

  const fetchOrders = async () => {
    try {
      const data: any = await apiClient.get('/orders/my');
      const apiOrders = data || [];
      // Nếu API trả về empty, dùng mock
      setOrders(apiOrders.length > 0 ? apiOrders : MOCK_ORDERS);
    } catch {
      setOrders(MOCK_ORDERS);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Chờ xác nhận';
      case 1: return 'Đang chuẩn bị';
      case 2: return 'Đang giao';
      case 3: return 'Đã giao';
      case 4: return 'Đã hủy';
      default: return 'Khác';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return colors.warning;
      case 1: return colors.info;
      case 2: return colors.secondary;
      case 3: return colors.success;
      case 4: return colors.danger;
      default: return colors.text;
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'Tất cả') return true;
    if (activeTab === 'Đánh giá') return o.status === 3;
    return getStatusText(o.status) === activeTab;
  });

  const renderItem = ({ item }: any) => {
    const statusText = getStatusText(item.status);
    const statusColor = getStatusColor(item.status);
    const firstItem = item.orderItems?.[0];
    const itemsCount = item.orderItems?.length || 0;
    const productImage = firstItem?.productImage
      ? resolveProductImageUrl(firstItem.productImage)
      : null;

    return (
      <View style={st.orderCard}>
        <View style={st.orderHeader}>
          <View style={st.shopRow}>
            <Ionicons name="receipt-outline" size={15} color={colors.textSecondary} />
            <Text style={st.shopName}>Đơn hàng: {item.orderNumber}</Text>
          </View>
          <Text style={[st.orderStatus, { color: statusColor }]}>{statusText}</Text>
        </View>

        <TouchableOpacity
          style={st.orderBody}
          onPress={() => navigation.navigate('OrderTracking', {
            notification: {
              title: `Đơn hàng ${item.orderNumber}`,
              orderId: item.orderNumber,
            },
          })}
        >
          <View style={st.imgWrap}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={st.productImg} resizeMode="cover" />
            ) : (
              <Ionicons name="cube-outline" size={30} color={colors.textMuted} />
            )}
          </View>
          <View style={st.orderInfo}>
            <Text style={st.productName} numberOfLines={2}>{firstItem?.productName || 'Sản phẩm'}</Text>
            {itemsCount > 1 && (
              <Text style={st.itemCount}>và {itemsCount - 1} sản phẩm khác...</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={st.orderFooter}>
          <Text style={st.totalText}>
            Thành tiền: <Text style={st.amount}>{item.totalAmount?.toLocaleString('vi-VN')}đ</Text>
          </Text>
        </View>

        <View style={st.orderActions}>
          {item.status === 3 && (
            <TouchableOpacity style={[st.actionBtn, st.primaryBtn]}
              onPress={() => navigation.navigate('WriteReview', { productId: firstItem?.productId, orderId: item.id })}>
              <Text style={st.primaryBtnText}>Đánh Giá</Text>
            </TouchableOpacity>
          )}
          {item.status === 2 && (
            <TouchableOpacity style={[st.actionBtn, st.primaryBtn]}
              onPress={() => navigation.navigate('OrderTracking', { notification: { title: 'Đang giao hàng', orderId: item.orderNumber } })}>
              <Text style={st.primaryBtnText}>Theo dõi Đơn</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={st.actionBtn}
            onPress={() => navigation.navigate('OrderTracking', { notification: { title: getStatusText(item.status), orderId: item.orderNumber } })}>
            <Text style={st.outlineBtnText}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Đơn mua</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={st.tabsContainer}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[st.tabItem, activeTab === item && st.tabItemActive]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[st.tabText, activeTab === item && st.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={i => i}
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={st.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[colors.primary]} />}
          ListEmptyComponent={() => (
            <View style={st.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={colors.border} />
              <Text style={st.emptyText}>Chưa có đơn hàng nào</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  tabsContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tabItem: { paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

  listContent: { padding: spacing.sm },
  orderCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadow.sm, overflow: 'hidden' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shopName: { fontSize: 13, fontWeight: '700', color: colors.text },
  orderStatus: { fontSize: 12, fontWeight: '700' },

  orderBody: { flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  imgWrap: { width: 64, height: 64, backgroundColor: colors.background, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  productImg: { width: '100%', height: '100%' },
  orderInfo: { flex: 1 },
  productName: { fontSize: 14, color: colors.text, fontWeight: '500', marginBottom: 4 },
  itemCount: { fontSize: 12, color: colors.textSecondary },

  orderFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  totalText: { fontSize: 14, color: colors.text },
  amount: { fontSize: 15, color: colors.primary, fontWeight: '700' },

  orderActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, gap: 10 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  primaryBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  primaryBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  outlineBtnText: { color: colors.text, fontWeight: '600', fontSize: 13 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyText: { marginTop: 12, color: colors.textSecondary, fontSize: 16 },
});
