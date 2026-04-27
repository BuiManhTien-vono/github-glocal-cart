import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

export const ProductCard = ({ item, customWidth }: { item: any, customWidth?: any }) => {
  const navigation = useNavigation<any>();
  const mainImage = item.images && item.images.length > 0 ? item.images[0].imageUrl : 'https://via.placeholder.com/200';
  const soldCount = Math.floor(Math.random() * 2000) + 10; // mock sold

  return (
    <TouchableOpacity 
      style={[styles.card, customWidth ? { width: customWidth } : {}]}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: mainImage }} style={styles.image} resizeMode="cover" />
        {/* Mall or Favorite badge could go here */}
        <View style={styles.badgeFav}>
          <Text style={styles.badgeFavText}>Yêu thích</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        
        {/* Discount Tag */}
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Rẻ Vô Địch</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            <Text style={styles.currency}>₫</Text>
            {item.price.toLocaleString('vi-VN')}
          </Text>
          <Text style={styles.sold}>Đã bán {soldCount >= 1000 ? `${(soldCount/1000).toFixed(1)}k` : soldCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '49%', // Responsive 2 columns
    backgroundColor: colors.white,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Square image
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeFav: {
    position: 'absolute',
    top: 4,
    left: -4,
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  badgeFavText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  infoContainer: {
    padding: 8,
  },
  name: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    height: 32, // limit to 2 lines
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  tagText: {
    fontSize: 9,
    color: colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currency: {
    fontSize: 10,
    textDecorationLine: 'underline',
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  sold: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
