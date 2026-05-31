import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { resolveProductImageUrl } from '../../utils/imageUtils';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { favorites, isLoading, loadFavorites, removeFavorite } = useFavoritesStore();

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const renderItem = ({ item }: any) => {
    const image =
      resolveProductImageUrl(item.mediaUrl) ||
      resolveProductImageUrl(item.productImage) ||
      resolveProductImageUrl(item.imageUrls?.[0]);
    const stock = Number(item.availableItemCount ?? item.stock ?? 0);
    const hasStock = item.availableItemCount != null || item.stock != null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <View style={styles.imageWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {!!item.sellerName && <Text style={styles.shop} numberOfLines={1}>{item.sellerName}</Text>}
          <Text style={styles.price}>{Number(item.price || 0).toLocaleString('vi-VN')}đ</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.rating}>{Number(item.averageRating || 0).toFixed(1)}</Text>
            {hasStock && <Text style={styles.sold}>| Còn {stock}</Text>}
          </View>
        </View>
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => removeFavorite(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="heart" size={24} color={colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sản Phẩm Yêu Thích ({favorites.length})</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && favorites.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="heart-dislike-outline" size={80} color={colors.border} />
              <Text style={styles.emptyText}>Chưa có sản phẩm yêu thích nào</Text>
              <TouchableOpacity style={styles.goShopBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
                <Text style={styles.goShopText}>Khám phá ngay</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContainer: { padding: 12, flexGrow: 1 },
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 12, marginBottom: 12, ...shadow.sm },
  imageWrap: { width: 90, height: 90, borderRadius: 8, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },
  shop: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  price: { fontSize: 16, fontWeight: '800', color: colors.primary },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
  sold: { fontSize: 12, color: colors.textSecondary, marginLeft: 6 },
  heartBtn: { alignSelf: 'flex-start', padding: 8, marginRight: -8, marginTop: -8 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40, flex: 1 },
  emptyText: { marginTop: 16, color: colors.textSecondary, fontSize: 16 },
  goShopBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 },
  goShopText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
