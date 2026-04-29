import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

export const FlashSale = ({ data }: { data: any[] }) => {
  const navigation = useNavigation<any>();
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.flashText}>FLASH</Text>
          <Text style={styles.saleText}> SALE</Text>
          <View style={styles.timerContainer}>
            <Text style={styles.timerBox}>1B</Text>
            <Text style={{color: '#000', fontWeight: 'bold'}}>:</Text>
            <Text style={styles.timerBox}>24</Text>
            <Text style={{color: '#000', fontWeight: 'bold'}}>:</Text>
            <Text style={styles.timerBox}>59</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Xem tất cả {'>'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
        {data.map((item, index) => {
          // Fake discount data
          const discount = 20 + (index * 5); // 20%, 25%, 30%...
          const discountedPrice = item.price * (1 - discount / 100);
          const soldPercentage = Math.floor(Math.random() * 80) + 10;
          const mainImage = item.images && item.images.length > 0 ? item.images[0].imageUrl : 'https://via.placeholder.com/150';

          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            >
              <View style={styles.imageBox}>
                <Image source={{ uri: mainImage }} style={styles.image} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>-{discount}%</Text>
                </View>
              </View>
              <Text style={styles.price} numberOfLines={1}>
                ₫{discountedPrice.toLocaleString('vi-VN')}
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${soldPercentage}%` }]} />
                <Text style={styles.progressText}>Đang bán chạy</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginBottom: 8,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ee4d2d', // Shopee orange
    fontStyle: 'italic',
  },
  saleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ee4d2d',
    fontStyle: 'italic',
    marginRight: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerBox: {
    backgroundColor: '#000',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  seeAll: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scrollArea: {
    paddingHorizontal: 12,
    gap: 12,
  },
  card: {
    width: 120,
    alignItems: 'center',
  },
  imageBox: {
    width: 120,
    height: 120,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255,212,36,0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    color: colors.danger,
    fontWeight: '700',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ee4d2d',
    marginBottom: 6,
  },
  progressBarBg: {
    width: '90%',
    height: 14,
    backgroundColor: '#ffbda6',
    borderRadius: 7,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ee4d2d',
  },
  progressText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
    zIndex: 1,
  },
});
