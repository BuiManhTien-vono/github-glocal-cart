import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import { fetchPagedItems } from '../../services/api/pagedApi';

type SellerProduct = {
  id: number | string;
  name?: string;
  reviewCount?: number;
};

type SellerReview = {
  id: string;
  userId?: number | string;
  buyer: string;
  rating: number;
  product: string;
  productId: number | string;
  comment: string;
  date: string;
  createdAt?: string;
  avatar: string;
};

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: '5', label: '5 sao' },
  { key: '4', label: '4 sao' },
  { key: '3', label: '3 sao' },
  { key: 'low', label: '1-2 sao' },
];

const emptyStats = {
  average: 0,
  total: 0,
  star5: 0,
  star4: 0,
  star3: 0,
  star2: 0,
  star1: 0,
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
};

const avatarUrl = (name: string, userId?: number | string) => {
  const avatarName = encodeURIComponent(name || `KH ${userId || ''}`.trim() || 'KH');
  return `https://ui-avatars.com/api/?name=${avatarName}&background=FF6B35&color=fff&size=80&bold=true`;
};

export default function SellerReviewScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadReviews = useCallback(async (showInitialLoading = true) => {
    try {
      if (showInitialLoading) setIsLoading(true);
      setErrorMessage('');

      const products = await fetchPagedItems<SellerProduct>('/products/my-products');
      if (!products.length) {
        setReviews([]);
        return;
      }

      const reviewGroups = await Promise.all(
        products.map(async (product: SellerProduct) => {
          try {
            if ('reviewCount' in product && Number(product.reviewCount || 0) <= 0) {
              return [];
            }
            const productReviews = await fetchPagedItems<any>(`/products/${product.id}/reviews`);
            return productReviews.map((item: any) => {
              const buyer = item.userName || item.buyer || 'Khách hàng';
              const createdAt = item.createdAt || item.createdDate || item.date;
              return {
                id: `${product.id}-${item.id}`,
                userId: item.userId,
                buyer,
                rating: Number(item.rating || 0),
                product: product.name || item.productName || 'Sản phẩm',
                productId: product.id,
                comment: item.review || item.comment || '',
                date: formatDate(createdAt),
                createdAt,
                avatar: item.avatar || avatarUrl(buyer, item.userId),
              };
            });
          } catch (error) {
            console.warn('SellerReview product reviews fetch error:', product.id, error);
            return [];
          }
        })
      );

      const mergedReviews = reviewGroups
        .flat()
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setReviews(mergedReviews);
    } catch (error: any) {
      console.warn('SellerReview fetch error:', error);
      setReviews([]);
      setErrorMessage(error?.message || 'Không thể tải đánh giá. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews])
  );

  const stats = useMemo(() => {
    if (!reviews.length) return emptyStats;

    return reviews.reduce(
      (result, review) => {
        const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating || 0))));
        result.total += 1;
        result.average += rating;
        if (rating === 5) result.star5 += 1;
        if (rating === 4) result.star4 += 1;
        if (rating === 3) result.star3 += 1;
        if (rating === 2) result.star2 += 1;
        if (rating === 1) result.star1 += 1;
        return result;
      },
      { ...emptyStats }
    );
  }, [reviews]);

  const averageRating = stats.total ? stats.average / stats.total : 0;

  const ratingDist = [
    { star: 5, count: stats.star5 },
    { star: 4, count: stats.star4 },
    { star: 3, count: stats.star3 },
    { star: 2, count: stats.star2 },
    { star: 1, count: stats.star1 },
  ];

  const tabCounts = {
    all: stats.total,
    '5': stats.star5,
    '4': stats.star4,
    '3': stats.star3,
    low: stats.star1 + stats.star2,
  };

  const filtered = reviews.filter(review => {
    if (activeTab === 'all') return true;
    if (activeTab === 'low') return review.rating <= 2;
    return review.rating === Number(activeTab);
  });

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews(false);
  };

  const renderStars = (rating: number, size = 13) => (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(star => (
        <Ionicons key={star} name={star <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color="#FFD700" />
      ))}
    </View>
  );

  const renderReview = ({ item }: { item: SellerReview }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
        <View style={styles.reviewMeta}>
          <Text style={styles.buyerName}>{item.buyer}</Text>
          <View style={styles.starsLine}>
            {renderStars(item.rating)}
            {item.date ? <Text style={styles.reviewDate}>{item.date}</Text> : null}
          </View>
        </View>
      </View>
      <Text style={styles.productLabel}>Sản phẩm: {item.product}</Text>
      <Text style={styles.reviewComment}>{item.comment || 'Khách hàng chưa nhập nội dung đánh giá.'}</Text>
      <TouchableOpacity style={styles.replyBtn} activeOpacity={0.8}>
        <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
        <Text style={styles.replyText}>Phản hồi</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đánh giá Shop</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá Shop</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.avgScore}>{averageRating.toFixed(1)}</Text>
          {renderStars(averageRating, 18)}
          <Text style={styles.totalReviews}>{stats.total} đánh giá</Text>
        </View>
        <View style={styles.summaryRight}>
          {ratingDist.map(({ star, count }) => (
            <View key={star} style={styles.barRow}>
              <Text style={styles.barLabel}>{star}★</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${stats.total ? (count / stats.total) * 100 : 0}%` as any }]} />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tabsWrap}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabChipText, activeTab === tab.key && styles.tabChipTextActive]}>
              {tab.label} ({tabCounts[tab.key as keyof typeof tabCounts]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderReview}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <Ionicons name={errorMessage ? 'alert-circle-outline' : 'star-outline'} size={56} color={colors.border} />
            <Text style={styles.emptyText}>
              {errorMessage || 'Chưa có đánh giá nào từ người mua.'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSpacer: { width: 40 },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },

  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    margin: 12,
    borderRadius: 14,
    padding: 16,
    gap: 16,
    ...shadow.sm,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 84 },
  avgScore: { fontSize: 40, fontWeight: '900', color: colors.text, lineHeight: 44 },
  totalReviews: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  summaryRight: { flex: 1, justifyContent: 'center', gap: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { fontSize: 11, color: colors.textSecondary, width: 24, textAlign: 'right' },
  barBg: { flex: 1, height: 6, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  barCount: { fontSize: 11, color: colors.textSecondary, width: 22 },

  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starsLine: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

  tabsWrap: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexWrap: 'wrap',
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  tabChipTextActive: { color: colors.white, fontWeight: '700' },

  listContent: { padding: 12, paddingBottom: 40 },
  reviewCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 14, marginBottom: 10, ...shadow.sm },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.borderLight },
  reviewMeta: { flex: 1 },
  buyerName: { fontSize: 14, fontWeight: '700', color: colors.text },
  reviewDate: { fontSize: 11, color: colors.textMuted, marginLeft: 8 },
  productLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontStyle: 'italic' },
  reviewComment: { fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 10 },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: colors.primaryBg,
  },
  replyText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: colors.textSecondary, textAlign: 'center' },
});
