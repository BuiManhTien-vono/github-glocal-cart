import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme/colors';
import { useChatStore } from '../../store/useChatStore';
import { ChatBadge } from '../../components/common/ChatBadge';

interface SettingsItem {
    label: string;
    screen?: string;
    sub?: string;
}

interface SettingsSection {
    title: string;
    items: SettingsItem[];
}

export default function AccountSettingsScreen({ navigation }: any) {
    const { logout } = useAuth();
    const { totalUnreadCount } = useChatStore();
    const insets = useSafeAreaInsets();

    const sections: SettingsSection[] = [
        {
            title: 'Tài khoản',
            items: [
                { label: 'Tài khoản & Bảo mật', screen: 'Security' },
                { label: 'Địa Chỉ', screen: 'Addresses' },
                { label: 'Tài khoản / Thẻ Ngân hàng', screen: 'PaymentMethods' },
            ]
        },
        {
            title: 'Cài đặt',
            items: [
                { label: 'Cài đặt Chat' },
                { label: 'Cài đặt Thông báo' },
                { label: 'Cài đặt riêng tư' },
                { label: 'Người dùng đã bị chặn' },
                { label: 'Ngôn ngữ / Language / ភាសា', sub: 'Tiếng Việt' },
            ]
        },
        {
            title: 'Hỗ trợ',
            items: [
                { label: 'Trung tâm hỗ trợ' },
                { label: 'Tiêu chuẩn cộng đồng' },
                { label: 'Điều khoản Shopee' },
                { label: 'Hài lòng với Shopee? Hãy đánh giá...' },
                { label: 'Giới Thiệu' },
                { label: 'Yêu cầu xóa tài khoản' },
            ]
        }
    ];

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
                logout();
            }
            return;
        }
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng xuất', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thiết lập tài khoản</Text>
                <TouchableOpacity style={styles.chatBtn}>
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="#EE4D2D" />
                    <ChatBadge />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {sections.map((section, idx) => (
                    <View key={idx} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.itemsContainer}>
                            {section.items.map((item, i) => (
                                <TouchableOpacity 
                                    key={i} 
                                    style={styles.item}
                                    onPress={() => item.screen && navigation.navigate(item.screen)}
                                >
                                    <View style={styles.itemLeft}>
                                        <Text style={styles.itemLabel}>{item.label}</Text>
                                        {item.sub && <Text style={styles.itemSub}>{item.sub}</Text>}
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee'
    },
    backBtn: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 18, color: '#333', marginLeft: 16 },
    chatBtn: { padding: 4, position: 'relative' },
    chatBadge: {
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
    chatBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

    section: { marginTop: 10 },
    sectionTitle: { 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        fontSize: 13, 
        color: '#888', 
        backgroundColor: '#f5f5f5' 
    },
    itemsContainer: { backgroundColor: '#fff' },
    item: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 14, 
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f0f0f0'
    },
    itemLeft: { flex: 1 },
    itemLabel: { fontSize: 15, color: '#333' },
    itemSub: { fontSize: 12, color: '#999', marginTop: 2 },

    logoutBtn: { 
        marginTop: 20, 
        marginHorizontal: 16, 
        backgroundColor: '#fff', 
        paddingVertical: 14, 
        alignItems: 'center',
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: '#ddd'
    },
    logoutText: { fontSize: 15, color: '#333' }
});
