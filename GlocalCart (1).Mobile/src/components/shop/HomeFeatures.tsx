import { Image } from 'expo-image';
import React from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

const features = [
  { id: '1', title: 'Khung Giờ\nSăn Sale', icon: 'https://cf.shopee.vn/file/vn-50009109-8a387d78a7ad954ec489d3ef9abd60b4_xhdpi' },
  { id: '2', title: 'Miễn Phí\nVận Chuyển', icon: 'https://cf.shopee.vn/file/vn-50009109-f6c34d719c3e4d33857371458e7a7059_xhdpi' },
  { id: '3', title: 'Voucher\nGiảm Đến 500K', icon: 'https://cf.shopee.vn/file/vn-50009109-852300c407c5e79bf5dc1854aa0cfeef_xhdpi' },
  { id: '4', title: 'Hàng Hiệu\nGiảm 50%', icon: 'https://cf.shopee.vn/file/vn-50009109-c7a2e1ae72c0969d022b73a5a73e6da0_xhdpi' },
  { id: '5', title: 'Mã Giảm Giá', icon: 'https://cf.shopee.vn/file/vn-50009109-9b2f213df65d44cc963be54911d87a4d_xhdpi' },
  { id: '6', title: 'GlocalCart\nMall', icon: 'https://cf.shopee.vn/file/8b111db09cf932147eb861d84f475a89_xhdpi' },
  { id: '7', title: 'Nạp Thẻ,\nDịch Vụ', icon: 'https://cf.shopee.vn/file/vn-50009109-e85df6def05ee8a8eb543f06d7df1aa7_xhdpi' },
  { id: '8', title: 'Khách Hàng\nThân Thiết', icon: 'https://cf.shopee.vn/file/vn-50009109-5c4aa30eb28972e61df55af1544a8fb9_xhdpi' },
  { id: '9', title: 'Bắt Trend\nGiá Sốc', icon: 'https://cf.shopee.vn/file/vn-50009109-d7790b9f1d04494bfd0a1b8bb9687eec_xhdpi' },
  { id: '10', title: 'GlocalCart\nSupermarket', icon: 'https://cf.shopee.vn/file/vn-50009109-90bcfe7844a4e1015c7e1da526315570_xhdpi' },
];

export const HomeFeatures = () => {
  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        {features.map((item) => (
          <TouchableOpacity key={item.id} style={styles.featureItem}>
            <View style={styles.iconContainer}>
              <Image source={{ uri: item.icon }} style={styles.icon} />
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
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
    paddingVertical: 15,
    marginBottom: 8,
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 5,
  },
  featureItem: {
    width: '20%', // 5 items per row
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: 55,
    height: 55,
    borderRadius: 18,
  },
  title: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '400',
    paddingHorizontal: 2,
  },
});
