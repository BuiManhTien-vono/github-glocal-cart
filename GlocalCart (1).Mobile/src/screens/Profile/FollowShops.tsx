import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/apiClient';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { Image } from 'expo-image';

interface Shop {
  id: number;
  name: string;
  logoUrl?: string;
  productCount?: number;
  isFollowing?: boolean;
}

export const FollowedShopsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn) fetchFollowedShops();
    else setIsLoading(false);
  }, []);

  const fetchFollowedShops = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/shops/followed') as any;
      setShops(res || []);
    } catch (err) {
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = (shopId: number, shopName: string) => {
    Alert.alert(
      'Hủy theo dõi',
      `Bạn có muốn hủy theo dõi "${shopName}"?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy theo dõi',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/shops/${shopId}/follow`);
              setShops(prev => prev.filter(s => s.id !== shopId));
            } catch {
              Alert.alert('Lỗi', 'Không thể hủy theo dõi. Thử lại sau.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={s.shopItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ShopView', { shopId: item.id })}
    >
      <View style={s.logoWrap}>
        {item.logoUrl ? (
          <Image source={{ uri: resolveProductImageUrl(item.logoUrl) || item.logoUrl }} style={s.logo} />
        ) : (
          <View style={[s.logo, s.logoPlaceholder]}>
            <Ionicons name="storefront-outline" size={24} color={colors.textMuted} />
          </View>
        )}
      </View>
      <View style={s.shopInfo}>
        <Text style={s.shopName}>{item.name}</Text>
        {item.productCount !== undefined && (
          <Text style={s.shopSub}>{item.productCount} sản phẩm</Text>
        )}
      </View>
      <TouchableOpacity
        style={s.unfollowBtn}
        onPress={() => handleUnfollow(item.id, item.name)}
      >
        <Text style={s.unfollowText}>Đang theo dõi</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Shop Đang Theo Dõi</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : shops.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="storefront-outline" size={70} color="#ddd" />
          <Text style={s.emptyText}>Bạn chưa theo dõi shop nào</Text>
          <Text style={s.emptySub}>Hãy khám phá và theo dõi các shop yêu thích</Text>
          <TouchableOpacity
            style={s.exploreBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Text style={s.exploreBtnText}>Khám phá ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#555', fontWeight: '600', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#999', marginTop: 6, textAlign: 'center' },
  exploreBtn: {
    marginTop: 20, backgroundColor: colors.primary,
    paddingHorizontal: 28, paddingVertical: 10, borderRadius: 8,
  },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shopItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
  },
  logoWrap: { marginRight: 14 },
  logo: { width: 52, height: 52, borderRadius: 26 },
  logoPlaceholder: { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 15, fontWeight: '600', color: '#333' },
  shopSub: { fontSize: 12, color: '#999', marginTop: 3 },
  unfollowBtn: {
    borderWidth: 1, borderColor: '#ccc',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  unfollowText: { fontSize: 12, color: '#555' },
  separator: { height: 0.5, backgroundColor: '#f0f0f0' },
});
