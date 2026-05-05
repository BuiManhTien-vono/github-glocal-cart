import { Image } from 'expo-image';
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

export const HomeCategories = ({ data }: { data: any[] }) => {
  const navigation = useNavigation<any>();

  if (!data || data.length === 0) return null;

  // A generic fallback icon if category has no image. In real app, category might have an iconUrl.
  const getCategoryIcon = (id: number) => {
    return 'https://via.placeholder.com/100x100.png?text=CAT';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DANH MỤC</Text>
      </View>
      
      <View style={styles.grid}>
        {data.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.itemContainer}
            onPress={() => navigation.navigate('Category', { categoryId: item.id, categoryName: item.name })}
          >
            <View style={styles.imageBox}>
              <Image source={{ uri: getCategoryIcon(item.id) }} style={styles.image} />
            </View>
            <Text style={styles.itemText} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginBottom: 8,
    width: '100%',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  itemContainer: {
    width: '20%', // 5 items per row
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.borderLight,
    // Add subtle grid borders
    borderRightWidth: 0.2,
    borderBottomWidth: 0.2,
  },
  imageBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  itemText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
