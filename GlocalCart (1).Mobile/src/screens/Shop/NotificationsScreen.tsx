import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import { CartBadge } from '../../components/common/CartBadge';
import { ChatBadge } from '../../components/common/ChatBadge';
import { useAuth } from '../../context/AuthContext';
import { notificationService, AppNotification } from '../../services/api/notificationService';
import { notificationHelper } from '../../utils/notificationHelper';

type TabType = 'orders' | 'highlights' | 'promo' | 'finance';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  image?: string | null;
  productImage?: string | null;
  isRead: boolean;
  isOrder: boolean;
  orderId?: number | string | null;
  action?: string;
};

const ORDER_ICON = 'https://cdn-icons-png.flaticon.com/512/679/679821.png';

const ORDER_UPDATES: NotificationItem[] = [
  {
    id: 'ord1',
    title: 'Đơn hàng đang được giao',
    body: 'Đơn hàng #ORD20261001 đang trên đường giao đến bạn.',
    time: '08:00 14-05-26',
    productImage: null,
    isRead: false,
    isOrder: true,
    orderId: 'ORD20261001',
  },
  {
    id: 'ord2',
    title: 'Giao hàng thành công',
    body: 'Đơn hàng #ORD20261002 đã được giao thành công.',
    time: '15:31 14-05-26',
    productImage: null,
    isRead: true,
    isOrder: true,
    orderId: 'ORD20261002',
  },
];

const HIGHLIGHT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'hl1',
    title: 'Hoàn tiền thành công',
    body: 'Bạn vừa được hoàn 25.000đ vào ví Glocal.',
    time: '11:20 14-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png',
    isRead: false,
    isOrder: false,
  },
  {
    id: 'hl2',
    title: 'Liên kết ngân hàng',
    body: 'Liên kết ngân hàng để thanh toán nhanh hơn và nhận thêm ưu đãi.',
    time: '15:00 12-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/2830/2830266.png',
    isRead: true,
    isOrder: false,
  },
];

const PROMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'pr1',
    title: 'Voucher miễn ship cho bạn',
    body: 'Nhận ngay voucher miễn phí vận chuyển toàn sàn.',
    time: '08:00 15-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/1390/1390166.png',
    isRead: false,
    isOrder: false,
  },
  {
    id: 'pr2',
    title: 'Flash Sale 12h hôm nay',
    body: 'Hàng ngàn sản phẩm giảm đến 80%.',
    time: '07:00 15-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/3094/3094196.png',
    isRead: true,
    isOrder: false,
  },
];

const FINANCE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'fi1',
    title: 'Ưu đãi thanh toán',
    body: 'Nhận voucher khi thanh toán qua tài khoản ngân hàng.',
    time: '10:00 14-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/2830/2830211.png',
    isRead: false,
    isOrder: false,
  },
  {
    id: 'fi2',
    title: 'Glocal Pay',
    body: 'Nạp tiền vào ví để thanh toán dễ dàng hơn.',
    time: '09:00 12-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    isRead: true,
    isOrder: false,
  },
];

const TABS = [
  { key: 'orders' as TabType, icon: 'cube-outline', label: 'Đơn hàng' },
  { key: 'highlights' as TabType, icon: 'star-outline', label: 'Nổi bật' },
  { key: 'promo' as TabType, icon: 'pricetag-outline', label: 'Khuyến mãi' },
  { key: 'finance' as TabType, icon: 'card-outline', label: 'Tài chính' },
];

