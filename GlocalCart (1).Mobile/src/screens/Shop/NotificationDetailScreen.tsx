import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadow } from '../../theme/colors';
import { useCartStore } from '../../store/useCartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationDetailScreen({ navigation, route }: any) {
    const insets = useSafeAreaInsets();
    const { title, categoryId } = route.params || { title: 'Thông báo', categoryId: 'promo' };
    const { items: cartItems } = useCartStore();
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    // Mock data for "Khuyến mãi" category
    const [notifications, setNotifications] = useState([
        {
            id: '1',
            title: 'ƯU ĐÃI ĐẾN 300K TỪ SHOPEEGIFTS',
            body: '💛 Thẻ quà "đa-zi-năng" tặng ai cũng hợp\n✨ Thiệp xinh chuẩn vibe, lời chúc cá nhân hóa\n🎁 Giảm tới 300K cho đơn đầu tiên trong tháng\n👉 Ghé ShopeeGifts ngay!',
            time: '16:47',
            image: 'https://cdn-icons-png.flaticon.com/512/679/679821.png',
            isRead: false
        },
        {
            id: '2',
            title: '📅 Thời gian sắp hết!',
            body: 'Voucher của bạn sẽ hết hạn vào ngày mai. Mua ngay để tiết kiệm hơn!',
            time: '14:35',
            image: 'https://cdn-icons-png.flaticon.com/512/879/879757.png',
            isRead: false
        },
        {
            id: '3',
            title: '🛒 Xài ngay kẻo lỡ mã freeship đơn 0Đ',
            body: '🎁 Mã sẽ hết hạn vào 13-05-2026!\n🤑 Chốt đơn liền tay nhận ngay freeship!',
            time: '13:07',
            image: 'https://cdn-icons-png.flaticon.com/512/2362/2362252.png',
            banner: 'https://img.freepik.com/free-vector/free-shipping-concept-illustration_114360-3162.jpg',
            isRead: true
        },
        {
            id: '4',
            title: 'SĂN 800K XU KHI MUA HÀNG HIỆU 50%',
            body: '🎉 Cùng Ngọc Kem, Võ Hoàng Yến & Liêu Hà Trinh\n⛱ Tại Livestream Siêu Hội Thành Viên\n🎊 Voucher đến 4 Triệu + Hoàn 800K xu\n🌾 Freeship tận nhà - Chốt đơn ngay!',
            time: '17:47 10-05-26',
            image: 'https://cdn-icons-png.flaticon.com/512/2169/2169837.png',
            isRead: true
        }
    ]);

    const handleItemPress = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity 
            style={[styles.notiItem, !item.isRead && styles.notiItemUnread]} 
            activeOpacity={0.8}
            onPress={() => handleItemPress(item.id)}
        >
            <View style={styles.topRow}>
                <View style={styles.iconContainer}>
                    <Image source={{ uri: item.image }} style={styles.icon} />
                </View>
                <View style={styles.textContent}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemBody}>{item.body}</Text>
                    
                    {item.banner && (
                        <Image source={{ uri: item.banner }} style={styles.bannerImage} resizeMode="cover" />
                    )}
                    
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
                        <Ionicons name="cart-outline" size={24} color="#EE4D2D" />
                        {cartCount > 0 && (
                            <View style={styles.badgeMini}><Text style={styles.badgeMiniText}>{cartCount}</Text></View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.iconBtn}
                        onPress={() => navigation.navigate('ChatList')}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#EE4D2D" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee'
    },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { flex: 1, fontSize: 20, color: '#333' },
    headerRight: { flexDirection: 'row', gap: 12 },
    iconBtn: { padding: 4 },

    listContent: { paddingBottom: 20 },
    notiItem: { 
        padding: 16, 
        backgroundColor: '#fff', 
        borderBottomWidth: 0.5, 
        borderBottomColor: '#f0f0f0' 
    },
    notiItemUnread: { backgroundColor: '#FFF5F1' },
    topRow: { flexDirection: 'row', alignItems: 'flex-start' },
    iconContainer: { 
        width: 44, 
        height: 44, 
        borderRadius: 4, 
        backgroundColor: '#f5f5f5', 
        marginRight: 12,
        overflow: 'hidden'
    },
    icon: { width: '100%', height: '100%' },
    textContent: { flex: 1 },
    itemTitle: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 4, textTransform: 'uppercase' },
    itemBody: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
    timeText: { fontSize: 12, color: '#999' },
    
    bannerImage: { 
        width: '100%', 
        height: 150, 
        borderRadius: 4, 
        marginBottom: 10,
        backgroundColor: '#eee'
    },
    badgeMini: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EE4D2D',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fff'
    },
    badgeMiniText: { color: '#fff', fontSize: 9, fontWeight: 'bold' }
});
