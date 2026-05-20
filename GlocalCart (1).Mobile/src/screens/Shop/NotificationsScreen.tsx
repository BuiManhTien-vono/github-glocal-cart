import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useCartStore } from '../../store/useCartStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../context/AuthContext';
import { CartBadge } from '../../components/common/CartBadge';
import { ChatBadge } from '../../components/common/ChatBadge';
import { notificationService, AppNotification } from '../../services/api/notificationService';

// ─── Mock Data ───
const ORDER_UPDATES = [
  {
    id: 'ord1',
    title: 'Giao kiện hàng thành công',
    body: 'Kiện hàng SPXVN060869737914 của đơn hàng #26041618Q1RX22 đã giao thành công đến bạn.',
    time: '15:31 14-05-26',
    productImage: null, // có thể truyền URL ảnh sản phẩm
    isRead: false,
    isOrder: true,
    orderId: '26041618Q1RX22',
    history: [
      { title: 'Giao kiện hàng thành công', body: 'Đã xác nhận nhận hàng.', time: '15:31 14-05-26' },
      { title: 'Đang giao hàng', body: 'Đơn hàng đang trong quá trình vận chuyển.', time: '08:15 14-05-26' },
      { title: 'Đang vận chuyển', body: 'Đơn hàng đã rời kho phân loại.', time: '08:28 13-05-26' },
    ],
  },
  {
    id: 'ord2',
    title: 'Đơn hàng đang được giao',
    body: 'Đơn hàng #26041618ABCD đang trên đường giao đến bạn. Dự kiến giao ngày mai.',
    time: '08:00 14-05-26',
    productImage: null,
    isRead: true,
    isOrder: true,
    orderId: '26041618ABCD',
    history: [
      { title: 'Đang giao hàng', body: 'Nhân viên giao hàng đang trên đường đến.', time: '08:00 14-05-26' },
      { title: 'Người bán đã xác nhận', body: 'Người bán đã xác nhận và chuẩn bị gói hàng.', time: '19:00 13-05-26' },
    ],
  },
];

const HIGHLIGHT_NOTIFICATIONS = [
  {
    id: 'hl1', title: 'Hoàn tiền thành công',
    body: 'Bạn vừa được hoàn 25.000đ vào ví Glocal từ đơn hàng #260416.',
    time: '11:20 14-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png',
    isRead: false, isOrder: false,
  },
  {
    id: 'hl2', title: 'Liên kết ngân hàng',
    body: 'Liên kết MB Bank ngay để nhận gói quà tặng 500k cho người mới.',
    time: '15:00 12-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/2830/2830266.png',
    isRead: true, isOrder: false,
  },
  {
    id: 'hl3', title: 'Voucher mới dành cho bạn',
    body: 'Bạn có 2 voucher giảm giá mới từ GlocalCart. Dùng ngay hôm nay!',
    time: '09:00 11-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/3094/3094211.png',
    isRead: true, isOrder: false,
  },
];

const PROMO_NOTIFICATIONS = [
  {
    id: 'pr1', title: '🎁 Voucher miễn ship cho bạn!',
    body: 'Nhận ngay voucher miễn phí vận chuyển toàn sàn, áp dụng cho đơn từ 99k.',
    time: '08:00 15-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/1390/1390166.png',
    isRead: false, isOrder: false,
  },
  {
    id: 'pr2', title: '🔥 Flash Sale 12h hôm nay',
    body: 'Hàng ngàn sản phẩm giảm đến 80%. Mua ngay trước khi hết!',
    time: '07:00 15-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/3094/3094196.png',
    isRead: true, isOrder: false,
  },
  {
    id: 'pr3', title: '💛 Thẻ quà "đa-zi-năng" tặng ai cũng được',
    body: 'Mua thẻ quà GlocalCart – tặng ai cũng được, dùng mọi sản phẩm.',
    time: '15:00 13-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/1170/1170678.png',
    isRead: true, isOrder: false,
  },
];

