import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { fetchPagedItems } from '../../services/api/pagedApi';
import { useAuth } from '../../context/AuthContext';

const ranges = [
  { key: 'today', label: 'Hôm nay', days: 1 },
  { key: '7d', label: '7 ngày', days: 7 },
  { key: '30d', label: '30 ngày', days: 30 },
  { key: 'all', label: 'Tất cả', days: 0 },
];

const currency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}đ`;

const getOrderItems = (order: any) => order?.items || order?.Items || order?.orderItems || order?.OrderItems || [];

const getPaymentStatus = (order: any) => order?.paymentStatus || order?.payment?.status;

const isRevenueOrder = (order: any) => {
  const isComplete =
    order?.status === 'Complete' ||
    order?.status === 'Delivered' ||
    order?.shipment?.status === 'Delivered';
  const paymentStatus = getPaymentStatus(order);
  return isComplete && (!paymentStatus || paymentStatus === 'Completed');
};

const getOrderRevenue = (order: any, includeShipping: boolean) => {
  if (includeShipping) return Number(order.totalAmount || 0);

  const itemRevenue = getOrderItems(order).reduce((sum: number, item: any) => {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.unitPrice ?? item.priceSnapshot ?? item.price ?? 0);
    return sum + price * quantity;
  }, 0);

  if (itemRevenue > 0) return itemRevenue;
  return Math.max(0, Number(order.totalAmount || 0) - Number(order.shippingFee || 0));
};

export default function SellerRevenueScreen({ navigation }: any): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [adminRevenue, setAdminRevenue] = useState<any>(null);
  const [activeRange, setActiveRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const selectedRange = ranges.find(item => item.key === activeRange) || ranges[2];

  const fetchData = useCallback(async () => {
    try {
      setErrorMessage('');
      if (isAdmin) {
        const revenue = await apiClient.get(`/admin/revenue?days=${selectedRange.days}`) as any;
        setAdminRevenue(revenue);
        setOrders([]);
        setProducts([]);
        return;
      }

      const ordersEndpoint = isAdmin ? '/admin/orders' : '/orders/seller';
      const productsEndpoint = isAdmin ? '/admin/products' : '/products/my-products';
      const [orderItems, productItems]: any[] = await Promise.all([
        fetchPagedItems(ordersEndpoint, 50),
        fetchPagedItems(productsEndpoint, 50),
      ]);

      setOrders(orderItems);
      setProducts(productItems);
      setAdminRevenue(null);
    } catch (error: any) {
      console.warn('Seller revenue fetch error:', error);
      setOrders([]);
      setProducts([]);
      setAdminRevenue(null);
      setErrorMessage(error?.message || 'Không thể tải số liệu doanh thu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, selectedRange.days]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const productLookup = useMemo(() => {
    const map: Record<string, any> = {};
    products.forEach(product => {
      map[String(product.id)] = product;
    });
    return map;
  }, [products]);

  const filteredOrders = useMemo(() => {
    const paidOrders = orders.filter(isRevenueOrder);
    if (!selectedRange.days) return paidOrders;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - selectedRange.days + 1);

    return paidOrders.filter(order => {
      const orderDate = new Date(order.orderDate || order.createdAt || order.updatedAt || Date.now());
      return orderDate >= start;
    });
  }, [orders, selectedRange.days]);

  const summary = useMemo(() => {
    if (isAdmin && adminRevenue) {
      const totalRevenue = Number(adminRevenue.totalRevenue ?? adminRevenue.TotalRevenue ?? 0);
      const totalOrders = Number(adminRevenue.totalOrders ?? adminRevenue.TotalOrders ?? 0);
      return {
        totalRevenue,
        totalOrders,
        totalItems: Number(adminRevenue.totalItems ?? adminRevenue.TotalItems ?? 0),
        averageOrder: Number(adminRevenue.averageOrder ?? adminRevenue.AverageOrder ?? (totalOrders ? totalRevenue / totalOrders : 0)),
      };
    }

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + getOrderRevenue(order, isAdmin), 0);
    const totalOrders = filteredOrders.length;
    const totalItems = filteredOrders.reduce(
      (sum, order) => sum + getOrderItems(order).reduce((itemSum: number, item: any) => itemSum + Number(item.quantity || 0), 0),
      0
    );

    return {
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrder: totalOrders ? totalRevenue / totalOrders : 0,
    };
  }, [adminRevenue, filteredOrders, isAdmin]);

  const byProduct = useMemo(() => {
    const adminByProduct = adminRevenue?.byProduct ?? adminRevenue?.ByProduct;
    if (isAdmin && Array.isArray(adminByProduct)) {
      return adminByProduct.map((item: any) => ({
        name: item.name ?? item.Name ?? 'Sản phẩm',
        quantity: Number(item.quantity ?? item.Quantity ?? 0),
        revenue: Number(item.revenue ?? item.Revenue ?? 0),
      }));
    }

    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};

    filteredOrders.forEach(order => {
      getOrderItems(order).forEach((item: any) => {
        const key = String(item.productId || item.id || item.productName);
        const quantity = Number(item.quantity || 0);
        const price = Number(item.unitPrice ?? item.priceSnapshot ?? item.price ?? 0);
        const product = productLookup[String(item.productId)];

        if (!map[key]) {
          map[key] = {
            name: item.productName || product?.name || 'Sản phẩm',
            quantity: 0,
            revenue: 0,
          };
        }

        map[key].quantity += quantity;
        map[key].revenue += price * quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [adminRevenue, filteredOrders, isAdmin, productLookup]);

  const byCategory = useMemo(() => {
    const adminByCategory = adminRevenue?.byCategory ?? adminRevenue?.ByCategory;
    if (isAdmin && Array.isArray(adminByCategory)) {
      return adminByCategory.map((item: any) => ({
        name: item.name ?? item.Name ?? 'Chưa phân loại',
        quantity: Number(item.quantity ?? item.Quantity ?? 0),
        revenue: Number(item.revenue ?? item.Revenue ?? 0),
      }));
    }

    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};

    filteredOrders.forEach(order => {
      getOrderItems(order).forEach((item: any) => {
        const product = productLookup[String(item.productId)] || {};
        const name = item.categoryName || product.categoryName || product.category?.name || 'Chưa phân loại';
        const quantity = Number(item.quantity || 0);
        const price = Number(item.unitPrice ?? item.priceSnapshot ?? item.price ?? 0);

        if (!map[name]) map[name] = { name, quantity: 0, revenue: 0 };
        map[name].quantity += quantity;
        map[name].revenue += price * quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [adminRevenue, filteredOrders, isAdmin, productLookup]);

  const maxCategoryRevenue = Math.max(...byCategory.map(item => item.revenue), 1);
  const maxProductRevenue = Math.max(...byProduct.map(item => item.revenue), 1);

  const renderMetric = (icon: keyof typeof Ionicons.glyphMap, label: string, value: string, color: string) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color + '14' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  const renderBreakdown = (
    title: string,
    items: { name: string; quantity: number; revenue: number }[],
    maxRevenue: number
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có số liệu trong khoảng thời gian này.</Text>
      ) : (
        items.map(item => (
          <View key={item.name} style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.breakdownMeta}>{item.quantity} sản phẩm</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${Math.max(8, (item.revenue / maxRevenue) * 100)}%` }]} />
              </View>
            </View>
            <Text style={styles.breakdownValue}>{currency(item.revenue)}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isAdmin ? 'Doanh thu hệ thống' : 'Doanh thu Shop'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải số liệu...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.danger} />
          <Text style={styles.errorTitle}>Không thể tải doanh thu</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.rangeRow}>
            {ranges.map(range => (
              <TouchableOpacity
                key={range.key}
                style={[styles.rangeBtn, activeRange === range.key && styles.rangeBtnActive]}
                onPress={() => setActiveRange(range.key)}
              >
                <Text style={[styles.rangeText, activeRange === range.key && styles.rangeTextActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Tổng doanh thu</Text>
            <Text style={styles.totalValue}>{currency(summary.totalRevenue)}</Text>
            <Text style={styles.totalNote}>{selectedRange.label} · {summary.totalOrders} đơn hoàn tất</Text>
          </View>

          <View style={styles.metricsGrid}>
            {renderMetric('receipt-outline', 'Đơn hoàn tất', String(summary.totalOrders), colors.primary)}
            {renderMetric('cube-outline', 'Sản phẩm bán', String(summary.totalItems), colors.secondary)}
            {renderMetric('trending-up-outline', 'Giá trị TB', currency(summary.averageOrder), colors.success)}
          </View>

          {renderBreakdown('Doanh thu theo danh mục', byCategory, maxCategoryRevenue)}
          {renderBreakdown('Doanh thu theo sản phẩm', byProduct, maxProductRevenue)}
        </ScrollView>
      )}
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  errorTitle: { marginTop: 12, fontSize: 18, fontWeight: '800', color: colors.text },
  errorText: { marginTop: 8, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 28, lineHeight: 20 },
  retryBtn: { marginTop: 16, borderRadius: 8, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 11 },
  retryBtnText: { color: colors.white, fontWeight: '700' },
  content: { padding: spacing.md, paddingBottom: 40 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rangeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: borderRadius.round,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rangeText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  rangeTextActive: { color: colors.white },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: 18,
    marginBottom: 12,
    ...shadow.md,
  },
  totalLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '600' },
  totalValue: { color: colors.white, fontSize: 30, fontWeight: '900', marginTop: 6 },
  totalNote: { color: 'rgba(255,255,255,0.82)', marginTop: 8, fontSize: 12 },
  metricsGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 12,
    ...shadow.sm,
  },
  metricIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  metricLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 12,
    ...shadow.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10 },
  emptyText: { color: colors.textSecondary, fontSize: 13, paddingVertical: 12, textAlign: 'center' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  breakdownInfo: { flex: 1 },
  breakdownName: { fontSize: 13, fontWeight: '700', color: colors.text },
  breakdownMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  breakdownValue: { fontSize: 12, fontWeight: '800', color: colors.primary },
  progressTrack: { height: 5, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden', marginTop: 7 },
  progressBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
});
