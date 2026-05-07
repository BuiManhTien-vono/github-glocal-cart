import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { Loading } from '../../components/common/Loading';

// Import local components
import { SortTabs } from '../../components/shop/SortTabs';
import { ProductCard } from '../../components/shop/ProductCard';

const isWeb = Platform.OS === 'web';

export default function CategoryScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { categoryId, categoryName } = route.params || {};

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getCategoryIcon = (name: string): string => {
    if (!name) return 'box';
    const n = name.toLowerCase();
    if (n.includes('điện tử') || n.includes('máy tính') || n.includes('công nghệ') || n.includes('desktop')) return 'desktop';
    if (n.includes('điện thoại') || n.includes('phụ kiện')) return 'mobile-alt';
    if (n.includes('thời trang') || n.includes('quần áo')) return 'tshirt';
    if (n.includes('gia dụng') || n.includes('nhà cửa')) return 'blender';
    if (n.includes('sách') || n.includes('văn phòng')) return 'book';
    if (n.includes('mỹ phẩm') || n.includes('làm đẹp')) return 'spa';
    if (n.includes('mẹ & bé') || n.includes('đồ chơi')) return 'baby-carriage';
    if (n.includes('thể thao') || n.includes('dã ngoại')) return 'basketball-ball';
    if (n.includes('thực phẩm') || n.includes('đồ uống')) return 'hamburger';
    return 'box';
  };

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        apiClient.get(`/products/search?categoryId=${categoryId || 1}`) as any,
        apiClient.get('/categories') as any,
      ]);
      setProducts(prodRes?.items || (Array.isArray(prodRes) ? prodRes : []));
      setCategories(catRes?.items || (Array.isArray(catRes) ? catRes : []));
    } catch (error) {
      console.warn("Fetch category products error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.wrapper}>

        {/* Simple Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.searchText}>{categoryName || 'Danh mục sản phẩm'}</Text>
          </View>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="cart-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {isLoading && !refreshing ? (
          <Loading message="Đang tải danh sách..." />
        ) : (
          <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            {/* Horizontal Category List */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
              {categories.map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.catItem}
                  onPress={() => navigation.setParams({ categoryId: c.id, categoryName: c.name })}
                >
                  <View style={[styles.catIconWrap, categoryId === c.id && styles.catIconActive]}>
                    <FontAwesome5 name={getCategoryIcon(c.name)} size={20} color={categoryId === c.id ? colors.primary : colors.textSecondary} />
                  </View>
                  <Text style={[styles.catName, categoryId === c.id && styles.catNameActive]} numberOfLines={2}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Sắp xếp Filter Tabs */}
            <SortTabs />

            {/* Product Grid */}
            {products.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Chưa có sản phẩm nào trong danh mục này.</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {products.map((item: any) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: isWeb ? 'center' : 'stretch',
  },
  wrapper: {
    flex: 1,
    width: '100%',
    maxWidth: isWeb ? 480 : '100%',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    paddingRight: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 4,
    marginRight: 10,
  },
  searchText: {
    color: colors.text,
    fontSize: 14,
  },
  headerAction: {
    marginLeft: 12,
  },
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 4,
    paddingTop: 8,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  catScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  catContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 16,
  },
  catItem: {
    alignItems: 'center',
    width: 65,
  },
  catIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  catIconActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  catImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  catName: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
  },
  catNameActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