const FINANCE_NOTIFICATIONS = [
  {
    id: 'fi1', title: 'Voucher miễn lãi kì đầu',
    body: '🎁 Voucher miễn lãi kì đầu cho bạn khi liên kết thẻ tín dụng mới.',
    time: '10:00 14-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/2830/2830211.png',
    isRead: false, isOrder: false,
  },
  {
    id: 'fi2', title: 'Glocal Pay – Ví điện tử',
    body: 'Nạp tiền vào Glocal Pay để thanh toán dễ dàng hơn và nhận thêm ưu đãi.',
    time: '09:00 12-05-26',
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    isRead: true, isOrder: false,
  },
];

// ─── Order fallback icon ───
const ORDER_ICON = 'https://cdn-icons-png.flaticon.com/512/679/679821.png';

type TabType = 'orders' | 'highlights' | 'promo' | 'finance';

const TABS = [
  { key: 'orders' as TabType, icon: 'cube-outline', label: 'Đơn hàng' },
  { key: 'highlights' as TabType, icon: 'star-outline', label: 'Nổi bật' },
  { key: 'promo' as TabType, icon: 'pricetag-outline', label: 'Khuyến mãi' },
  { key: 'finance' as TabType, icon: 'card-outline', label: 'Tài chính' },
];

function mapApiNotification(n: AppNotification) {
  const created = new Date(n.createdAt);
  const time = created.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
  const isOrder = !!n.relatedOrderId;
  let title = 'Thông báo đơn hàng';
  if (n.action === 'OrderArrived') title = 'Đơn hàng đã đến nơi';
  else if (n.action === 'CashSelected') title = 'Khách chọn tiền mặt';
  else if (n.action === 'TransferReported') title = 'Khách đã chuyển khoản';
  else if (n.action === 'OrderDelivered') title = 'Giao hàng thành công';
  else if (n.action === 'OrderAccepted') title = 'Shipper đã nhận đơn';

  return {
    id: String(n.id),
    title,
    body: n.content,
    time,
    isRead: n.isRead,
    isOrder,
    orderId: n.relatedOrderId,
    action: n.action,
    productImage: null,
  };
}

