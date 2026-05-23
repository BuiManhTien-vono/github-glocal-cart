import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import apiClient from '../../services/api/apiClient';
import { colors } from '../../theme/colors';

interface ReviewItem {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  avatar?: string;
  variant?: string;
  images?: string[];
}

export default function AllReviewsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { productId, productName } = route.params;

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    average: 5.0,
    total: 0,
    star5: 0,
    star4: 0,
    star3: 0,
    star2: 0,
    star1: 0,
    hasImage: 0,
    hasComment: 0
  });

  const FILTERS = [
    { key: 'all', label: `Tất cả (${stats.total})` },
    { key: '5', label: `5 Sao (${stats.star5})` },
    { key: '4', label: `4 Sao (${stats.star4})` },
    { key: '3', label: `3 Sao (${stats.star3})` },
    { key: '2', label: `2 Sao (${stats.star2})` },
    { key: '1', label: `1 Sao (${stats.star1})` },
    { key: 'image', label: `Có hình ảnh (${stats.hasImage})` },
    { key: 'comment', label: `Có bình luận (${stats.hasComment})` },
  ];

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res: any = await apiClient.get(`/products/${productId}/reviews?pageSize=100`);
      if (res && res.items) {
        const enhancedReviews = res.items.map((item: any, index: number) => ({
          ...item,
          comment: item.review || item.comment || '',
          avatar: `https://i.pravatar.cc/150?u=${item.userId}`,
          variant: 'Phân loại: Mặc định',
          images: index % 2 === 0 ? ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'] : []
        }));

        setReviews(enhancedReviews);

        // Calculate statistics based on fetched reviews
        const total = res.totalCount || enhancedReviews.length;
        let sumRating = 0;
        let star5 = 0;
        let star4 = 0;
        let star3 = 0;
        let star2 = 0;
        let star1 = 0;
        let hasImage = 0;
        let hasComment = 0;

        enhancedReviews.forEach((r: any) => {
          sumRating += r.rating;
          if (r.rating === 5) star5++;
          else if (r.rating === 4) star4++;
          else if (r.rating === 3) star3++;
          else if (r.rating === 2) star2++;
          else if (r.rating === 1) star1++;

          if (r.images && r.images.length > 0) hasImage++;
          if (r.comment && r.comment.trim().length > 0) hasComment++;
        });

        const average = total > 0 ? sumRating / total : 5.0;

        setStats({
          average,
          total,
          star5,
          star4,
          star3,
          star2,
          star1,
          hasImage,
          hasComment
        });
      }
    } catch (error) {
      console.log('fetchReviews error in AllReviewsScreen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === '5') return r.rating === 5;
    if (activeFilter === '4') return r.rating === 4;
    if (activeFilter === '3') return r.rating === 3;
    if (activeFilter === '2') return r.rating === 2;
    if (activeFilter === '1') return r.rating === 1;
    if (activeFilter === 'image') return r.images && r.images.length > 0;
    if (activeFilter === 'comment') return r.comment && r.comment.trim().length > 0;
    return true;
  });

  const renderStars = (rating: number, size: number = 12) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={size} color="#FFD700" style={{ marginRight: 2 }} />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  const renderReviewItem = ({ item }: { item: ReviewItem }) => (
    <View style={styles.reviewItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.reviewContent}>
        <Text style={styles.userName}>{item.userName}</Text>
        {renderStars(item.rating)}
        
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.metaText}> | {item.variant}</Text>
        </View>
        
        {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
        
        {item.images && item.images.length > 0 && (
          <View style={styles.reviewImagesContainer}>
            {item.images.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={styles.reviewImage} />
            ))}
          </View>
        )}
        
        <View style={styles.helpfulRow}>
          <Ionicons name="thumbs-up-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.helpfulText}>Hữu ích?</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>Đánh giá sản phẩm</Text>
          {productName ? <Text style={styles.headerSubtitle} numberOfLines={1}>{productName}</Text> : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReviewItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerComponent}>
              {/* Score Overview */}
              <View style={styles.overviewContainer}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>{stats.average.toFixed(1)}</Text>
                  <Text style={styles.scoreMax}>/5</Text>
                </View>
                <View style={styles.starsBox}>
                  {renderStars(Math.round(stats.average), 18)}
                  <Text style={styles.totalReviewsText}>{stats.total} đánh giá</Text>
                </View>
              </View>

              {/* Filters list */}
              <View style={styles.filtersWrapper}>
                <Text style={styles.filterTitle}>Lọc theo</Text>
                <View style={styles.filtersGrid}>
                  {FILTERS.map(f => (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                      onPress={() => setActiveFilter(f.key)}
                    >
                      <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbox-ellipses-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Không tìm thấy đánh giá nào phù hợp.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerComponent: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  overviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 16,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 40,
  },
  scoreMax: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 6,
    marginLeft: 2,
  },
  starsBox: {
    justifyContent: 'center',
  },
  totalReviewsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  filtersWrapper: {
    padding: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 18,
    backgroundColor: '#FAFaFA',
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  reviewItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: colors.borderLight,
  },
  reviewContent: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  comment: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewImagesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  reviewImage: {
    width: 70,
    height: 70,
    borderRadius: 4,
  },
  helpfulRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  helpfulText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
});
