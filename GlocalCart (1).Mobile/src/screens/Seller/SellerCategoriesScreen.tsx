import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { getCategoryIcon } from '../../utils/categoryIcon';

type CategoryNode = {
  id: string | number;
  name: string;
  icon?: keyof typeof Ionicons.glyphMap;
  productCount?: number;
  subCategories?: CategoryNode[];
};

const normalizeTree = (items: any[]): CategoryNode[] =>
  items.map(item => ({
    ...item,
    icon: getCategoryIcon(item.name, item.icon),
    subCategories: normalizeTree(item.subCategories || item.children || []),
  }));

const getCategoryId = (category: CategoryNode) => String(category.id);

export default function SellerCategoriesScreen({ route, navigation }: any): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res: any = await apiClient.get('/categories');
        const cats = Array.isArray(res) ? res : res?.data ?? [];
        setCategories(normalizeTree(cats));
      } catch (error) {
        console.warn('Failed to load categories', error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const requestedCategoryId = route.params?.categoryId ? String(route.params.categoryId) : null;

  const pathToRequested = useMemo(() => {
    if (!requestedCategoryId) return [];

    const findPath = (nodes: CategoryNode[], path: string[] = []): string[] => {
      for (const node of nodes) {
        const id = getCategoryId(node);
        if (id === requestedCategoryId) return [...path, id];
        const childPath = findPath(node.subCategories || [], [...path, id]);
        if (childPath.length) return childPath;
      }
      return [];
    };

    return findPath(categories);
  }, [categories, requestedCategoryId]);

  useEffect(() => {
    if (!pathToRequested.length) return;

    setExpandedIds(prev => {
      const next = new Set(prev);
      pathToRequested.forEach(id => next.add(id));
      return next;
    });
  }, [pathToRequested]);

  const toggleCategory = (category: CategoryNode) => {
    if (!category.subCategories?.length) {
      navigation.navigate('SellerEditCategory', { category });
      return;
    }

    const id = getCategoryId(category);
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = (category: CategoryNode) => {
    Alert.alert(
      'Xóa danh mục',
      `Bạn có chắc muốn xóa "${category.name}"? Các danh mục con vẫn cần được xử lý lại trong hệ thống.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            const removeNode = (nodes: CategoryNode[]): CategoryNode[] =>
              nodes
                .filter(node => getCategoryId(node) !== getCategoryId(category))
                .map(node => ({ ...node, subCategories: removeNode(node.subCategories || []) }));

            setCategories(prev => removeNode(prev));
          },
        },
      ]
    );
  };

  const renderCategory = (category: CategoryNode, level = 0): React.ReactNode => {
    const id = getCategoryId(category);
    const children = category.subCategories || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(id);

    return (
      <View key={id}>
        <TouchableOpacity
          style={[styles.catRow, { paddingLeft: 12 + level * 20 }]}
          onPress={() => toggleCategory(category)}
          activeOpacity={0.75}
        >
          <View style={styles.expandSlot}>
            {hasChildren ? (
              <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color={colors.textSecondary} />
            ) : (
              <View style={styles.childDot} />
            )}
          </View>
          <View style={styles.catIconCircle}>
            <Ionicons name={getCategoryIcon(category.name, category.icon)} size={22} color={colors.primary} />
          </View>
          <View style={styles.catInfo}>
            <Text style={styles.catName}>{category.name}</Text>
            <Text style={styles.catCount}>
              {hasChildren ? `${children.length} danh mục con` : `${category.productCount || 0} sản phẩm`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('SellerEditCategory', { category })}
          >
            <Ionicons name="create-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(category)}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </TouchableOpacity>

        {hasChildren && isExpanded && children.map(child => renderCategory(child, level + 1))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh mục Shop</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SellerAddCategory')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="git-branch-outline" size={18} color={colors.secondary} />
        <Text style={styles.infoText}>
          Danh mục được hiển thị dạng cây. Bấm vào danh mục cha để mở hoặc ẩn danh mục con.
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {categories.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="folder-open-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('SellerAddCategory')}>
              <Text style={styles.addBtnText}>+ Thêm danh mục đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.treeCard}>
            {categories.map(category => renderCategory(category))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  infoText: { flex: 1, fontSize: 12, color: colors.secondary, lineHeight: 18 },
  content: { flex: 1 },
  contentInner: { padding: spacing.md, paddingBottom: 40 },
  treeCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, overflow: 'hidden', ...shadow.sm },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  expandSlot: { width: 24, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  childDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
  catIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catInfo: { flex: 1 },
  catName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  catCount: { fontSize: 12, color: colors.textSecondary },
  actionBtn: { padding: 8 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  addBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
