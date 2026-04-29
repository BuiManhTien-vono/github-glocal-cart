import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function NotificationsScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const mockNotifications = [
        { id: '1', title: 'Giao hàng thành công', body: 'Đơn hàng ORD202611 đã được giao thành công. Đừng quên đánh giá sản phẩm nhé!', date: '14:35 Hôm nay', type: 'order', isRead: false },
        { id: '2', title: 'Khuyến mãi khủng cuối tuần', body: 'Giảm ngay 50% cho tất cả các sản phẩm Thời trang. Bấm xem ngay!', date: '09:00 Hôm qua', type: 'promo', isRead: false },
        { id: '3', title: 'Đơn hàng đang đến trạm trung chuyển', body: 'Đơn hàng mua từ shop Apple Official đang trên đường giao đến bạn.', date: '12:00 18-10', type: 'order', isRead: true },
        { id: '4', title: 'Cập nhật hệ thống', body: 'GlocalCart vừa cập nhật phiên bản mới với nhiều tính năng hấp dẫn.', date: '10:00 15-10', type: 'system', isRead: true },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return { name: 'cube', bg: colors.success + '20', color: colors.success };
            case 'promo': return { name: 'gift', bg: colors.danger + '20', color: colors.danger };
            default: return { name: 'information-circle', bg: colors.secondary + '20', color: colors.secondary };
        }
    };

    const renderItem = ({ item }: any) => {
        const iconDef = getIcon(item.type);
        return (
            <TouchableOpacity style={[styles.notiItem, !item.isRead && styles.notiItemUnread]}>
                <View style={[styles.iconWrapper, { backgroundColor: iconDef.bg }]}>
                    <Ionicons name={iconDef.name as any} size={24} color={iconDef.color} />
                </View>
                <View style={styles.notiContent}>
                    <Text style={[styles.notiTitle, !item.isRead && styles.notiTitleUnread]}>{item.title}</Text>
                    <Text style={styles.notiBody} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.notiDate}>{item.date}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <TouchableOpacity>
                    <Text style={styles.readAllText}>Đánh dấu đã đọc</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={mockNotifications}
                renderItem={renderItem}
                keyExtractor={i => i.id}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 16, backgroundColor: colors.white, ...shadow.sm },
    headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
    readAllText: { fontSize: 13, color: colors.secondary, fontWeight: '600' },

    notiItem: { flexDirection: 'row', padding: 16, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    notiItemUnread: { backgroundColor: colors.white },
    iconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    notiContent: { flex: 1, justifyContent: 'center' },
    notiTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
    notiTitleUnread: { color: colors.text, fontWeight: '700' },
    notiBody: { fontSize: 14, color: colors.textSecondary, marginBottom: 6, lineHeight: 20 },
    notiDate: { fontSize: 12, color: colors.textMuted },
});
