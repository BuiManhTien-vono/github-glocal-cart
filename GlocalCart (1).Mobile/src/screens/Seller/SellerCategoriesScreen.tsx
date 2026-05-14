import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';

const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
    'phone-portrait-outline', 'laptop-outline', 'shirt-outline', 'woman-outline',
    'home-outline', 'book-outline', 'color-palette-outline', 'car-outline',
    'football-outline', 'musical-notes-outline', 'pizza-outline', 'paw-outline',
];

// Categories will be loaded from API

export default function SellerCategoriesScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [categories, setCategories] = useState<any[]>([]);

    const handleAdd = () => {
  // Placeholder for adding a new category.
  // In production, this could navigate to a dedicated add screen or open a modal.
};


    // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await apiClient.get('/categories');
        const cats = Array.isArray(res) ? res : (res as any)?.data ?? [];
        const flat: any[] = [];
        const flatten = (list: any[], prefix = '') => {
          list.forEach(c => {
            flat.push({ ...c, name: prefix + c.name, icon: c.icon || 'list-outline' });
            if (c.subCategories?.length) flatten(c.subCategories, prefix + '  ');
          });
        };
        flatten(cats);
        setCategories(flat);
      } catch (e) {
        console.warn('Failed to load categories', e);
      }
    };
    loadCategories();
  }, []);

    const handleAddAndroid = () => {
        Alert.alert(
            'Thêm danh mục mới',
            'Tính năng nhập tên danh mục đang được phát triển.\n\nDanh mục mẫu sẽ được thêm tự động.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Thêm danh mục mẫu',
                    onPress: () => {
                        const randomIcon = ICONS[Math.floor(Math.random() * ICONS.length)];
                        setCategories(prev => [...prev, {
                            id: `sc${Date.now()}`,
                            name: `Danh mục mới ${prev.length + 1}`,
                            productCount: 0,
                            icon: randomIcon,
                        }]);
                    },
                },
            ]
        );
    };

    const handleEdit = (id: string) => {
        const cat = categories.find(c => c.id === id);
        if (!cat) return;
        navigation.navigate('SellerEditCategory', { category: cat });
    };

    const handleDelete = (id: string) => {
        const cat = categories.find(c => c.id === id);
        if (!cat) return;
        Alert.alert(
            'Xóa danh mục',
            `Bạn có chắc muốn xóa "${cat.name}"?\n\n${cat.productCount} sản phẩm trong danh mục này sẽ được chuyển về "Chưa phân loại".`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => setCategories(prev => prev.filter(c => c.id !== id)),
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Danh mục Shop</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SellerAddCategory')}>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Info banner */}
            <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={18} color={colors.secondary} />
                <Text style={styles.infoText}>Quản lý danh mục riêng của Shop. Người mua sẽ thấy các danh mục này khi vào cửa hàng.</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {categories.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Ionicons name="folder-open-outline" size={56} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddAndroid}>
                            <Text style={styles.addBtnText}>+ Thêm danh mục đầu tiên</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    categories.map((cat, index) => (
                        <View key={cat.id} style={styles.catRow}>
                            <View style={styles.dragHandle}>
                                <Ionicons name="reorder-three" size={22} color={colors.textMuted} />
                            </View>
                            <View style={styles.catIconCircle}>
                                <Ionicons name={cat.icon as any} size={22} color={colors.primary} />
                            </View>
                            <View style={styles.catInfo}>
                                <Text style={styles.catName}>{cat.name}</Text>
                                <Text style={styles.catCount}>{cat.productCount} sản phẩm</Text>
                            </View>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(cat.id)}>
                                <Ionicons name="create-outline" size={20} color={colors.secondary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(cat.id)}>
                                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
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

    infoBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: '#DBEAFE',
    },
    infoText: { flex: 1, fontSize: 12, color: colors.secondary, lineHeight: 18 },

    catRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.white, paddingVertical: 14, paddingHorizontal: 12,
        borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    },
    dragHandle: { marginRight: 8, opacity: 0.5 },
    catIconCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primaryBg,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    catInfo: { flex: 1 },
    catName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
    catCount: { fontSize: 12, color: colors.textSecondary },
    actionBtn: { padding: 8 },

    emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyText: { fontSize: 15, color: colors.textSecondary },
    addBtn: {
        marginTop: 8, borderWidth: 1, borderColor: colors.primary,
        borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
    },
    addBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
