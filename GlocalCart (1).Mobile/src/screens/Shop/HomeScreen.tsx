import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../services/api/apiClient';
import { colors } from '../../theme/colors';
import { Loading } from '../../components/common/Loading';

// Import shop sub-components
import { HomeHeader } from '../../components/shop/HomeHeader';
import { FlashSale } from '../../components/shop/FlashSale';
import { DailyDiscover } from '../../components/shop/DailyDiscover';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const prodRes = await apiClient.get('/products') as any;
      setProducts(prodRes?.items || prodRes || []);
    } catch (error) {
      console.warn("Home fetch error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.wrapper, { maxWidth: '100%' }]}>
        <HomeHeader />

        {isLoading && !refreshing ? (
          <Loading message="Đang tải dữ liệu..." />
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 176.5 + insets.bottom }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
            showsVerticalScrollIndicator={false}
          >
            <FlashSale data={products.slice(0, 5)} />
            <DailyDiscover data={products} />
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
  },
  wrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
});
