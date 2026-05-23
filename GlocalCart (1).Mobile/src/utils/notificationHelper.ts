import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveProductImageUrl } from './imageUtils';

const STORAGE_KEY = '@app_notifications';

const INITIAL_MOCK_NOTIFICATIONS = [
  {
    id: 'ord1',
    title: 'Giao kiện hàng thành công',
    body: 'Kiện hàng của đơn hàng #ORD20261001 đã giao thành công đến bạn.',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
    isRead: false,
    isOrder: true,
    orderId: 'ORD20261001',
  },
  {
    id: 'ord2',
    title: 'Đơn hàng đang được giao',
    body: 'Đơn hàng #ORD20261002 đang trên đường giao đến bạn. Dự kiến giao hôm nay.',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
    isRead: true,
    isOrder: true,
    orderId: 'ORD20261002',
  },
];

export const notificationHelper = {
  getNotifications: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // If empty, initialize with mock data
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_NOTIFICATIONS));
      return INITIAL_MOCK_NOTIFICATIONS;
    } catch (e) {
      console.log('Error getting notifications:', e);
      return INITIAL_MOCK_NOTIFICATIONS;
    }
  },

  saveNotifications: async (notifications: any[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.log('Error saving notifications:', e);
    }
  },

  updateOrderNotification: async (orderNumber: string, status: string, productName?: string, productImage?: string) => {
    try {
      const notifications = await notificationHelper.getNotifications();
      
      let title = '';
      let body = '';
      
      const prodName = productName || 'Sản phẩm';
      
      switch (status) {
        case 'Pending':
          title = 'Đặt hàng thành công';
          body = `Đơn hàng #${orderNumber} (${prodName}) đã được đặt thành công và đang chờ xác nhận.`;
          break;
        case 'Unshipped':
          title = 'Người bán đang chuẩn bị hàng';
          body = `Người bán đã xác nhận đơn hàng #${orderNumber} (${prodName}) và đang đóng gói sản phẩm.`;
          break;
        case 'Shipped':
          title = 'Đơn hàng đang được giao';
          body = `Đơn hàng #${orderNumber} (${prodName}) đang trên đường giao đến bạn.`;
          break;
        case 'Complete':
          title = 'Giao hàng thành công';
          body = `Đơn hàng #${orderNumber} (${prodName}) đã được giao thành công đến bạn.`;
          break;
        case 'Canceled':
          title = 'Đơn hàng đã bị hủy';
          body = `Đơn hàng #${orderNumber} (${prodName}) đã bị hủy thành công.`;
          break;
        default:
          title = 'Cập nhật đơn hàng';
          body = `Trạng thái đơn hàng #${orderNumber} đã thay đổi sang: ${status}`;
      }

      const formattedTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
      
      // Resolve product image url
      let imgUrl = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200'; // Default sneaker placeholder
      if (productImage) {
        imgUrl = resolveProductImageUrl(productImage) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200';
      }

      // Check if there is already a notification for this orderId
      const existingIdx = notifications.findIndex((n: any) => n.orderId === orderNumber);
      
      if (existingIdx !== -1) {
        // Update existing notification
        const existingNotif = notifications[existingIdx];
        existingNotif.title = title;
        existingNotif.body = body;
        existingNotif.time = formattedTime;
        existingNotif.isRead = false; // Mark as unread!
        if (productImage) {
          existingNotif.productImage = imgUrl;
        }
        
        // Remove from current position
        notifications.splice(existingIdx, 1);
        // Move to the very top (nổi lên trên đầu)!
        notifications.unshift(existingNotif);
      } else {
        // Create a new notification
        const newNotif = {
          id: 'ord_' + Date.now(),
          title: title,
          body: body,
          time: formattedTime,
          productImage: imgUrl,
          isRead: false,
          isOrder: true,
          orderId: orderNumber,
        };
        // Add to the top!
        notifications.unshift(newNotif);
      }

      await notificationHelper.saveNotifications(notifications);
    } catch (e) {
      console.log('Error updating order notification:', e);
    }
  }
};