const formatTime = (createdAt?: string) => {
  const date = createdAt ? new Date(createdAt) : new Date();
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

function mapApiNotification(n: AppNotification): NotificationItem {
  const titleByAction: Record<string, string> = {
    OrderArrived: 'Đơn hàng đã đến nơi',
    CashSelected: 'Khách chọn tiền mặt',
    TransferReported: 'Khách đã chuyển khoản',
    OrderDelivered: 'Giao hàng thành công',
    OrderAccepted: 'Shipper đã nhận đơn',
    General: 'Thông báo đơn hàng',
  };

  return {
    id: String(n.id),
    title: titleByAction[n.action] || 'Thông báo đơn hàng',
    body: n.content,
    time: formatTime(n.createdAt),
    isRead: n.isRead,
    isOrder: !!n.relatedOrderId,
    orderId: n.relatedOrderId,
    action: n.action,
    productImage: null,
  };
}

export default function NotificationsScreen({ navigation }: any): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, setGuestMode, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orderData, setOrderData] = useState<NotificationItem[]>([]);
  const [highlightData, setHighlightData] = useState<NotificationItem[]>(HIGHLIGHT_NOTIFICATIONS);
  const [promoData, setPromoData] = useState<NotificationItem[]>(PROMO_NOTIFICATIONS);
  const [financeData, setFinanceData] = useState<NotificationItem[]>(FINANCE_NOTIFICATIONS);

  const loadOrderNotifications = useCallback(async () => {
    try {
      const response: any = await notificationService.getNotifications(1, 50);
      const apiItems: AppNotification[] = response?.items || response || [];
      if (Array.isArray(apiItems) && apiItems.length > 0) {
        setOrderData(apiItems.map(mapApiNotification));
        return;
      }
    } catch (error) {
      console.log('load notifications error:', error);
    }

    try {
      const localItems = await notificationHelper.getNotifications();
      setOrderData(localItems?.length ? localItems : ORDER_UPDATES);
    } catch {
      setOrderData(ORDER_UPDATES);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) loadOrderNotifications();
    }, [isLoggedIn, loadOrderNotifications])
  );

  const data = useMemo(() => {
    if (activeTab === 'orders') return orderData;
    if (activeTab === 'highlights') return highlightData;
    if (activeTab === 'promo') return promoData;
    return financeData;
  }, [activeTab, financeData, highlightData, orderData, promoData]);

  const getUnread = (list: NotificationItem[]) => list.filter(item => !item.isRead).length;

  const markRead = async (id: string) => {
    const updater = (list: NotificationItem[]) =>
      list.map(item => (item.id === id ? { ...item, isRead: true } : item));

    if (activeTab === 'orders') {
      const numericId = Number(id);
      if (!Number.isNaN(numericId)) {
        try {
          await notificationService.markAsRead(numericId);
        } catch (error) {
          console.log('mark notification read error:', error);
        }
      }

      setOrderData(prev => {
        const updated = updater(prev);
        notificationHelper.saveNotifications(updated);
        return updated;
      });
    } else if (activeTab === 'highlights') {
      setHighlightData(prev => updater(prev));
    } else if (activeTab === 'promo') {
      setPromoData(prev => updater(prev));
    } else {
      setFinanceData(prev => updater(prev));
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    await markRead(item.id);

    if (!item.isOrder || !item.orderId) {
      navigation.navigate('NotificationContent', { notification: item });
      return;
    }

    if (item.action === 'OrderArrived') {
      navigation.navigate('Profile', {
        screen: 'MyOrders',
        params: { openConfirmReceiptForOrderId: item.orderId },
      });
      return;
    }

    if ((item.action === 'CashSelected' || item.action === 'TransferReported') && user?.role === 'Shipper') {
      navigation.navigate('ShipperTabs', { screen: 'Delivering' });
      return;
    }

    const body = item.body.toLowerCase();
    if (body.includes('thanh toán') || body.includes('phương thức')) {
      navigation.navigate('Profile', {
        screen: 'MyOrders',
        params: { openPaymentForOrderId: item.orderId },
      });
      return;
    }

    navigation.navigate('OrderTracking', { orderId: item.orderId, notification: item });
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const imageUri = item.productImage || item.image || ORDER_ICON;
    const isOrderTab = activeTab === 'orders';

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        activeOpacity={0.85}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.notificationImage} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        {!isOrderTab && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      </TouchableOpacity>
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={[styles.emptyAuth, { paddingTop: insets.top }]}>
        <Ionicons name="notifications-outline" size={76} color={colors.disabled} />
        <Text style={styles.emptyTitle}>Thông báo</Text>
        <Text style={styles.emptyText}>Đăng nhập để xem cập nhật đơn hàng và ưu đãi dành riêng cho bạn.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => setGuestMode(false)}>
          <Text style={styles.loginText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={24} color={colors.text} />
            <CartBadge />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('ChatList')}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
            <ChatBadge />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => {
          const source = tab.key === 'orders'
            ? orderData
            : tab.key === 'highlights'
              ? highlightData
              : tab.key === 'promo'
                ? promoData
                : financeData;
          const unread = getUnread(source);

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={styles.tabIconWrap}>
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.key ? colors.primary : colors.textSecondary}
                />
                {unread > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={data.length ? styles.listContent : styles.emptyList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={54} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>Chưa có thông báo</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabItem: {
    flex: 1,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: colors.primary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  unreadItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  imageWrap: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
    marginRight: spacing.md,
  },
  notificationImage: {
    width: '100%',
    height: '100%',
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  notificationTime: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  emptyAuth: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  loginBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  loginText: {
    color: colors.white,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyList: {
    flexGrow: 1,
    padding: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
