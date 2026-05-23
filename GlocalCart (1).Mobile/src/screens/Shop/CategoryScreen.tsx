import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { Loading } from '../../components/common/Loading';

// Import local components
import { SortTabs } from '../../components/shop/SortTabs';
import { ProductCard } from '../../components/shop/ProductCard';

const isWeb = Platform.OS === 'web';

const FILTER_MENU = [
  { id: 'location', title: 'Nơi Bán' },
  { id: 'brand', title: 'Thương Hiệu' },
  { id: 'price', title: 'Khoảng Giá' },
  { id: 'rating', title: 'Đánh Giá' },
  { id: 'service', title: 'Dịch Vụ & Khuyến Mãi' },
];

const PRICE_RANGES = [
  { label: '0-100k', min: '0', max: '100000' },
  { label: '100k-200k', min: '100000', max: '200000' },
  { label: '200k-300k', min: '200000', max: '300000' },
];

const LOCATIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Quận Hà Đông', 'Quận Hoàng Mai', 'Hải Phòng', 'Đà Nẵng'];
const SERVICES = ['Đang giảm giá', 'Hàng có sẵn', 'Mua giá bán buôn', 'Gì Cũng Rẻ', 'Hoàn xu Xtra', 'Freeship Xtra'];

export default function CategoryScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { categoryId, categoryName } = route.params || {};

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sort states
  const [activeTab, setActiveTab] = useState(0); // 0: Liên quan, 1: Mới nhất, 2: Bán chạy, 3: Giá
  const [priceOrder, setPriceOrder] = useState<'asc' | 'desc'>('asc');

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    locations: [] as string[],
    brands: [] as string[],
    rating: null as number | null,
    services: [] as string[]
  });
  const [categoryBrands, setCategoryBrands] = useState<string[]>([]);
  
  // Filter UI State
  const [activeFilterMenu, setActiveFilterMenu] = useState('location');
  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});
  const rightScrollRef = React.useRef<ScrollView>(null);
  const isProgrammaticScroll = React.useRef(false);

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

  const handleMenuPress = (id: string) => {
    setActiveFilterMenu(id);
    isProgrammaticScroll.current = true;
    const yPos = sectionPositions[id] || 0;
    rightScrollRef.current?.scrollTo({ y: yPos, animated: true });
    
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 500);
  };

  const handleRightScroll = (e: any) => {
    if (isProgrammaticScroll.current) return;
    const y = e.nativeEvent.contentOffset.y;
    const menuOptions = categoryBrands.length > 0 
      ? FILTER_MENU 
      : FILTER_MENU.filter(item => item.id !== 'brand');
    let activeId = menuOptions[0].id;
    for (const menu of menuOptions) {
      const pos = sectionPositions[menu.id] || 0;
      if (pos <= y + 100) {
        activeId = menu.id;
      }
    }
    if (activeId !== activeFilterMenu) {
      setActiveFilterMenu(activeId);
    }
  };

  const handleSectionLayout = (id: string, e: any) => {
    const y = e.nativeEvent.layout.y;
    setSectionPositions(prev => ({ ...prev, [id]: y }));
  };

  const handleSortChange = (index: number) => {
    if (index === 3 && activeTab === 3) {
      setPriceOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setActiveTab(index);
      if (index === 3) setPriceOrder('asc');
    }
  };

  const getSortedProducts = () => {
    if (activeTab === 1) return [...products].sort((a, b) => b.id - a.id);
    if (activeTab === 2) return [...products].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    if (activeTab === 3) return [...products].sort((a, b) => priceOrder === 'asc' ? a.price - b.price : b.price - a.price);
    return products;
  };

  const fetchData = async (targetId = categoryId, activeFilters = filters) => {
    try {
      let url = `/products/search?categoryId=${targetId || 1}`;
      if (activeFilters.minPrice) url += `&minPrice=${activeFilters.minPrice}`;
      if (activeFilters.maxPrice) url += `&maxPrice=${activeFilters.maxPrice}`;
      if (activeFilters.locations.length > 0) {
        url += `&locations=${activeFilters.locations.join(',')}`;
      }
      if (activeFilters.brands.length > 0) {
        url += `&brands=${activeFilters.brands.join(',')}`;
      }
      if (activeFilters.services.length > 0) {
        url += `&services=${activeFilters.services.join(',')}`;
      }
      if (activeFilters.rating) url += `&minRating=${activeFilters.rating}`;

      const [prodRes, catRes] = await Promise.all([
        apiClient.get(url) as any,
        apiClient.get('/categories') as any,
      ]);
      const newProducts = prodRes?.items || (Array.isArray(prodRes) ? prodRes : []);
      setProducts(newProducts);
      setCategories(catRes?.items || (Array.isArray(catRes) ? catRes : []));

      // Dynamically extract unique brands for this category when brands filter is empty
      if (activeFilters.brands.length === 0) {
        const uniqueBrands: string[] = Array.from(new Set(newProducts.map((p: any) => p.brand || p.brandName).filter((b: any) => !!b)));
        setCategoryBrands(uniqueBrands);
      }
    } catch (error) {
      console.warn("Fetch category products error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const resetFilters = {
      minPrice: '',
      maxPrice: '',
      locations: [],
      brands: [],
      rating: null,
      services: []
    };
    setFilters(resetFilters);
    setActiveFilterMenu('location');
    fetchData(categoryId, resetFilters);
  }, [categoryId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(categoryId, filters);
  };

  const activeFilterMenuOptions = categoryBrands.length > 0 
    ? FILTER_MENU 
    : FILTER_MENU.filter(item => item.id !== 'brand');

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
          <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('ChatList')}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
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
            <SortTabs 
              activeTab={activeTab} 
              onTabChange={handleSortChange} 
              priceOrder={priceOrder} 
              onFilterPress={() => setShowFilters(true)} 
            />

            {/* Product Grid */}
            {products.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Chưa có sản phẩm nào trong danh mục này.</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {getSortedProducts().map((item: any) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* OVERLAY FILTER */}
      {showFilters && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 }]}>
          <View style={{ height: '80%', backgroundColor: '#fff', paddingTop: insets.top }}>
            {/* FILTER HEADER */}
            <View style={styles.filterHeaderRow}>
              <Text style={styles.filterHeaderTitle}>Bộ lọc tìm kiếm</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterBody}>
              {/* LEFT MENU */}
              <View style={styles.leftMenu}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {activeFilterMenuOptions.map(item => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.leftMenuItem, activeFilterMenu === item.id && styles.leftMenuItemActive]}
                      onPress={() => handleMenuPress(item.id)}
                    >
                      <Text style={[styles.leftMenuText, activeFilterMenu === item.id && styles.leftMenuTextActive]}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* RIGHT CONTENT */}
              <View style={styles.rightContent}>
                <ScrollView 
                  ref={rightScrollRef}
                  onScroll={handleRightScroll}
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 60 }}
                >
                  {/* Nơi Bán */}
                  <View onLayout={(e) => handleSectionLayout('location', e)} style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Nơi Bán</Text>
                    <View style={styles.filterGrid}>
                      {LOCATIONS.map((loc, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.chip, filters.locations.includes(loc) && styles.chipActive]}
                          onPress={() => {
                            const newLocs = filters.locations.includes(loc)
                              ? filters.locations.filter(l => l !== loc)
                              : [...filters.locations, loc];
                            setFilters({...filters, locations: newLocs});
                          }}
                        >
                          <Text style={[styles.chipText, filters.locations.includes(loc) && styles.chipTextActive]}>{loc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Thương Hiệu */}
                  {categoryBrands.length > 0 && (
                    <View onLayout={(e) => handleSectionLayout('brand', e)} style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>Thương Hiệu</Text>
                      <View style={styles.filterGrid}>
                        {categoryBrands.map((b, idx) => (
                          <TouchableOpacity 
                            key={idx} 
                            style={[styles.chip, filters.brands.includes(b) && styles.chipActive]}
                            onPress={() => {
                              const newBrands = filters.brands.includes(b)
                                ? filters.brands.filter(brand => brand !== b)
                                : [...filters.brands, b];
                              setFilters({...filters, brands: newBrands});
                            }}
                          >
                            <Text style={[styles.chipText, filters.brands.includes(b) && styles.chipTextActive]}>{b}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Khoảng Giá */}
                  <View onLayout={(e) => handleSectionLayout('price', e)} style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Khoảng Giá (₫)</Text>
                    <View style={styles.priceRow}>
                      <TextInput 
                        style={styles.priceInput} 
                        placeholder="TỐI THIỂU" 
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={filters.minPrice}
                        onChangeText={v => setFilters({...filters, minPrice: v})}
                      />
                      <View style={styles.priceDivider} />
                      <TextInput 
                        style={styles.priceInput} 
                        placeholder="TỐI ĐA" 
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={filters.maxPrice}
                        onChangeText={v => setFilters({...filters, maxPrice: v})}
                      />
                    </View>
                    <View style={styles.filterGrid}>
                      {PRICE_RANGES.map((p, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.chip}
                          onPress={() => setFilters({...filters, minPrice: p.min, maxPrice: p.max})}
                        >
                          <Text style={styles.chipText}>{p.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Đánh Giá */}
                  <View onLayout={(e) => handleSectionLayout('rating', e)} style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Đánh Giá</Text>
                    <View style={styles.filterGrid}>
                      {[5, 4, 3, 2, 1].map((r, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.chip, filters.rating === r && styles.chipActive]}
                          onPress={() => setFilters({...filters, rating: filters.rating === r ? null : r})}
                        >
                          <Text style={[styles.chipText, filters.rating === r && styles.chipTextActive]}>
                            {r === 5 ? '5⭐' : `≥${r}⭐`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Dịch Vụ */}
                  <View onLayout={(e) => handleSectionLayout('service', e)} style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Dịch Vụ & Khuyến Mãi</Text>
                    <View style={styles.filterGrid}>
                      {SERVICES.map((srv, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.chip, filters.services.includes(srv) && styles.chipActive]}
                          onPress={() => {
                            const newSrvs = filters.services.includes(srv)
                              ? filters.services.filter(s => s !== srv)
                              : [...filters.services, srv];
                            setFilters({...filters, services: newSrvs});
                          }}
                        >
                          <Text style={[styles.chipText, filters.services.includes(srv) && styles.chipTextActive]}>{srv}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                </ScrollView>
              </View>
            </View>

            {/* FOOTER */}
            <View style={[styles.filterFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <TouchableOpacity 
                style={styles.resetBtn} 
                onPress={() => setFilters({ minPrice: '', maxPrice: '', locations: [], brands: [], rating: null, services: [] })}
              >
                <Text style={styles.resetText}>Thiết lập lại</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyBtn} 
                onPress={() => { setShowFilters(false); fetchData(categoryId, filters); }}
              >
                <Text style={styles.applyText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setShowFilters(false)} 
          />
        </View>
      )}
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
  // Filter Overlay Styles
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
  },
  filterHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  filterBody: {
    flex: 1,
    flexDirection: 'row',
  },
  leftMenu: {
    width: 100,
    backgroundColor: '#F5F5F5',
  },
  leftMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  leftMenuItemActive: {
    backgroundColor: '#FFF',
    borderLeftColor: colors.primary,
  },
  leftMenuText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  leftMenuTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  rightContent: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  chip: {
    width: '48%',
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 9, // adjust for border
  },
  chipText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyFilterText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 12,
    color: '#333',
  },
  priceDivider: {
    width: 10,
    height: 1,
    backgroundColor: '#CCC',
    marginHorizontal: 8,
  },
  filterFooter: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
  },
  resetText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  applyBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  applyText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