export default function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, setGuestMode, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orderData, setOrderData] = useState<any[]>([]);
  const [highlightData, setHighlightData] = useState(HIGHLIGHT_NOTIFICATIONS);
  const [promoData, setPromoData] = useState(PROMO_NOTIFICATIONS);
  const [financeData, setFinanceData] = useState(FINANCE_NOTIFICATIONS);

  const loadOrderNotifications = useCallback(async () => {
    try {
      const res: any = await notificationService.getNotifications(1, 50);
      const items: AppNotification[] = res?.items || [];
      setOrderData(items.map(mapApiNotification));
    } catch (e) {
      console.log('load notifications', e);
      setOrderData(ORDER_UPDATES);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadOrderNotifications();
  }, [isLoggedIn, loadOrderNotifications]);

  if (!isLoggedIn) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="notifications-outline" size={80} color="#ccc" />
        <Text style={{ fontSize: 18, color: '#333', fontWeight: 'bold', marginTop: 20 }}>Thông báo</Text>
        <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginTop: 10, marginBottom: 30 }}>
          Đăng nhập để xem các cập nhật mới nhất về đơn hàng và ưu đãi dành riêng cho bạn.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 4 }}
          onPress={() => setGuestMode(false)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>ĐĂNG NHẬP</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getUnread = (list: any[]) => list.filter(x => !x.isRead).length;

  const markRead = async (id: string) => {
    if (activeTab === 'orders') {
      try {
        await notificationService.markAsRead(Number(id));
      } catch (e) {
        console.log('mark read', e);
      }
    }
    const updater = (list: any[]) => list.map(x => x.id === id ? { ...x, isRead: true } : x);
    if (activeTab === 'orders') setOrderData(prev => updater(prev));
    else if (activeTab === 'highlights') setHighlightData(prev => updater(prev));
    else if (activeTab === 'promo') setPromoData(prev => updater(prev));
    else setFinanceData(prev => updater(prev));
  };

  const handleNotificationPress = (item: any) => {
    markRead(item.id);
    if (item.isOrder && item.orderId) {
      if (item.action === 'OrderArrived') {
        navigation.navigate('Profile', {
          screen: 'MyOrders',
          params: { openConfirmReceiptForOrderId: item.orderId },
        });
        return;
      }
      if (item.action === 'CashSelected' || item.action === 'TransferReported') {
        if (user?.role === 'Shipper') {
          navigation.navigate('ShipperTabs', { screen: 'Delivering' });
        }
        return;
      }
      const lowerBody = item.body?.toLowerCase() || '';
      if (lowerBody.includes('thanh toán') || lowerBody.includes('phương thức')) {
        navigation.navigate('Profile', {
          screen: 'MyOrders',
          params: { openPaymentForOrderId: item.orderId },
        });
      } else {
        navigation.navigate('OrderTracking', { notification: item, orderUpdate: item });
      }
    } else if (!item.isOrder) {
      navigation.navigate('NotificationContent', { notification: item });
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    // Ưu tiên ảnh sản phẩm, fallback icon đơn hàng hoặc image
    const iconSource = item.productImage
      ? { uri: item.productImage }
      : item.isOrder
        ? { uri: ORDER_ICON }
        : { uri: item.image };

    return (
      <TouchableOpacity
        style={[s.notifItem, !item.isRead && s.notifItemUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={s.notifIconWrap}>
          <Image source={iconSource} style={s.notifIcon} resizeMode="contain" />
          {!item.isRead && <View style={s.unreadDot} />}
        </View>
        <View style={s.notifBody}>
          <Text style={[s.notifTitle, !item.isRead && s.notifTitleBold]}>{item.title}</Text>
          <Text style={s.notifDesc} numberOfLines={2}>{item.body}</Text>
          <Text style={s.notifTime}>{item.time}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ marginTop: 4 }} />
      </TouchableOpacity>
    );
  };

  const getTabData = (): any[] => {
    switch (activeTab) {
      case 'orders': return orderData;
      case 'highlights': return highlightData;
      case 'promo': return promoData;
      case 'finance': return financeData;
      default: return [];
    }
  };

  const getUnreadForTab = (key: TabType) => {
    switch (key) {
      case 'orders': return getUnread(orderData);
      case 'highlights': return getUnread(highlightData);
      case 'promo': return getUnread(promoData);
      case 'finance': return getUnread(financeData);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* ─── Header ─── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Thông báo</Text>
        <View style={s.headerIcons}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={24} color="#333" />
            <CartBadge />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('ChatList')}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" />
            <ChatBadge />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Tabs scrollable ─── */}
      <View style={s.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScroll}>
          {TABS.map(tab => {
            const unread = getUnreadForTab(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[s.tab, isActive && s.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons name={tab.icon as any} size={15} color={isActive ? colors.primary : '#999'} />
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
                {unread > 0 && (
                  <View style={s.tabBadge}><Text style={s.tabBadgeText}>{unread}</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── List ─── */}
      <FlatList
        data={getTabData()}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        contentContainerStyle={{ paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="notifications-off-outline" size={60} color="#ddd" />
            <Text style={s.emptyText}>Chưa có thông báo nào</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6, position: 'relative' },

  tabsWrapper: { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  tabsScroll: { paddingHorizontal: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 12, gap: 5,
    borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: 4,
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, color: '#999', fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  tabBadge: {
    backgroundColor: colors.primary, borderRadius: 8,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
  },
  notifItemUnread: { backgroundColor: '#FFFAF9' },
  notifIconWrap: { width: 56, height: 56, marginRight: 14, position: 'relative' },
  notifIcon: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#f5f5f5' },
  unreadDot: {
    position: 'absolute', top: -2, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary, borderWidth: 1.5, borderColor: '#fff',
  },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14, color: '#333', marginBottom: 4 },
  notifTitleBold: { fontWeight: '700', color: '#111' },
  notifDesc: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 6 },
  notifTime: { fontSize: 12, color: '#aaa' },
  separator: { height: 0.5, backgroundColor: '#f0f0f0' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#bbb' },
});
