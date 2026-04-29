import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function SellerShopInfoScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();

    const [shopName, setShopName] = useState('Glocal Cart Official Store');
    const [description, setDescription] = useState('Gi gỉ gì gi cái gì cũng có');
    const [logoUri, setLogoUri] = useState('https://ui-avatars.com/api/?name=GC&background=FF6B35&color=fff&size=120&bold=true');
    const [bannerUri, setBannerUri] = useState('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop');

    const handlePickLogo = () => {
        Alert.alert('Đổi Logo', 'Chức năng chọn ảnh từ thư viện sẽ được tích hợp sau.\n\n(Hiện tại đang dùng dữ liệu mẫu)');
    };

    const handlePickBanner = () => {
        Alert.alert('Đổi ảnh bìa', 'Chức năng chọn ảnh từ thư viện sẽ được tích hợp sau.\n\n(Hiện tại đang dùng dữ liệu mẫu)');
    };

    const handleSave = () => {
        Alert.alert(
            'Lưu thành công ✓',
            `Tên Shop: ${shopName}\nMô tả: ${description}`,
            [{ text: 'OK' }]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trang trí Shop</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Banner Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ảnh bìa</Text>
                    <TouchableOpacity style={styles.bannerWrap} onPress={handlePickBanner}>
                        <Image source={{ uri: bannerUri }} style={styles.bannerImg} />
                        <View style={styles.bannerOverlay}>
                            <Ionicons name="camera-outline" size={28} color="#fff" />
                            <Text style={styles.overlayText}>Đổi ảnh bìa</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Logo Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Logo Shop</Text>
                    <View style={styles.logoRow}>
                        <Image source={{ uri: logoUri }} style={styles.logoImg} />
                        <TouchableOpacity style={styles.changeBtn} onPress={handlePickLogo}>
                            <Ionicons name="camera-outline" size={16} color={colors.primary} />
                            <Text style={styles.changeBtnText}>Đổi logo</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Shop Name */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tên Shop</Text>
                    <TextInput
                        style={styles.input}
                        value={shopName}
                        onChangeText={setShopName}
                        placeholder="Nhập tên Shop..."
                        maxLength={60}
                    />
                    <Text style={styles.charCount}>{shopName.length}/60</Text>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mô tả Shop</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Nhập mô tả Shop..."
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{description.length}/500</Text>
                </View>

                {/* Preview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Xem trước</Text>
                    <View style={styles.previewCard}>
                        <Image source={{ uri: bannerUri }} style={styles.previewBanner} />
                        <View style={styles.previewInfo}>
                            <Image source={{ uri: logoUri }} style={styles.previewLogo} />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.previewName}>{shopName || 'Tên Shop'}</Text>
                                <Text style={styles.previewDesc} numberOfLines={2}>{description || 'Mô tả Shop'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, paddingVertical: 12,
        backgroundColor: colors.white, ...shadow.sm,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { flex: 1 },

    section: {
        backgroundColor: colors.white, padding: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: colors.text,
        marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
    },

    // Banner
    bannerWrap: { width: '100%', height: 140, borderRadius: 10, overflow: 'hidden', position: 'relative' },
    bannerImg: { width: '100%', height: '100%' },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center', justifyContent: 'center',
    },
    overlayText: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 4 },

    // Logo
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    logoImg: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: colors.primary },
    changeBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: colors.primary,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    },
    changeBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },

    // Input
    input: {
        borderWidth: 1, borderColor: colors.border, borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 10,
        fontSize: 15, color: colors.text, backgroundColor: '#FAFAFA',
    },
    textArea: { minHeight: 100 },
    charCount: { textAlign: 'right', fontSize: 12, color: colors.textMuted, marginTop: 4 },

    // Preview
    previewCard: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight },
    previewBanner: { width: '100%', height: 80 },
    previewInfo: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff' },
    previewLogo: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary },
    previewName: { fontSize: 14, fontWeight: '600', color: colors.text },
    previewDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    // Save
    saveBtn: {
        backgroundColor: colors.primary, marginHorizontal: 16,
        paddingVertical: 14, borderRadius: 8, alignItems: 'center',
        marginTop: 8,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
