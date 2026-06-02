import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Linking, ActivityIndicator, Image, Clipboard, Alert, ToastAndroid, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  onDeliveryRealtime,
  startDeliveryRealtime,
} from '../../services/realtime/deliveryRealtime';

interface TrackingStep {
  id: string;
  title: string;
  desc: string;
  time: string;
  isDone: boolean;
  isCurrent: boolean;
}

export default function ShipmentTrackingScreen({ navigation, route }: any) {
  const { orderId, notification, orderUpdate } = route?.params || {};
  const numericOrderId = Number(orderId);
  const hasRealOrderId = Number.isFinite(numericOrderId) && numericOrderId > 0;
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (hasRealOrderId) {
      fetchOrderDetails();
    } else if (notification || orderUpdate) {
      useMockData();
    } else {
      setOrder(null);
      setErrorMessage('Không tìm thấy thông tin đơn hàng cần theo dõi.');
      setIsLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const data: any = await apiClient.get(`/orders/${numericOrderId}`);
      if (data) {
        setOrder(data);
        setIsUsingMock(false);
      } else {
        setOrder(null);
        setErrorMessage('Không tìm thấy thông tin vận chuyển của đơn hàng này.');
      }
    } catch (error: any) {
      console.log('Error fetching order details for tracking:', error);
      setOrder(null);
      setIsUsingMock(false);
      setErrorMessage(error?.message || 'Không thể tải thông tin vận chuyển. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasRealOrderId) return;

    startDeliveryRealtime();
    const refreshIfCurrentOrder = (payload: any) => {
      if (!payload.orderId || Number(payload.orderId) === numericOrderId) {
        fetchOrderDetails();
      }
    };

    const offOrder = onDeliveryRealtime('OrderUpdated', refreshIfCurrentOrder);
    const offShipment = onDeliveryRealtime('ShipmentUpdated', refreshIfCurrentOrder);
    return () => {
      offOrder();
      offShipment();
    };
  }, [orderId]);

  const useMockData = () => {
    // Generate beautiful mock data based on parameters or standard defaults
    const mockOrderNumber = notification?.orderId || orderUpdate?.orderId || 'ORD-26041618Q1RX22';
    const mockTitle = notification?.title || orderUpdate?.title || 'Đang giao hàng';
    
    // Simulate a mock order object structure
    const mockOrder = {
      id: 9999,
      orderNumber: mockOrderNumber,
      status: mockTitle.includes('thành công') || mockTitle.includes('Đã đến nơi') ? 'Complete' : 'Shipped',
      orderDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      shipment: {
        shipmentMethod: 'Giao Hàng Nhanh',
        trackingNumber: 'VNPOST' + Math.floor(100000 + Math.random() * 900000),
        shipperName: 'Nguyễn Văn Giao',
        shipperPhone: '0911222333',
        shipmentDate: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      }
    };
    setOrder(mockOrder);
    setIsUsingMock(true);
    setErrorMessage('');
    setIsLoading(false);
  };

  const handleCopyText = (text: string) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Đã sao chép mã vận đơn', ToastAndroid.SHORT);
    } else {
      Alert.alert('Thành công', 'Đã sao chép mã vận đơn');
    }
  };

  const handleCallShipper = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin vận chuyển...</Text>
      </View>
    );
  }

  if (errorMessage || !order) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.danger} />
        <Text style={styles.errorTitle}>Không thể tải vận chuyển</Text>
        <Text style={styles.errorSubtitle}>{errorMessage || 'Không tìm thấy thông tin vận chuyển.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={hasRealOrderId ? fetchOrderDetails : () => navigation.goBack()}>
          <Text style={styles.retryBtnText}>{hasRealOrderId ? 'Thử lại' : 'Quay lại'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Parse chronological steps based on backend state mapping
  const buildTrackingSteps = (orderData: any): TrackingStep[] => {
    if (!orderData) return [];

    const formatTime = (dateStr: string | null | undefined) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.toLocaleDateString('vi-VN')}`;
    };

    const status = orderData.status;
    const isCanceled = status === 'Canceled';
    const isComplete = status === 'Complete';
    const isShipped = status === 'Shipped';
    const isUnshipped = status === 'Unshipped';
    const hasShipper = orderData.shipment?.shipperId != null || 
                       orderData.shipment?.shipperName != null ||
                       status === 'Shipped' || 
                       status === 'Complete';

    const orderDate = orderData.orderDate;
    const shipmentDate = orderData.shipment?.shipmentDate || orderDate;
    const assignedAt = orderData.shipment?.assignedAt || shipmentDate;
    const deliveredAt = orderData.shipment?.deliveredAt || assignedAt;

    // Define the 5 chronological steps
    const steps: TrackingStep[] = [
      {
        id: '1',
        title: 'Đơn đã được đặt',
        desc: 'Đơn hàng của bạn đã được đặt thành công.',
        time: formatTime(orderDate),
        isDone: true,
        isCurrent: status === 'Pending',
      },
      {
        id: '2',
        title: 'Người bán đang chuẩn bị hàng',
        desc: 'Người bán đã xác nhận đơn hàng và đang chuẩn bị đóng gói sản phẩm.',
        time: !isCanceled && status !== 'Pending' ? formatTime(shipmentDate) : '',
        isDone: !isCanceled && status !== 'Pending',
        isCurrent: !isCanceled && isUnshipped,
      },
      {
        id: '3',
        title: 'Đơn vị vận chuyển đã nhận đơn hàng',
        desc: hasShipper 
          ? `Shipper ${orderData.shipment?.shipperName} đã nhận vận chuyển đơn hàng này.` 
          : 'Đang chờ đơn vị vận chuyển tiếp nhận đơn hàng.',
        time: !isCanceled && hasShipper ? formatTime(assignedAt) : '',
        isDone: !isCanceled && hasShipper,
        isCurrent: false, 
      },
      {
        id: '4',
        title: 'Đơn hàng đang được giao đến bạn',
        desc: hasShipper 
          ? `Shipper ${orderData.shipment?.shipperName || 'Nguyễn Văn Giao'} đang trên đường giao hàng đến bạn.` 
          : 'Đơn hàng đang trên đường giao đến bạn.',
        time: !isCanceled && hasShipper && (isShipped || isComplete) ? formatTime(assignedAt) : '',
        isDone: !isCanceled && hasShipper && (isShipped || isComplete),
        isCurrent: !isCanceled && isShipped,
      },
      {
        id: '5',
        title: 'Đơn hàng đã đến nơi',
        desc: 'Đơn hàng đã được giao thành công.',
        time: !isCanceled && isComplete ? formatTime(deliveredAt) : '',
        isDone: !isCanceled && isComplete,
        isCurrent: !isCanceled && isComplete,
      }
    ];

    return steps;
  };

  const trackingSteps = buildTrackingSteps(order);
  const isCanceled = order?.status === 'Canceled';
  const shipper = order?.shipment;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin vận chuyển</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner hủy đơn nếu có */}
        {isCanceled && (
          <View style={styles.cancelBanner}>
            <Ionicons name="close-circle" size={24} color="#FFF" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cancelTitle}>Đơn hàng đã bị hủy</Text>
              <Text style={styles.cancelDesc}>Quá trình vận chuyển đã dừng lại do đơn hàng bị hủy.</Text>
            </View>
          </View>
        )}

        {/* Top Info Card */}
        <View style={styles.topInfoCard}>
          <View style={styles.carrierIconBg}>
            <Ionicons name="bicycle" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.carrier}>
              {order?.status === 'Shipped' || order?.status === 'Complete'
                ? `Người giao hàng: ${shipper?.shipperName || 'Nguyễn Văn Giao'} ${shipper?.shipperPhone ? `(${shipper.shipperPhone})` : '(0911222333)'}`
                : (shipper?.shipmentMethod || 'SPX Express')}
            </Text>
            <Text style={styles.trackingNo}>Mã vận đơn: <Text style={{ fontWeight: '700', color: colors.text }}>{shipper?.trackingNumber || 'SPXVN00122904'}</Text></Text>
            <TouchableOpacity onPress={() => handleCopyText(shipper?.trackingNumber || 'SPXVN00122904')} style={styles.copyBadge}>
              <Ionicons name="copy-outline" size={12} color={colors.primary} />
              <Text style={styles.copyText}>SAO CHÉP MÃ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shipper Profile Card if Shipper Assigned */}
        {shipper?.shipperName && (
          <View style={styles.shipperCard}>
            <Text style={styles.sectionTitle}>Thông tin Shipper giao hàng</Text>
            <View style={styles.shipperProfileRow}>
              <Image
                source={{ uri: `https://i.pravatar.cc/150?u=${shipper.shipperName}` }}
                style={styles.shipperAvatar}
              />
              <View style={styles.shipperDetails}>
                <Text style={styles.shipperName}>{shipper.shipperName}</Text>
                <Text style={styles.shipperRating}>
                  <Ionicons name="star" size={14} color="#FFD700" /> 4.9 • Giao hàng chuyên nghiệp
                </Text>
                {shipper.shipperPhone ? (
                  <Text style={styles.shipperPhone}>{shipper.shipperPhone}</Text>
                ) : null}
              </View>
              {shipper.shipperPhone ? (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCallShipper(shipper.shipperPhone)}
                >
                  <Ionicons name="call" size={20} color="#FFF" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* Chronological Shipping Timeline Card */}
        <View style={styles.timelineCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Trạng thái đơn hàng</Text>

          {trackingSteps.map((item, index) => {
            const isLast = index === trackingSteps.length - 1;
            const stepDone = item.isDone;
            const stepCurrent = item.isCurrent;

            return (
              <View key={item.id} style={styles.timelineRow}>
                {/* Visual line and dot indicator */}
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    stepDone && styles.timelineDotDone,
                    stepCurrent && styles.timelineDotCurrent
                  ]}>
                    {stepDone && !stepCurrent ? (
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    ) : stepCurrent ? (
                      <View style={styles.dotPulse} />
                    ) : null}
                  </View>
                  {!isLast && (
                    <View style={[
                      styles.timelineLine,
                      stepDone && (trackingSteps[index + 1].isDone || trackingSteps[index + 1].isCurrent) && styles.timelineLineActive
                    ]} />
                  )}
                </View>

                {/* Step contents */}
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineTitle,
                    stepDone && styles.timelineTitleActive,
                    stepCurrent && styles.timelineTitleCurrent
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={styles.timelineDesc}>{item.desc}</Text>
                  {item.time ? (
                    <Text style={styles.timelineTime}>{item.time}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: 14 },
  errorTitle: { marginTop: 14, color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  errorSubtitle: { marginTop: 8, color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retryBtn: { marginTop: 18, borderRadius: 8, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12 },
  retryBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scrollContent: { padding: 12 },

  cancelBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.danger,
    padding: 14, borderRadius: 10, marginBottom: 12, ...shadow.sm
  },
  cancelTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  cancelDesc: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },

  topInfoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    padding: 16, borderRadius: borderRadius.md, ...shadow.sm, marginBottom: 12
  },
  carrierIconBg: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF5F5',
    justifyContent: 'center', alignItems: 'center'
  },
  carrier: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  trackingNo: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  copyBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4
  },
  copyText: { fontSize: 10, fontWeight: '700', color: colors.primary },

  shipperCard: {
    backgroundColor: colors.white, padding: 16, borderRadius: borderRadius.md,
    ...shadow.sm, marginBottom: 12
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  shipperProfileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  shipperAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD' },
  shipperDetails: { flex: 1, marginLeft: 14 },
  shipperName: { fontSize: 15, fontWeight: '700', color: colors.text },
  shipperRating: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  shipperPhone: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 3 },
  callBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center', ...shadow.sm
  },

  timelineCard: {
    backgroundColor: colors.white, padding: 20, borderRadius: borderRadius.md, ...shadow.sm
  },
  timelineRow: { flexDirection: 'row' },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', zIndex: 2, marginTop: 2
  },
  timelineDotDone: { backgroundColor: colors.primary },
  timelineDotCurrent: {
    backgroundColor: colors.primary, width: 18, height: 18, borderRadius: 9,
    borderWidth: 3, borderColor: '#FFEBEE'
  },
  dotPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: -2 },
  timelineLineActive: { backgroundColor: colors.primary },

  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 24 },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  timelineTitleActive: { color: '#333', fontWeight: '600' },
  timelineTitleCurrent: { color: colors.primary, fontWeight: '700' },
  timelineDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  timelineTime: { fontSize: 12, color: colors.textMuted, marginTop: 4 }
});
