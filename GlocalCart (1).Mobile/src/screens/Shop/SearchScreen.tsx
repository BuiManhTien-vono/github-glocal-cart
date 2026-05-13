import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard, ScrollView, Modal, TouchableWithoutFeedback, PanResponder, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../../services/db/database';
import apiClient from '../../services/api/apiClient';
import { ProductCard } from '../../components/shop/ProductCard';
import { colors } from '../../theme/colors';

const HOT_SEARCHES = ['iPhone 15', 'Giày thể thao', 'Áo thun nam', 'Tai nghe bluetooth', 'Váy nữ', 'Sạc dự phòng'];

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false); 
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    categoryId: null as number | null,
    brand: null as string | null,
    rating: null as number | null
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [panY] = useState(new Animated.Value(0));

  useEffect(() => {
    loadHistory();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (filters.categoryId) {
      fetchBrands(filters.categoryId);
    } else {
      setBrands([]);
      setFilters(prev => ({ ...prev, brand: null }));
    }
  }, [filters.categoryId]);

  const fetchCategories = async () => {
    try {
      const res: any = await apiClient.get('/categories');
      setCategories(res || []);
    } catch (e) { }
  };

  const fetchBrands = async (catId: number) => {
    // Mock brands based on category for now
    // In a real app, this would be an API call: /brands?categoryId=catId
    const mockBrands: Record<number, string[]> = {
      1: ['Apple', 'Samsung', 'Oppo', 'Xiaomi'], // Điện thoại
      2: ['Dell', 'HP', 'Asus', 'MacBook', 'Lenovo'], // Laptop
      3: ['Nike', 'Adidas', 'Puma', 'Biti\'s'], // Giày dép
      4: ['Gucci', 'Chanel', 'Zara', 'H&M'], // Thời trang
    };
    setBrands(mockBrands[catId] || ['Khác']);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        panY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        setShowFilters(false);
        panY.setValue(0);
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

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
    Keyboard.dismiss();
    saveToHistory(query);

    try {
      let url = `/products/search?name=${query}`;
      if (filters.minPrice) url += `&minPrice=${filters.minPrice}`;
      if (filters.maxPrice) url += `&maxPrice=${filters.maxPrice}`;
      if (filters.categoryId) url += `&categoryId=${filters.categoryId}`;
      if (filters.brand) url += `&brand=${filters.brand}`;
      if (filters.rating) url += `&minRating=${filters.rating}`;

      const res: any = await apiClient.get(url);
      setProducts(res?.items || res || []);
    } catch (error) {
      console.log('Search error:', error);
      setProducts([]);
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

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Glocal Cart Mall | Tìm gì cũng có..."
            value={searchQuery}
            onChangeText={onTextChange}
            autoFocus
            onSubmitEditing={() => fetchResults(searchQuery)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); setIsSearching(false); }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={() => fetchResults(searchQuery)}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </TouchableOpacity>

        {isSearching && (
          <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {!isSearching ? (
        <ScrollView style={styles.content}>
          {searchQuery.length > 0 ? renderSuggestions() : (
            <>
              {history.length > 0 && renderHistory()}
              {renderHotSearches()}
            </>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, color: colors.textSecondary }}>Đang tìm sản phẩm...</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={{ width: '50%', padding: 4 }}>
                  <ProductCard item={item} customWidth="100%" />
                </View>
              )}
              ListEmptyComponent={() => (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={80} color={colors.border} />
                  <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào cho "{searchQuery}"</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={() => setIsSearching(false)}>
                    <Text style={{ color: colors.primary }}>Thử từ khóa khác</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* FILTER MODAL */}
      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFilters(false)}
        >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Animated.View 
                  style={[
                    styles.filterModal, 
                    { 
                      paddingBottom: insets.bottom + 20,
                      transform: [{ translateY: panY }]
                    }
                  ]}
                >
                  <View {...panResponder.panHandlers}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>
                  </View>
                  
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.filterLabel}>Khoảng giá</Text>
                    <View style={styles.priceRow}>
                      <TextInput 
                        style={styles.priceInput} 
                        placeholder="Tối thiểu" 
                        keyboardType="numeric"
                        value={filters.minPrice}
                        onChangeText={v => setFilters({...filters, minPrice: v})}
                      />
                      <View style={styles.priceDivider} />
                      <TextInput 
                        style={styles.priceInput} 
                        placeholder="Tối đa" 
                        keyboardType="numeric"
                        value={filters.maxPrice}
                        onChangeText={v => setFilters({...filters, maxPrice: v})}
                      />
                    </View>

                    <Text style={styles.filterLabel}>Danh mục</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catGrid}>
                      {categories.map(cat => (
                        <TouchableOpacity 
                          key={cat.id} 
                          style={[styles.catChip, filters.categoryId === cat.id && styles.catChipActive]}
                          onPress={() => setFilters({...filters, categoryId: filters.categoryId === cat.id ? null : cat.id})}
                        >
                          <Text style={[styles.catText, filters.categoryId === cat.id && styles.catTextActive]}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {brands.length > 0 && (
                      <>
                        <Text style={styles.filterLabel}>Thương hiệu gợi ý</Text>
                        <View style={styles.brandGrid}>
                          {brands.map((b, idx) => (
                            <TouchableOpacity 
                              key={idx} 
                              style={[styles.brandChip, filters.brand === b && styles.brandChipActive]}
                              onPress={() => setFilters({...filters, brand: filters.brand === b ? null : b})}
                            >
                              <Text style={[styles.brandText, filters.brand === b && styles.brandTextActive]}>{b}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}

                    <Text style={styles.filterLabel}>Đánh giá</Text>
                    <View style={styles.ratingRow}>
                      {[5, 4, 3, 2, 1].map(r => (
                        <TouchableOpacity 
                          key={r} 
                          style={[styles.ratingBtn, filters.rating === r && styles.ratingBtnActive]}
                          onPress={() => setFilters({...filters, rating: filters.rating === r ? null : r})}
                        >
                          <Ionicons name="star" size={14} color={filters.rating === r ? '#FFF' : '#FFD700'} />
                          <Text style={[styles.ratingText, filters.rating === r && styles.ratingTextActive]}>{r} sao</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.resetBtn} onPress={() => setFilters({ minPrice: '', maxPrice: '', categoryId: null, brand: null, rating: null })}>
                        <Text style={styles.resetText}>Thiết lập lại</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.applyBtn} onPress={() => { setShowFilters(false); fetchResults(searchQuery); }}>
                        <Text style={styles.applyText}>Áp dụng</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: colors.text,
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
  filterToggle: {
    paddingLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  priceInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  priceDivider: {
    width: 12,
    height: 1,
    backgroundColor: colors.textMuted,
  },
  catGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  catText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  catTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  brandChipActive: {
    backgroundColor: '#FFF',
    borderColor: colors.primary,
  },
  brandText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  brandTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  ratingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  ratingBtnActive: {
    backgroundColor: colors.primary,
  },
  ratingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  ratingTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  resetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  applyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '700',
  }
});
