import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Image, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadow } from '../../theme/colors';
import { useCartStore } from '../../store/useCartStore';
import { useChatStore } from '../../store/useChatStore';

import { useAuth } from '../../context/AuthContext';

export default function NotificationsScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { isLoggedIn, setGuestMode } = useAuth();
    const { items: cartItems } = useCartStore();
    const { totalUnreadCount } = useChatStore();
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    if (!isLoggedIn) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="notifications-outline" size={80} color="#ccc" />
                <Text style={{ fontSize: 18, color: '#333', fontWeight: 'bold', marginTop: 20 }}>Thông báo</Text>
                <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginTop: 10, marginBottom: 30 }}>Đăng nhập để xem các cập nhật mới nhất về đơn hàng và ưu đãi dành riêng cho bạn.</Text>
                <TouchableOpacity 
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 4 }}
                    onPress={() => setGuestMode(false)}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>ĐĂNG NHẬP</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const [categories, setCategories] = useState([
        { id: 'promo', title: 'Khuyến mãi', sub: '💛Thẻ quà "đa-zi-năng" tặng ai cũng được', badge: 2, icon: 'pricetag-outline', color: '#EE4D2D' },
        { id: 'live', title: 'Live & Video', sub: 'Mua ngay 30/5_P02', badge: 1, icon: 'play-circle-outline', color: '#32CD32' },
        { id: 'finance', title: 'Thông tin Tài chính', sub: '🎁 Voucher miễn lãi kì đầu cho bạn...', badge: 1, icon: 'card-outline', color: '#FF4500' },
        { id: 'update', title: 'Cập nhật GlocalCart', sub: 'Dành vài phút chia sẻ TẠI ĐÂY để...', badge: 0, icon: 'notifications-outline', color: '#EE4D2D' },
        { id: 'award', title: 'Giải thưởng GlocalCart', sub: 'Lướt xem sản phẩm và cửa hàng...', badge: 0, icon: 'trophy-outline', color: '#4169E1' },
    ]);

    const [orderUpdates, setOrderUpdates] = useState([
        { 
            id: 'ord1', 
            title: 'Giao kiện hàng thành công', 
            body: 'Kiện hàng SPXVN060869737914 của đơn hàng 26041618Q1RX22 đã giao thành công đến bạn.',
            time: '15:31 19-04-26',
            image: 'https://cdn-icons-png.flaticon.com/512/679/679821.png',
            isRead: false,
            history: [
                { id: 'h1', title: 'Xác nhận đã nhận hàng', body: 'Xác nhận đã nhận hàng nếu đơn hàng 26041618Q1RX22 đã giao và sản phẩm không có vấn đề. Đánh giá ngay và nhận 200 Xu.', time: '15:31 19-04-26' },
                { id: 'h2', title: 'Bạn có đơn hàng đang trên đường giao', body: 'Đơn hàng 26041618Q1RX22 của bạn vẫn đang trong quá trình vận chuyển.', time: '15:50 18-04-26' },
                { id: 'h3', title: 'Đang vận chuyển', body: 'Đơn hàng đã rời kho phân loại.', time: '08:28 18-04-26' },
            ]
        },
        { 
            id: 'ord2', 
            title: 'Đang giao hàng', 
            body: 'Đơn hàng 26041618Q1RX22 đang được nhân viên giao hàng vận chuyển đến bạn.',
            time: '08:15 19-04-26',
            image: 'https://cdn-icons-png.flaticon.com/512/679/679821.png',
            isRead: true,
            history: [{ id: 'h1', title: 'Xác nhận đã nhận hàng', body: 'Xác nhận đã nhận hàng nếu đơn hàng 26041618Q1RX22 đã giao và sản phẩm không có vấn đề. Đánh giá ngay và nhận 200 Xu.', time: '15:31 19-04-26' },
                { id: 'h2', title: 'Bạn có đơn hàng đang trên đường giao', body: 'Đơn hàng 26041618Q1RX22 của bạn vẫn đang trong quá trình vận chuyển.', time: '15:50 18-04-26' }]
        },
    ]);

    const handleCategoryPress = (category: any) => {
        setCategories(prev => prev.map(c => c.id === category.id ? { ...c, badge: 0 } : c));
        navigation.navigate('NotificationDetail', { categoryId: category.id, title: category.title });
    };

    const markAllOrdersAsRead = () => {
        setOrderUpdates(prev => prev.map(o => ({ ...o, isRead: true })));
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
        setOrderUpdates(prev => prev.map(o => o.id === orderId ? { ...o, isRead: true } : o));
    };

    const renderHeader = () => (
        <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
                <TouchableOpacity 
                    key={cat.id} 
                    style={styles.catItem} 
                    activeOpacity={0.7}
                    onPress={() => handleCategoryPress(cat)}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                    </View>
                    <View style={styles.catContent}>
                        <Text style={styles.catTitle}>{cat.title}</Text>
                        <Text style={styles.catSub} numberOfLines={1}>{cat.sub}</Text>
                    </View>
                    {cat.badge > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{cat.badge}</Text>
                        </View>
                    )}
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
            ))}

            <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Cập nhật đơn hàng</Text>
                <TouchableOpacity onPress={markAllOrdersAsRead}>
                    <Text style={styles.readAllText}>Đọc tất cả ({orderUpdates.filter(o => !o.isRead).length})</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOrderItem = ({ item }: any) => {
        const isExpanded = expandedOrderId === item.id;
        return (
            <View>
                <TouchableOpacity 
                    style={[styles.orderItem, !item.isRead && styles.orderItemUnread]} 
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(item.id)}
                >
                    <View style={styles.orderImgContainer}>
                        <Image source={{ uri: item.image }} style={styles.orderImg} />
                    </View>
                    <View style={styles.orderContent}>
                        <Text style={styles.orderTitle}>{item.title}</Text>
                        <Text style={styles.orderBody}>{item.body}</Text>
                        <Text style={styles.orderTime}>{item.time}</Text>
                    </View>
                    <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colors.textMuted} 
                        style={{ marginTop: 4 }}
                    />
                </TouchableOpacity>

                {isExpanded && item.history && item.history.length > 0 && (
                    <View style={styles.historyContainer}>
                        {item.history.map((h: any, idx: number) => (
                            <View key={h.id} style={styles.historyItem}>
                                <View style={styles.timelineContainer}>
                                    <View style={[styles.timelineLine, idx === item.history.length - 1 && { height: 0 }]} />
                                    <View style={styles.timelineDot} />
                                </View>
                                <View style={styles.historyTextContent}>
                                    <Text style={styles.historyTitle}>{h.title}</Text>
                                    <Text style={styles.historyBody}>{h.body}</Text>
                                    <Text style={styles.historyTime}>{h.time}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header Toolbar */}
            <View style={styles.toolbar}>
                <Text style={styles.toolbarTitle}>Thông báo</Text>
                <View style={styles.toolbarIcons}>
                    <TouchableOpacity style={styles.toolbarBtn} onPress={() => navigation.navigate('Cart')}>
                        <Ionicons name="cart-outline" size={26} color="#EE4D2D" />
                        {cartCount > 0 && (
                            <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{cartCount}</Text></View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.toolbarBtn}
                        onPress={() => navigation.navigate('ChatList')}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#EE4D2D" />
                        {totalUnreadCount > 0 && (
                            <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{totalUnreadCount}</Text></View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={orderUpdates}
                renderItem={renderOrderItem}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    toolbar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: spacing.md, 
        paddingVertical: 12, 
        backgroundColor: colors.white 
    },
    toolbarTitle: { fontSize: 24, fontWeight: '400', color: colors.text },
    toolbarIcons: { flexDirection: 'row', gap: 15 },
    toolbarBtn: { position: 'relative', padding: 4 },
    iconBadge: { 
        position: 'absolute', 
        top: -2, 
        right: -6, 
        backgroundColor: '#EE4D2D', 
        borderRadius: 10, 
        minWidth: 18, 
        height: 18, 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.white
    },
    iconBadgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },

    categoriesContainer: { backgroundColor: colors.white, marginBottom: 8 },
    catItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 15, 
        paddingHorizontal: 16, 
        borderBottomWidth: 0.5, 
        borderBottomColor: '#f0f0f0' 
    },
    iconCircle: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        borderWidth: 1, 
        borderColor: '#f0f0f0', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginRight: 12
    },
    catContent: { flex: 1 },
    catTitle: { fontSize: 16, color: '#333', marginBottom: 2 },
    catSub: { fontSize: 13, color: '#999' },
    badge: { 
        backgroundColor: '#EE4D2D', 
        borderRadius: 10, 
        minWidth: 20, 
        height: 20, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginRight: 6
    },
    badgeText: { color: colors.white, fontSize: 11, fontWeight: 'bold' },

    sectionDivider: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16, 
        backgroundColor: '#fafafa' 
    },
    sectionTitle: { fontSize: 15, color: '#666' },
    readAllText: { fontSize: 14, color: '#EE4D2D' },

    orderItem: { 
        flexDirection: 'row', 
        padding: 16, 
        backgroundColor: colors.white, 
        borderBottomWidth: 0.5, 
        borderBottomColor: '#f0f0f0',
        alignItems: 'flex-start'
    },
    orderItemUnread: { backgroundColor: '#FFF5F1' },
    orderImgContainer: { 
        width: 50, 
        height: 50, 
        borderWidth: 1, 
        borderColor: '#eee', 
        marginRight: 12,
        borderRadius: 4,
        overflow: 'hidden'
    },
    orderImg: { width: '100%', height: '100%' },
    orderContent: { flex: 1 },
    orderTitle: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 6 },
    orderBody: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
    orderTime: { fontSize: 12, color: '#999' },

    historyContainer: { backgroundColor: '#f9f9f9', paddingLeft: 40, paddingBottom: 10 },
    historyItem: { flexDirection: 'row', paddingRight: 16, paddingVertical: 12 },
    timelineContainer: { position: 'absolute', left: -25, top: 0, bottom: 0, alignItems: 'center' },
    timelineLine: { width: 1, flex: 1, backgroundColor: '#ddd' },
    timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc', marginTop: 18, position: 'absolute' },
    historyTextContent: { flex: 1 },
    historyTitle: { fontSize: 14, color: '#444', fontWeight: '500', marginBottom: 4 },
    historyBody: { fontSize: 13, color: '#777', lineHeight: 18, marginBottom: 6 },
    historyTime: { fontSize: 11, color: '#aaa' },
});
