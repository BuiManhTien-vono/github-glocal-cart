import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, shadow } from '../../theme/colors';

interface ProfileItem {
    label: string;
    value?: string;
    onPress?: () => void;
    isPlaceholder?: boolean;
    hasInfo?: boolean;
}

interface ProfileSection {
    items: ProfileItem[];
}

export default function EditProfileScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { user, updateUser } = useAuth();
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [bio, setBio] = useState((user as any)?.bio || '');
    const [gender, setGender] = useState((user as any)?.gender || 'Chưa thiết lập');
    const [dob, setDob] = useState((user as any)?.dob || 'Chưa thiết lập');

    const maskEmail = (email: string) => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
    };

    const maskPhone = (phone: string) => {
        if (!phone) return '';
        return `${'*'.repeat(phone.length - 2)}${phone.slice(-2)}`;
    };

    const handleSave = () => {
        // Mock save logic
        updateUser({ 
            ...user!, 
            fullName,
            bio,
            gender,
            dob
        } as any);
        Alert.alert('Thành công', 'Đã cập nhật hồ sơ của bạn!');
        navigation.goBack();
    };

    const initial = (user?.fullName || user?.userName || '?')[0].toUpperCase();

    const sections: ProfileSection[] = [
        {
            items: [
                { label: 'Tên', value: fullName, onPress: () => {} },
                { label: 'Tiểu sử', value: bio || 'Thiết lập ngay', isPlaceholder: !bio },
            ]
        },
        {
            items: [
                { label: 'Giới tính', value: gender, hasInfo: true },
                { label: 'Ngày sinh', value: dob, hasInfo: true },
                { label: 'Thông tin cá nhân', hasInfo: true },
            ]
        },
        {
            items: [
                { label: 'Số điện thoại', value: maskPhone(user?.phone || '') },
                { label: 'Email', value: maskEmail(user?.email || '') },
                { label: 'Tài khoản liên kết' },
            ]
        }
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sửa hồ sơ</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveText}>Lưu</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarInitial}>{initial}</Text>
                        </View>
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <Ionicons name="camera-outline" size={20} color="#666" />
                            <Text style={styles.editAvatarText}>Sửa</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info Sections */}
                {sections.map((section, idx) => (
                    <View key={idx} style={styles.sectionCard}>
                        {section.items.map((item, i) => (
                            <TouchableOpacity 
                                key={i} 
                                style={[styles.item, i === section.items.length - 1 && { borderBottomWidth: 0 }]}
                            >
                                <View style={styles.labelRow}>
                                    <Text style={styles.itemLabel}>{item.label}</Text>
                                    {item.hasInfo && <Ionicons name="help-circle-outline" size={16} color="#ccc" style={{marginLeft: 4}} />}
                                </View>
                                <View style={styles.valueRow}>
                                    <Text style={[styles.itemValue, item.isPlaceholder && styles.placeholderText]}>
                                        {item.value}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                <View style={styles.tipContainer}>
                    <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                    <Text style={styles.tipText}>Mẹo: Cập nhật thông tin chính xác giúp bảo mật tài khoản tốt hơn.</Text>
                </View>
            </ScrollView>
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
    backBtn: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 18, color: '#333', marginLeft: 16 },
    saveText: { fontSize: 16, color: '#EE4D2D', fontWeight: '600' },

    scrollContent: { paddingBottom: 40 },

    avatarSection: { 
        backgroundColor: '#fff', 
        paddingVertical: 30, 
        alignItems: 'center',
        marginBottom: 12,
        ...shadow.sm
    },
    avatarWrap: { alignItems: 'center' },
    avatarCircle: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        backgroundColor: '#FFF5F1', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFE0D3'
    },
    avatarInitial: { fontSize: 32, fontWeight: 'bold', color: '#EE4D2D' },
    editAvatarBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 12, 
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: '#f5f5f5'
    },
    editAvatarText: { fontSize: 14, color: '#666' },

    sectionCard: { 
        backgroundColor: '#fff', 
        marginBottom: 12, 
        borderTopWidth: 0.5, 
        borderBottomWidth: 0.5, 
        borderColor: '#eee' 
    },
    item: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 14, 
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f0f0f0'
    },
    labelRow: { flexDirection: 'row', alignItems: 'center' },
    itemLabel: { fontSize: 15, color: '#333' },
    valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemValue: { fontSize: 15, color: '#333', textAlign: 'right' },
    placeholderText: { color: '#ccc' },

    tipContainer: { 
        flexDirection: 'row', 
        paddingHorizontal: 16, 
        marginTop: 10, 
        gap: 8,
        alignItems: 'center'
    },
    tipText: { fontSize: 12, color: '#888', flex: 1 }
});
