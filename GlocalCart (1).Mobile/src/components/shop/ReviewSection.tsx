import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

interface ReviewSectionProps {
  productId: number;
  navigation?: any;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, navigation }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');

  const FILTERS = [
    { key: 'all', label: 'Tất cả' },
    { key: '5', label: '5 Sao' },
    { key: '4', label: '4 Sao' },
    { key: 'image', label: 'Có hình ảnh' },
    { key: 'comment', label: 'Có bình luận' },
  ];

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res: any = await apiClient.get(`/products/${productId}/reviews`);
      if (res && res.items) {
        const enhancedReviews = res.items.map((item: any, index: number) => ({
          ...item,
          avatar: `https://i.pravatar.cc/150?u=${item.userId}`,
          variant: 'Phân loại: Mặc định',
          images: index % 2 === 0 ? ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'] : []
        }));
        setReviews(enhancedReviews);
        setTotalItems(res.totalItems || 0);
      }
    } catch (error) {
      console.log('fetchReviews error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === '5') return r.rating === 5;
    if (activeFilter === '4') return r.rating === 4;
    if (activeFilter === 'image') return r.images && r.images.length > 0;
    if (activeFilter === 'comment') return r.comment && r.comment.trim().length > 0;
    return true;
  });

  const renderStars = (rating: number, size: number = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={size} color="#FFD700" />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="small" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đánh giá sản phẩm</Text>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation?.navigate('AllReviews', { productId, totalItems })}
        >
          <Text style={styles.viewAllText}>Xem tất cả ({totalItems})</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.overviewContainer}>
        <View style={styles.ratingScore}>
          <Text style={styles.scoreText}>4.9</Text>
          <Text style={styles.scoreTotal}>/ 5</Text>
        </View>
        <View style={styles.starsWrap}>
          {renderStars(5, 18)}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredReviews.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có đánh giá nào cho sản phẩm này.</Text>
      ) : (
        <View style={styles.listContainer}>
          {filteredReviews.slice(0, 3).map((item) => (

            <View key={item.id} style={styles.reviewItem}>
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
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  overviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  ratingScore: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 12,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 36,
  },
  scoreTotal: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
    marginLeft: 2,
  },
  starsWrap: {
    justifyContent: 'center',
  },
  filterScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  filterText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  center: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  listContainer: {
  },
  reviewItem: {
    flexDirection: 'row',
    padding: 16,
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
});
