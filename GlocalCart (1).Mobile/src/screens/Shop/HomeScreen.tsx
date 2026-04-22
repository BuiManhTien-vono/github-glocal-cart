import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, SafeAreaView, Platform, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/api/apiClient';
import { colors } from '../../theme/colors';
import { Loading } from '../../components/common/Loading';

// Import shop sub-components
import { HomeHeader } from '../../components/shop/HomeHeader';
import { HomeBanner } from '../../components/shop/HomeBanner';
import { HomeFeatures } from '../../components/shop/HomeFeatures';
import { HomeCategories } from '../../components/shop/HomeCategories';
import { FlashSale } from '../../components/shop/FlashSale';
import { DailyDiscover } from '../../components/shop/DailyDiscover';

const isWeb = Platform.OS === 'web';

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth > 768;

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Parallel data fetching
      const [catRes, prodRes] = await Promise.all([
        apiClient.get('/categories') as any,
        apiClient.get('/products') as any,
      ]);
      setCategories(catRes?.items || catRes || []);
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
    <SafeAreaView style={[styles.safeArea, { alignItems: 'stretch' }]}>
      <View style={[styles.wrapper, { maxWidth: '100%' }]}>
        <HomeHeader />
        
        {isLoading && !refreshing ? (
          <Loading message="Đang tải dữ liệu..." />
        ) : (
          <ScrollView 
            style={styles.container}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
            showsVerticalScrollIndicator={false}
          >
            <HomeBanner />
            <HomeFeatures />
            <HomeCategories data={categories} />
            
            {/* Lấy 5 sản phẩm đầu tiên cho FlashSale */}
            <FlashSale data={products.slice(0, 5)} />
            
            <DailyDiscover data={products} />
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
  },
  wrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5', 
  },
  container: {
    flex: 1,
  },
});
