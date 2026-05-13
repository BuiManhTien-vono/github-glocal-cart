import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';

const dummyBanners = [
  'https://cf.shopee.vn/file/vn-11134258-7r98o-lstywnjrybhk03', // Mock Shopee links
  'https://cf.shopee.vn/file/vn-11134258-7r98o-lstywnjrzp200h',
  'https://cf.shopee.vn/file/vn-11134258-7r98o-lstywnjs13mc11',
];

export const HomeBanner = () => {
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);

  return (
    <View 
      style={styles.container} 
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {dummyBanners.map((img, index) => (
          <Image 
            key={index} 
            source={{ uri: img }} 
            style={[styles.bannerImage, { width: containerWidth }]} 
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 7, 
    width: '100%',
    backgroundColor: '#fff',
    maxHeight: 300, // Limit height on large screens
  },
  scrollView: {
    flex: 1,
  },
  bannerImage: {
    height: '100%',
  },
});
