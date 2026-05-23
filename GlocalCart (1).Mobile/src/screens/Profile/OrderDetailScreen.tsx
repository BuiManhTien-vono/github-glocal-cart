import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Modal, FlatList, Dimensions, Clipboard, ToastAndroid, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { Loading } from '../../components/common/Loading';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { notificationHelper } from '../../utils/notificationHelper';

export default function OrderDetailScreen({ navigation, route }: any) {
    const orderId = route?.params?.orderId;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});

    const [isBillingExpanded, setIsBillingExpanded] = useState(false);
    const [isTimeExpanded, setIsTimeExpanded] = useState(false);

    // Cancellation Modal State
    const [isCancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState<string>('');

    // Review Details Modal State
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [isReviewModalVisible, setReviewModalVisible] = useState(false);
    const [isReviewLoading, setReviewLoading] = useState(false);

    const cancelReasons = [
        'Thay đổi địa chỉ giao hàng',
        'Đổi ý, không muốn mua nữa',
        'Tìm thấy chỗ mua khác tốt hơn (Rẻ hơn, uy tín hơn, giao nhanh hơn...)',
        'Thay đổi sản phẩm (Kích thước, màu sắc, số lượng...)',
        'Đặt trùng đơn hàng'
    ];

    useFocusEffect(
        React.useCallback(() => {
            const loadReviewedKeys = async () => {
                try {
                    const keys = await AsyncStorage.getAllKeys();
                    const reviewKeys = keys.filter(k => k.startsWith('@reviewed_'));
                    const map: Record<string, boolean> = {};
                    reviewKeys.forEach(k => map[k] = true);
                    setReviewedOrders(map);
                } catch (e) {}
            };
            loadReviewedKeys();
        }, [])
    );
    const initialOrder = route?.params?.newOrder;

    useEffect(() => {
        if (orderId) {
            fetchOrderDetail();
        } else if (initialOrder) {
            setOrder(initialOrder);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            const data: any = await apiClient.get(`/orders/${orderId}`);
            setOrder(data);

            // Check review status dynamically from the database
            const firstProd = data?.items?.[0];
            if (firstProd && user?.id) {
                try {
                    const res: any = await apiClient.get(`/products/${firstProd.productId}/reviews`);
                    const reviewsList = res?.items || res || [];
                    const myReview = reviewsList.find((r: any) => String(r.userId) === String(user.id));
                    if (myReview) {
                        setReviewedOrders(prev => ({
                            ...prev,
                            [`@reviewed_${orderId}_${firstProd.productId}`]: true
                        }));
                    }
                } catch (e) {
                    console.log('Failed to fetch product review status', e);
                }
            }
        } catch (error) {
            console.log('fetchOrderDetail error:', error);
            if (initialOrder) {
                setOrder(initialOrder);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };
    const handleCancelOrder = () => {
        setCancelReason(cancelReasons[0]);
        setCancelModalVisible(true);
    };

    const handleConfirmCancel = async () => {
        try {
            setCancelModalVisible(false);
            setIsLoading(true);
            await apiClient.patch(`/orders/${orderId}/cancel`, { reason: cancelReason });
            
            if (order) {
                await notificationHelper.updateOrderNotification(
                    order.orderNumber,
                    'Canceled',
                    order.items?.[0]?.productName,
                    order.items?.[0]?.productImage
                );
            }
            
            Alert.alert('Thành công', 'Hủy đơn hàng thành công', [
                { text: 'OK', onPress: () => navigation.replace('CancelOrderDetailScreen', { orderId }) }
            ]);
        } catch (error) {
            console.log('Cancel order error:', error);
            Alert.alert('Lỗi', 'Không thể hủy đơn hàng lúc này');
            setIsLoading(false);
        }
    };

    const handleCopyCode = (code: string) => {
        Clipboard.setString(code);
        if (Platform.OS === 'android') {
            ToastAndroid.show('Đã sao chép', ToastAndroid.SHORT);
        } else {
            Alert.alert('Thành công', 'Đã sao chép mã đơn hàng');
        }
    };

    const handleRepurchase = async () => {
        if (!order?.items) return;
        try {
            setIsLoading(true);
            for (const item of order.items) {
                await apiClient.post('/cart/items', { productId: item.productId, quantity: item.quantity });
            }
            // Tự động điều hướng đến giỏ hàng luôn
            navigation.navigate('Cart');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng lúc này');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewReview = async (productId: number) => {
        try {
            setReviewLoading(true);
            setReviewModalVisible(true);
            setSelectedReview(null);
            const res: any = await apiClient.get(`/products/${productId}/reviews`);
            const reviewsList = res?.items || res || [];
            // Tìm review của user hiện tại với type-safe check
            const myReview = reviewsList.find((r: any) => String(r.userId) === String(user?.id));
            if (myReview) {
                setSelectedReview(myReview);
            } else {
                setSelectedReview({ notFound: true });
            }
        } catch (error) {
            console.log('Error fetching review:', error);
            setSelectedReview({ error: true });
        } finally {
            setReviewLoading(false);
        }
    };

    if (isLoading) return <Loading />;
    if (!order) return (
        <View style={styles.center}>
            <Text>Không tìm thấy thông tin đơn hàng</Text>
            <TouchableOpacity onPress={handleBack}>
                <Text style={{ color: colors.primary, marginTop: 10 }}>Quay lại</Text>
            </TouchableOpacity>
        </View>
    );

    const firstItem = order.items?.[0];
    const isReviewed = order.items?.some((i: any) => reviewedOrders[`@reviewed_${order.id}_${i.productId}`]);

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.toLocaleDateString('vi-VN')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const orderDate = order.orderDate || order.createdAt || new Date().toISOString();
    const payDate = new Date(new Date(orderDate).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const shipDate = new Date(new Date(orderDate).getTime() + 24 * 60 * 60 * 1000).toISOString();
    const completeDate = new Date(new Date(orderDate).getTime() + 48 * 60 * 60 * 1000).toISOString();

    const getBannerDetails = (status: string) => {
        switch (status) {
            case 'Complete':
                return {
                    bg: '#559083',
                    text: '#FFFFFF',
                    title: 'Đơn hàng đã hoàn thành',
                    icon: 'checkmark-circle'
                };
            case 'Shipped':
                return {
                    bg: '#4A90E2',
                    text: '#FFFFFF',
                    title: 'Đơn hàng đang giao',
                    icon: 'car-sport'
                };
            case 'Unshipped':
                return {
                    bg: '#E67E22',
                    text: '#FFFFFF',
                    title: 'Đang chuẩn bị hàng',
                    icon: 'cube'
                };
            case 'Pending':
                return {
                    bg: '#F1C40F',
                    text: '#FFFFFF',
                    title: 'Chờ xác nhận',
                    icon: 'time'
                };
            case 'Canceled':
                return {
                    bg: '#E74C3C',
                    text: '#FFFFFF',
                    title: 'Đơn hàng đã hủy',
                    icon: 'close-circle'
                };
            default:
                return {
                    bg: '#7F8C8D',
                    text: '#FFFFFF',
                    title: 'Đơn hàng đang xử lý',
                    icon: 'information-circle'
                };
        }
    };

    const banner = getBannerDetails(order.status);

    const recipientName = order.shippingAddress?.fullName || order.shippingAddress?.name || user?.fullName || 'Người nhận';
    const recipientPhone = order.shippingAddress?.phone || user?.phone || '0987654321';
    const recipientAddressStr = order.shippingAddress?.streetAddress || [
        order.shippingAddress?.street,
        order.shippingAddress?.ward,
        order.shippingAddress?.district,
        order.shippingAddress?.city
    ].filter(Boolean).join(', ') || 'Không tìm thấy địa chỉ giao hàng';

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={18} color="#FFD700" style={{ marginRight: 2 }} />
            );
        }
        return <View style={{ flexDirection: 'row', marginVertical: 6 }}>{stars}</View>;
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông tin đơn hàng</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Unified Card: Status Banner + Shipping + Address */}
                <View style={styles.unitedCard}>
                    {/* Banner trạng thái */}
                    <View style={[styles.statusBanner, { backgroundColor: banner.bg }]}>
                        <Text style={styles.statusBannerTitle}>{banner.title}</Text>
                    </View>

                    {/* Thông tin vận chuyển */}
                    <TouchableOpacity style={styles.shippingSection} onPress={() => navigation.navigate('ShipmentTracking', { orderId: order.id })}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.sectionTitle}>Thông tin vận chuyển</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </View>
                        <Text style={styles.shippingCarrier}>
                            {(order.status === 'Shipped' || order.status === 'Complete') 
                                ? `Người giao hàng: ${order.shipment?.shipperName || 'Nguyễn Văn Giao'} ${order.shipment?.shipperPhone ? `(${order.shipment.shipperPhone})` : '(0911222333)'}`
                                : `${order.shipment?.shipmentMethod || 'SPX Express'}: ${order.shipment?.trackingNumber || 'SPXVN045479240722'}`}
                        </Text>
                        
                        {order.status === 'Complete' ? (
                            <View style={styles.trackRow}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#559083" style={{ marginRight: 8, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.trackDesc}>
                                        Đơn hàng đã được shipper {order.shipment?.shipperName || 'Nguyễn Văn Giao'} giao thành công
                                    </Text>
                                    <Text style={styles.trackTime}>{formatTime(completeDate)}</Text>
                                </View>
                            </View>
                        ) : order.status === 'Shipped' ? (
                            <View style={styles.trackRow}>
                                <Ionicons name="car-outline" size={20} color={colors.secondary} style={{ marginRight: 8, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.trackDesc, { color: colors.secondary }]}>
                                        Đơn vị vận chuyển đã nhận đơn & đang giao đến bạn (Shipper: {order.shipment?.shipperName || 'Nguyễn Văn Giao'})
                                    </Text>
                                </View>
                            </View>
                        ) : order.status === 'Pending' ? (
                            <View style={styles.trackRow}>
                                <Ionicons name="time-outline" size={20} color={colors.warning} style={{ marginRight: 8, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.trackDesc, { color: colors.warning }]}>Đơn hàng đã đặt thành công (Đang chờ xác nhận)</Text>
                                </View>
                            </View>
                        ) : order.status === 'Canceled' ? (
                            <View style={styles.trackRow}>
                                <Ionicons name="close-circle-outline" size={20} color={colors.danger} style={{ marginRight: 8, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.trackDesc, { color: colors.danger }]}>Đơn hàng đã bị hủy</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.trackRow}>
                                <Ionicons name="cube-outline" size={20} color={colors.info} style={{ marginRight: 8, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.trackDesc, { color: colors.info }]}>Người bán đang chuẩn bị hàng</Text>
                                </View>
                            </View>
                        )}

                        {((order.status === 'Shipped' || order.status === 'Complete') || order.shipment?.shipperName) && (
                            <View style={styles.shipperRowDetail}>
                                <Ionicons name="person-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                                <Text style={styles.shipperText}>
                                    Shipper: <Text style={{ fontWeight: '700' }}>{order.shipment?.shipperName || 'Nguyễn Văn Giao'}</Text>
                                    {` (${order.shipment?.shipperPhone || '0911222333'})`}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Line Separator */}
                    <View style={styles.cardSeparator} />

                    {/* Địa chỉ nhận hàng */}
                    <View style={styles.addressSection}>
                        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Địa chỉ nhận hàng</Text>
                        <View style={styles.rowStart}>
                            <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.valName}>
                                    {recipientName} <Text style={[styles.valDesc, { fontWeight: '400' }]}>(+84) {recipientPhone}</Text>
                                </Text>
                                <Text style={[styles.valDesc, { marginTop: 4, lineHeight: 18 }]}>
                                    {recipientAddressStr}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Danh sách sản phẩm trong Card */}
                <View style={styles.card}>
                    <View style={styles.shopRow}>
                        <View style={styles.shopBadge}>
                            <Text style={styles.shopBadgeText}>Yêu thích</Text>
                        </View>
                        <Text style={styles.shopName}>{order.items?.[0]?.sellerName || 'Ăn Cùng Bà Tuyết'}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </View>

                    {order.items?.map((item: any, idx: number) => {
                        const img = item.productImage ? resolveProductImageUrl(item.productImage) : null;
                        return (
                            <View key={idx} style={[styles.productRow, idx === order.items.length - 1 && { borderBottomWidth: 0 }]}>
                                <View style={styles.prodImg}>
                                    {img ? (
                                        <Image source={{ uri: img }} style={styles.fullImg} />
                                    ) : (
                                        <Ionicons name="cube-outline" size={30} color={colors.textMuted} />
                                    )}
                                </View>
                                <View style={styles.prodInfo}>
                                    <View style={styles.rowBetween}>
                                        <Text style={styles.prodTitle} numberOfLines={2}>{item.productName}</Text>
                                        <Text style={styles.prodQty}>x{item.quantity}</Text>
                                    </View>
                                    <View style={styles.rowEnd}>
                                        <Text style={styles.prodPrice}>{item.unitPrice?.toLocaleString('vi-VN')}đ</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {/* Hàng Thành tiền có thể click để mở rộng, căn phải hoàn toàn */}
                    <TouchableOpacity style={styles.orderTotalRowClickable} onPress={() => setIsBillingExpanded(!isBillingExpanded)} activeOpacity={0.7}>
                        <View style={styles.rowEnd}>
                            <Text style={styles.totalLabel}>Thành tiền: </Text>
                            <Text style={styles.sumValPrice}>{order.totalAmount?.toLocaleString('vi-VN')}đ</Text>
                            <Ionicons name={isBillingExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                        </View>
                    </TouchableOpacity>

                    {isBillingExpanded && (
                        <View style={styles.billingBreakdown}>
                            <View style={styles.billingRow}>
                                <Text style={styles.billingLabel}>Tổng tiền hàng</Text>
                                <Text style={styles.billingValue}>{order.totalAmount?.toLocaleString('vi-VN')}đ</Text>
                            </View>
                            <View style={styles.billingRow}>
                                <Text style={styles.billingLabel}>Phí vận chuyển</Text>
                                <Text style={styles.billingValue}>0đ</Text>
                            </View>
                            <View style={[styles.billingRow, { borderTopWidth: 0.5, borderTopColor: colors.borderLight, paddingTop: 8, marginTop: 4 }]}>
                                <Text style={[styles.billingLabel, { fontWeight: '700', color: colors.text }]}>Tổng thanh toán</Text>
                                <Text style={[styles.billingValue, { fontWeight: '700', color: colors.primary }]}>{order.totalAmount?.toLocaleString('vi-VN')}đ</Text>
                            </View>
                        </View>
                    )}
                </View>



                {/* Thông tin thời gian đơn hàng (Collapsible Card) */}
                <View style={styles.card}>
                    <View style={[styles.timeRow, { marginTop: 0 }]}>
                        <Text style={styles.timeLabel}>Mã đơn hàng</Text>
                        <View style={styles.rowStart}>
                            <Text style={[styles.valName, { marginRight: 8, fontSize: 13, color: colors.textSecondary }]}>{order.orderNumber}</Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyCode(order.orderNumber)}>
                                <Text style={styles.copyText}>SAO CHÉP</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Phương thức thanh toán</Text>
                        <Text style={styles.timeVal}>{order.paymentMethod === 0 ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}</Text>
                    </View>

                    {isTimeExpanded && (
                        <View style={{ borderTopWidth: 0.5, borderTopColor: colors.borderLight, paddingTop: 10, marginTop: 10 }}>
                            <View style={styles.timeRow}>
                                <Text style={styles.timeLabel}>Thời gian đặt hàng</Text>
                                <Text style={styles.timeVal}>{formatTime(orderDate)}</Text>
                            </View>
                            {order.status !== 'Pending' && order.status !== 'Canceled' && (
                                <View style={styles.timeRow}>
                                    <Text style={styles.timeLabel}>Thời gian thanh toán</Text>
                                    <Text style={styles.timeVal}>{formatTime(payDate)}</Text>
                                </View>
                            )}
                            {(order.status === 'Shipped' || order.status === 'Complete') && (
                                <View style={styles.timeRow}>
                                    <Text style={styles.timeLabel}>Thời gian gửi hàng</Text>
                                    <Text style={styles.timeVal}>{formatTime(shipDate)}</Text>
                                </View>
                            )}
                            {order.status === 'Complete' && (
                                <View style={styles.timeRow}>
                                    <Text style={styles.timeLabel}>Thời gian hoàn thành đơn</Text>
                                    <Text style={styles.timeVal}>{formatTime(completeDate)}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Centered Rút gọn / Xem thêm at the bottom */}
                    <TouchableOpacity 
                        style={styles.timeCollapseBtn} 
                        onPress={() => setIsTimeExpanded(!isTimeExpanded)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.timeCollapseBtnText}>
                            {isTimeExpanded ? 'Rút gọn' : 'Xem thêm'}
                        </Text>
                        <Ionicons 
                            name={isTimeExpanded ? "chevron-up" : "chevron-down"} 
                            size={14} 
                            color={colors.textSecondary} 
                            style={{ marginLeft: 4 }} 
                        />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Bottom Actions Bar */}
            <View style={styles.bottomBar}>
                {order.status === 'Pending' && (
                    <TouchableOpacity style={styles.dangerBtn} onPress={handleCancelOrder}>
                        <Text style={styles.dangerBtnText}>Hủy Đơn Hàng</Text>
                    </TouchableOpacity>
                )}
                
                {order.status !== 'Shipped' && (
                    <TouchableOpacity style={styles.primaryOutlineBtn} onPress={handleRepurchase}>
                        <Text style={styles.primaryOutlineBtnText}>Mua lại</Text>
                    </TouchableOpacity>
                )}

                {order.status === 'Complete' && (
                    isReviewed ? (
                        <TouchableOpacity style={styles.outlineBtn} onPress={() => handleViewReview(firstItem?.productId)}>
                            <Text style={styles.outlineBtnText}>Xem đánh giá</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('WriteReview', { 
                            productId: firstItem?.productId, 
                            orderId: order.id,
                            productName: firstItem?.productName,
                            productImage: firstItem?.productImage
                        })}>
                            <Text style={styles.primaryBtnText}>Đánh Giá</Text>
                        </TouchableOpacity>
                    )
                )}
            </View>

            {/* Cancel Modal */}
            <Modal visible={isCancelModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBackdrop} onPress={() => setCancelModalVisible(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Lý do hủy đơn</Text>
                            <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={cancelReasons}
                            keyExtractor={(_, i) => i.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.reasonItem} onPress={() => setCancelReason(item)}>
                                    <Text style={styles.reasonText}>{item}</Text>
                                    <Ionicons name={cancelReason === item ? 'radio-button-on' : 'radio-button-off'} size={24} color={cancelReason === item ? colors.primary : colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={[styles.dangerBtn, styles.modalConfirmBtn]} onPress={handleConfirmCancel}>
                            <Text style={styles.dangerBtnText}>Xác nhận hủy đơn</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Review Details Modal */}
            <Modal visible={isReviewModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBackdrop} onPress={() => setReviewModalVisible(false)} />
                    <View style={[styles.modalContent, { height: Dimensions.get('window').height * 0.45 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Đánh giá của tôi</Text>
                            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {isReviewLoading ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={{ marginTop: 12, color: colors.textSecondary }}>Đang tải đánh giá...</Text>
                            </View>
                        ) : selectedReview?.notFound ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
                                <Text style={{ marginTop: 12, fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>Không tìm thấy đánh giá của bạn trên hệ thống.</Text>
                            </View>
                        ) : selectedReview?.error ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                <Ionicons name="warning-outline" size={48} color={colors.danger} />
                                <Text style={{ marginTop: 12, fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>Có lỗi xảy ra khi tải thông tin đánh giá.</Text>
                            </View>
                        ) : selectedReview ? (
                            <View style={{ flex: 1, paddingVertical: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <Image source={{ uri: `https://i.pravatar.cc/150?u=${selectedReview.userId}` }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.borderLight, marginRight: 12 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{selectedReview.userName || user?.fullName}</Text>
                                        <Text style={{ fontSize: 12, color: colors.textMuted }}>{new Date(selectedReview.createdAt).toLocaleDateString('vi-VN')} {new Date(selectedReview.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                </View>

                                {renderStars(selectedReview.rating)}

                                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, flex: 1, marginTop: 10 }}>
                                    <Text style={{ fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' }}>" {selectedReview.review || selectedReview.comment || 'Không có bình luận'} "</Text>
                                </View>
                            </View>
                        ) : null}

                        <TouchableOpacity style={[styles.outlineBtn, styles.primaryBtn, { marginTop: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 0, flex: 0 }]} onPress={() => setReviewModalVisible(false)}>
                            <Text style={styles.primaryBtnText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F7' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    scrollContent: { paddingBottom: 40 },

    // Inset Cards
    card: {
        backgroundColor: colors.white,
        borderRadius: 8,
        marginHorizontal: 12,
        marginTop: 12,
        padding: 16,
        ...shadow.sm,
    },
    unitedCard: {
        backgroundColor: colors.white,
        borderRadius: 8,
        marginHorizontal: 12,
        marginTop: 12,
        ...shadow.sm,
        overflow: 'hidden',
    },
    statusBanner: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'flex-start',
    },
    statusBannerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
    shippingSection: {
        padding: 16,
    },
    addressSection: {
        padding: 16,
    },
    cardSeparator: {
        height: 1,
        backgroundColor: colors.borderLight,
        marginHorizontal: 16,
    },

    sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    shippingCarrier: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
    shipperRowDetail: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.borderLight },
    shipperText: { fontSize: 13, color: colors.textSecondary },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowStart: { flexDirection: 'row', alignItems: 'flex-start' },
    rowEnd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    
    valDesc: { fontSize: 13, color: colors.textSecondary },
    valName: { fontSize: 14, color: colors.text, fontWeight: '700' },
    
    trackRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
    trackDesc: { fontSize: 14, color: '#559083', fontWeight: '500' },
    trackTime: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },

    shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    shopBadge: { backgroundColor: colors.danger, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 },
    shopBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
    shopName: { fontSize: 14, fontWeight: '600', color: colors.text },

    productRow: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginBottom: 12 },
    prodImg: { width: 70, height: 70, backgroundColor: colors.background, borderRadius: 4, marginRight: 12, overflow: 'hidden' },
    fullImg: { width: '100%', height: '100%' },
    prodInfo: { flex: 1, justifyContent: 'space-between' },
    prodTitle: { flex: 1, marginRight: 8, fontSize: 14, color: colors.text, lineHeight: 20 },
    prodQty: { fontSize: 13, color: colors.textSecondary },
    prodPrice: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 4 },

    orderTotalRowClickable: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 14, marginTop: 6 },
    totalLabel: { fontSize: 14, color: colors.text },
    sumValPrice: { fontSize: 15, color: colors.primary, fontWeight: '700' },

    billingBreakdown: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginTop: 10 },
    billingRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    billingLabel: { fontSize: 13, color: colors.textSecondary },
    billingValue: { fontSize: 13, color: colors.text },



    copyBtn: { paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: colors.border, borderRadius: 2 },
    copyText: { fontSize: 11, color: colors.textSecondary },

    timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    timeLabel: { fontSize: 13, color: colors.textSecondary },
    timeVal: { fontSize: 13, color: colors.textSecondary },

    timeCollapseBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 10,
        borderTopWidth: 0.5,
        borderTopColor: colors.borderLight,
    },
    timeCollapseBtnText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },

    bottomBar: { flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight, padding: 12, gap: 10 },
    outlineBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    outlineBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
    primaryBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    primaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
    primaryOutlineBtn: { flex: 1, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.white, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    primaryOutlineBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    dangerBtn: { flex: 1, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.white, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    dangerBtnText: { color: colors.danger, fontSize: 14, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBackdrop: { flex: 1 },
    modalContent: { backgroundColor: colors.white, height: Dimensions.get('window').height * 0.6, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.md },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    reasonItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    reasonText: { fontSize: 15, color: colors.text, flex: 1, marginRight: 10 },
    modalConfirmBtn: { marginTop: spacing.md, paddingVertical: 14, alignItems: 'center', flex: 0 },
});
