import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

const dummyBrands = [
  'https://via.placeholder.com/100/D0011B/FFFFFF?text=Coolmate',
  'https://via.placeholder.com/100/000000/FFFFFF?text=Lados',
  'https://via.placeholder.com/100/1E90FF/FFFFFF?text=Adidass',
  'https://via.placeholder.com/100/FF8C00/FFFFFF?text=Glocal',
  'https://via.placeholder.com/100/800080/FFFFFF?text=PNJ',
  'https://via.placeholder.com/100/008000/FFFFFF?text=Grab',
];

export const ShopeeMallBrands = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GLOCAL CART MALL</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Xem tất cả {'>'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
        {dummyBrands.map((brand, idx) => (
          <TouchableOpacity key={idx} style={styles.brandCard}>
            <View style={styles.imageBox}>
              <Image source={{ uri: brand }} style={styles.image} resizeMode="contain" />
            </View>
          </TouchableOpacity>
        ))}
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
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D0011B', 
  },
  seeAll: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scrollArea: {
    paddingHorizontal: 12,
    gap: 12,
  },
  brandCard: {
    width: 80,
    alignItems: 'center',
  },
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
  },
});
