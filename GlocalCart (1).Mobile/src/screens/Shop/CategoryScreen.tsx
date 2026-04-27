import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { Loading } from '../../components/common/Loading';

// Import local components
import { ShopeeMallBrands } from '../../components/shop/ShopeeMallBrands';
import { SortTabs } from '../../components/shop/SortTabs';
import { ProductCard } from '../../components/shop/ProductCard';

const isWeb = Platform.OS === 'web';

export default function CategoryScreen({ route, navigation }: any) {
  const { categoryId, categoryName } = route.params || {};

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      // In a real app we pass categoryId=XX, currently mock API doesn't filter perfectly but we hit the search endpoint
      const res = await apiClient.get(`/products/search?categoryId=${categoryId || 1}`) as any;
      setProducts(res?.items || (Array.isArray(res) ? res : []));
    } catch (error) {
      console.warn("Fetch category products error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            {/* Shopee Mall Horizontal Bar */}
            <ShopeeMallBrands />

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
    </SafeAreaView>
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
});
