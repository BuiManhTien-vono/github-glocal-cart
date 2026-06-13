import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard, ScrollView, Animated, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../../services/db/database';
import apiClient from '../../services/api/apiClient';
import { ProductCard } from '../../components/shop/ProductCard';
import { colors } from '../../theme/colors';
import { resolveProductImage } from '../../utils/imageUtils';
import { getFlashSalePricing, getFlashSaleSoldPercentage } from '../../utils/flashSalePricing';

const HOT_SEARCHES = ['iPhone 15', 'Giày thể thao', 'Áo thun nam', 'Tai nghe bluetooth', 'Váy nữ', 'Sạc dự phòng'];

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

const isUnavailableProduct = (item: any) => {
  const status = String(item?.status || item?.productStatus || '').toLowerCase();
  return item?.isLocked === true || item?.isActive === false || ['locked', 'inactive', 'hidden', 'deleted'].includes(status);
};

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false); 
  const [searchError, setSearchError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    locations: [] as string[],
    categoryIds: [] as number[],
    brands: [] as string[],
    rating: null as number | null,
    services: [] as string[]
  });
  const [brands, setBrands] = useState<string[]>([]);

  // Filter UI State
  const [activeFilterMenu, setActiveFilterMenu] = useState('location');
  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});
  const rightScrollRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);

  // Sort state
  const [activeTab, setActiveTab] = useState(0); // 0: Liên quan, 1: Mới nhất, 2: Bán chạy, 3: Giá
  const [priceOrder, setPriceOrder] = useState<'asc' | 'desc'>('asc');

  const fetchFlashSaleProducts = async () => {
    setIsLoading(true);
    setIsSearching(true);
    setSearchError('');
    try {
      const res: any = await apiClient.get('/products');
      const items = res?.items || res || [];
      setProducts(items.filter((item: any) => !isUnavailableProduct(item) && getFlashSalePricing(item).hasDiscount));
      setActiveTab(0);
    } catch (error) {
      console.log('Fetch Flash Sale error:', error);
      setProducts([]);
      setSearchError('Không thể tải sản phẩm flash sale. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (route.params?.isFlashSale) {
      fetchFlashSaleProducts();
    } else if (route.params?.query) {
      setSearchQuery(route.params.query);
      fetchResults(route.params.query);
    }
  }, [route.params?.isFlashSale, route.params?.query]);

  useEffect(() => {
    if (products.length > 0) {
      // Extract unique brands from current products
      const uniqueBrands: string[] = Array.from(new Set(products.map((p: any) => p.brand || p.brandName).filter(b => !!b)));
      if (uniqueBrands.length > 0) {
        setBrands(uniqueBrands);
      } else {
        // Fallback mock brands if results have no brand data
        setBrands(['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'Oppo']);
      }
    }
  }, [products]);


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
    let activeId = FILTER_MENU[0].id;
    for (const menu of FILTER_MENU) {
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

  const handleCameraPress = () => {
    Alert.alert(
      "Chọn ảnh",
      "Bạn muốn lấy ảnh từ đâu?",
      [
        { text: "Chụp ảnh", onPress: openCamera },
        { text: "Chọn từ thư viện", onPress: openGallery },
        { text: "Hủy", style: "cancel" }
      ]
    );
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Lỗi", "Bạn cần cấp quyền truy cập camera!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({});
    if (!result.canceled) {
      Alert.alert("Thông báo", "Chức năng tìm kiếm bằng hình ảnh đang được phát triển.");
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({});
    if (!result.canceled) {
      Alert.alert("Thông báo", "Chức năng tìm kiếm bằng hình ảnh đang được phát triển.");
    }
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

  const loadHistory = async () => {
    try {
      const saved = await getSearchHistory();
      setHistory(saved);
    } catch (e) { }
  };

  const saveToHistory = async (query: string) => {
    if (!query.trim()) return;
    const cleanQuery = query.trim();
    const newHistory = [cleanQuery, ...history.filter(h => h !== cleanQuery)].slice(0, 10);
    setHistory(newHistory);
    try {
      await addSearchHistory(cleanQuery);
    } catch (e) { }
  };

  const clearHistory = async () => {
    setHistory([]);
    await clearSearchHistory();
  };

  const fetchResults = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setIsSearching(true);
    setSearchError('');
    Keyboard.dismiss();
    saveToHistory(query);

    try {
      let url = `/products/search?name=${encodeURIComponent(query)}`;
      if (filters.minPrice) url += `&minPrice=${filters.minPrice}`;
      if (filters.maxPrice) url += `&maxPrice=${filters.maxPrice}`;
      
      if (filters.categoryIds.length > 0) {
        url += `&categoryIds=${filters.categoryIds.join(',')}`;
      }
      if (filters.brands.length > 0) {
        url += `&brands=${filters.brands.join(',')}`;
      }
      if (filters.locations.length > 0) {
        url += `&locations=${filters.locations.join(',')}`;
      }
      if (filters.services.length > 0) {
        url += `&services=${filters.services.join(',')}`;
      }
      if (filters.rating) url += `&minRating=${filters.rating}`;

      const res: any = await apiClient.get(url);
      const items = res?.items || res || [];
      setProducts(items.filter((item: any) => !isUnavailableProduct(item)));
      setActiveTab(0);
    } catch (error) {
      console.log('Search error:', error);
      setProducts([]);
      setSearchError('Không thể tìm kiếm sản phẩm. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res: any = await apiClient.get(`/products/search?name=${query}&limit=8`);
      const items = res?.items || res || [];
      // If API returns products, we extract names for suggestions
      setSuggestions(items.map((i: any) => i.name).slice(0, 8));
    } catch (e) {
      // Simple local filtering if API fails or for speed
      setSuggestions([]);
    }
  };

  const onTextChange = (text: string) => {
    setSearchQuery(text);
    setIsSearching(false);
    setSearchError('');
    fetchSuggestions(text);
  };

  const renderHistory = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lịch sử tìm kiếm</Text>
        <TouchableOpacity onPress={clearHistory}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.historyGrid}>
        {history.map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.historyChip} onPress={() => { setSearchQuery(item); fetchResults(item); }}>
            <Text style={styles.historyText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHotSearches = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tìm kiếm phổ biến</Text>
      <View style={styles.historyGrid}>
        {HOT_SEARCHES.map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.historyChip} onPress={() => { setSearchQuery(item); fetchResults(item); }}>
            <Text style={styles.historyText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      {suggestions.map((item, idx) => (
        <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => { setSearchQuery(item); fetchResults(item); }}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <Text style={styles.suggestionText} numberOfLines={1}>{item}</Text>
          <Ionicons name="arrow-up-outline" size={16} color={colors.textMuted} style={{ transform: [{ rotate: '-45deg' }] }} />
        </TouchableOpacity>
      ))}
      {suggestions.length === 0 && searchQuery.length > 0 && (
        <TouchableOpacity style={styles.suggestionItem} onPress={() => fetchResults(searchQuery)}>
          <Ionicons name="search-outline" size={16} color={colors.primary} />
          <Text style={[styles.suggestionText, { color: colors.primary }]}>Tìm "{searchQuery}"</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={colors.primary} />
        </TouchableOpacity>

        {route.params?.isFlashSale ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#ee4d2d', fontStyle: 'italic' }}>FLASH</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#ee4d2d', fontStyle: 'italic', marginRight: 8 }}> SALE</Text>
          </View>
        ) : (
          <View style={styles.searchBox}>
            <TextInput
              style={styles.input}
              placeholder="Glocal Cart Mall..."
              value={searchQuery}
              onChangeText={onTextChange}
              autoFocus
              onSubmitEditing={() => fetchResults(searchQuery)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); setIsSearching(false); }} style={{ paddingHorizontal: 4 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleCameraPress} style={styles.cameraBtn}>
              <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {route.params?.isFlashSale ? null : (
          isSearching || showFilters ? (
            <TouchableOpacity style={styles.headerFilterBtn} onPress={() => setShowFilters(!showFilters)}>
              <Ionicons name="filter" size={20} color={showFilters ? colors.primary : colors.textSecondary} />
              <Text style={[styles.headerFilterText, { color: showFilters ? colors.primary : colors.textSecondary }]}>Lọc</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.searchBtn} onPress={() => fetchResults(searchQuery)}>
              <Text style={styles.searchBtnText}>Tìm</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <View style={{ flex: 1 }}>
        {isSearching ? (
          <>
            <View style={styles.sortTabsContainer}>
              {['Liên quan', 'Mới nhất', 'Bán chạy', 'Giá'].map((tab, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.sortTabBtn, activeTab === idx && styles.sortTabBtnActive]}
                  onPress={() => handleSortChange(idx)}
                >
                  <Text style={[styles.sortTabText, activeTab === idx && styles.sortTabTextActive]}>{tab}</Text>
                  {tab === 'Giá' && (
                    <View style={styles.priceArrows}>
                      <Ionicons name="caret-up" size={10} color={activeTab === 3 && priceOrder === 'asc' ? colors.primary : colors.textMuted} style={{ marginBottom: -4 }} />
                      <Ionicons name="caret-down" size={10} color={activeTab === 3 && priceOrder === 'desc' ? colors.primary : colors.textMuted} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flex: 1 }}>
              {isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ marginTop: 12, color: colors.textSecondary }}>Đang tìm sản phẩm...</Text>
                </View>
              ) : (
                <FlatList
                  data={getSortedProducts()}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  contentContainerStyle={styles.listContainer}
                  renderItem={({ item, index }) => {
                    if (route.params?.isFlashSale) {
                      const pricing = getFlashSalePricing(item);
                      const soldPercentage = getFlashSaleSoldPercentage(item);
                      const mainImage = resolveProductImage(item) || 'https://via.placeholder.com/150';

                      return (
                        <View style={{ width: '50%', padding: 4 }}>
                          <TouchableOpacity 
                            style={styles.flashSaleCard}
                            onPress={() => navigation.navigate('ProductDetail', { productId: item.id, product: item })}
                          >
                            <View style={styles.flashSaleImageBox}>
                              <Image source={{ uri: mainImage }} style={styles.flashSaleImage} />
                              <View style={styles.flashSaleBadge}>
                                <Text style={styles.flashSaleBadgeText}>-{pricing.discountPercent}%</Text>
                              </View>
                              <View style={styles.flashSaleLabelFav}>
                                <Text style={styles.flashSaleLabelFavText}>Yêu thích</Text>
                              </View>
                            </View>
                            
                            <View style={styles.flashSaleInfo}>
                              <Text style={styles.flashSaleName} numberOfLines={2}>
                                {item.name}
                              </Text>
                              
                              <View style={styles.flashSalePriceRow}>
                                <Text style={styles.flashSalePrice}>
                                  ₫{pricing.salePrice.toLocaleString('vi-VN')}
                                </Text>
                                <Text style={styles.flashSaleOriginalPrice}>
                                  ₫{pricing.originalPrice.toLocaleString('vi-VN')}
                                </Text>
                              </View>
                              
                              <View style={styles.flashSaleProgressBarBg}>
                                <View style={[styles.flashSaleProgressBarFill, { width: `${soldPercentage}%` }]} />
                                <Text style={styles.flashSaleProgressText}>{soldPercentage > 0 ? 'Đang bán chạy' : 'Đang mở bán'}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    }

                    return (
                      <View style={{ width: '50%', padding: 4 }}>
                        <ProductCard item={item} customWidth="100%" />
                      </View>
                    );
                  }}
                  ListEmptyComponent={() => (
                    <View style={styles.empty}>
                      <Ionicons name="search-outline" size={80} color={colors.border} />
                      <Text style={styles.emptyText}>
                        {searchError || `Không tìm thấy sản phẩm nào cho "${searchQuery}"`}
                      </Text>
                      <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => (searchError
                          ? (route.params?.isFlashSale ? fetchFlashSaleProducts() : fetchResults(searchQuery))
                          : setIsSearching(false))}
                      >
                        <Text style={{ color: colors.primary }}>{searchError ? 'Thử lại' : 'Thử từ khóa khác'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}
            </View>
          </>
        ) : (
          <ScrollView style={styles.content}>
            {searchQuery.length > 0 ? renderSuggestions() : (
              <>
                {history.length > 0 && renderHistory()}
                {renderHotSearches()}
              </>
            )}
          </ScrollView>
        )}

        {/* OVERLAY FILTER */}
        {showFilters && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 }]}>
            <View style={{ height: '80%', backgroundColor: '#fff' }}>
              <View style={styles.filterBody}>
                {/* LEFT MENU */}
                <View style={styles.leftMenu}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {FILTER_MENU.map(item => (
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
                      <View style={styles.grid}>
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
                    <View onLayout={(e) => handleSectionLayout('brand', e)} style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>Thương Hiệu</Text>
                      <View style={styles.grid}>
                        {brands.length > 0 ? brands.map((b, idx) => (
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
                        )) : <Text style={styles.emptyFilterText}>Vui lòng chọn danh mục</Text>}
                      </View>
                    </View>

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
                      <View style={styles.grid}>
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
                      <View style={styles.grid}>
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
                      <View style={styles.grid}>
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
                  onPress={() => setFilters({ minPrice: '', maxPrice: '', locations: [], categoryIds: [], brands: [], rating: null, services: [] })}
                >
                  <Text style={styles.resetText}>Thiết lập lại</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyBtn} 
                  onPress={() => { setShowFilters(false); fetchResults(searchQuery); }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    marginRight: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    height: 40,
  },
  input: {
    flex: 1,
    marginLeft: 4,
    fontSize: 15,
    color: colors.text,
  },
  cameraBtn: {
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderLight,
    marginLeft: 4,
  },
  headerFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  headerFilterText: {
    color: colors.primary,
    fontSize: 14,
    marginLeft: 2,
    fontWeight: '500',
  },
  sortTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    height: 44,
  },
  sortTabBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  sortTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  sortTabText: {
    fontSize: 14,
    color: colors.text,
  },
  sortTabTextActive: {
    color: colors.primary,
  },
  priceArrows: {
    marginLeft: 4,
    justifyContent: 'center',
  },
  searchBtn: {
    paddingHorizontal: 12,
  },
  searchBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  historyChip: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  historyText: {
    fontSize: 14,
    color: colors.text,
  },
  suggestionsContainer: {
    paddingTop: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: colors.text,
  },
  listContainer: {
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
  },
  filterContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
  grid: {
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
  // Flash Sale Card Styles
  flashSaleCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  flashSaleImageBox: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  flashSaleImage: {
    width: '100%',
    height: '100%',
  },
  flashSaleBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255,212,36,0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderBottomLeftRadius: 4,
  },
  flashSaleBadgeText: {
    fontSize: 10,
    color: '#ee4d2d',
    fontWeight: '700',
  },
  flashSaleLabelFav: {
    position: 'absolute',
    top: 4,
    left: -4,
    backgroundColor: '#ff6b35',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  flashSaleLabelFavText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  flashSaleInfo: {
    padding: 8,
  },
  flashSaleName: {
    fontSize: 12,
    lineHeight: 16,
    color: '#333',
    height: 32,
    marginBottom: 6,
  },
  flashSalePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 4,
  },
  flashSalePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ee4d2d',
  },
  flashSaleOriginalPrice: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'underline line-through',
  },
  flashSaleProgressBarBg: {
    width: '100%',
    height: 14,
    backgroundColor: '#ffbda6',
    borderRadius: 7,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  flashSaleProgressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ee4d2d',
  },
  flashSaleProgressText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
    zIndex: 1,
  },
});
