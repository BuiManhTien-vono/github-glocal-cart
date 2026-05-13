import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard, ScrollView } from 'react-native';
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
  const [isSearching, setIsSearching] = useState(false); // Mode: showing results or showing suggestions

  useEffect(() => {
    loadHistory();
  }, []);

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
      // Using /products/search or fallback to /products?name=...
      const res: any = await apiClient.get(`/products/search?name=${query}`);
      setProducts(res?.items || res || []);
    } catch (error) {
      console.log('Search error:', error);
      try {
        const fallback: any = await apiClient.get(`/products?name=${query}`);
        setProducts(fallback?.items || fallback || []);
      } catch (e) {
        setProducts([]);
      }
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
  }
});
