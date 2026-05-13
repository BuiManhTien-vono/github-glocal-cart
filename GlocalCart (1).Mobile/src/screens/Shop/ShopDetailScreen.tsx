import { Image } from 'expo-image';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function ShopDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();

  // Mock data matching the image provided
  const shopData = {
    name: 'Glocal Cart Official Store',
    logo: 'https://ui-avatars.com/api/?name=G&background=000&color=fff&size=80&bold=true',
    isOnline: true,
    followers: '304,9k',
    following: '4',
    rating: '4.9',
    totalRatings: '194,2k',
    chatResponseRate: '100%',
    chatResponseTime: 'Trong vòng vài tiếng',
    cancelRate: '2%',
    products: '189',
    joined: '4 năm',
    description: 'Gi gỉ gì gi cái gì cũng có'
  };

  const renderRow = (icon: string, label: string, value: string, subValue?: string, showArrow?: boolean, isLink?: boolean) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={20} color={colors.textSecondary} style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, isLink && styles.linkText]}>{value}</Text>
        {subValue && <Text style={styles.rowSubValue}> ({subValue})</Text>}
        {showArrow && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết Shop</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SHOP INFO HEADER */}
        <View style={styles.shopProfile}>
          <Image source={{ uri: shopData.logo }} style={styles.logo} />
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{shopData.name}</Text>
            {shopData.isOnline && (
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}
            <View style={styles.followStats}>
              <View style={styles.favBadge}><Text style={styles.favText}>Yêu thích</Text></View>
              <Text style={styles.followText}>Người theo dõi {shopData.followers} | Đang Theo {shopData.following}</Text>
            </View>
          </View>
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* STATS LIST */}
        <TouchableOpacity>
          {renderRow('star-outline', 'Đánh giá', `${shopData.rating} / 5`, `${shopData.totalRatings} Đánh giá`, true)}
        </TouchableOpacity>
        <View style={styles.lineDivider} />

        {renderRow('chatbubble-ellipses-outline', 'Tỉ lệ phản hồi Chat', shopData.chatResponseRate, shopData.chatResponseTime)}
        <View style={styles.lineDivider} />

        {renderRow('close-circle-outline', 'Tỉ lệ hủy đơn', shopData.cancelRate)}
        <View style={styles.lineDivider} />

        {renderRow('cube-outline', 'Sản phẩm', shopData.products)}
        <View style={styles.lineDivider} />

        {renderRow('person-outline', 'Đã tham gia', shopData.joined)}
        <View style={styles.lineDivider} />

        {renderRow('document-text-outline', 'Mô tả Shop', shopData.description)}
        <View style={styles.lineDivider} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Tài khoản đã được xác minh</Text>
          </View>
          <View style={styles.rowRight}>
            <View style={[styles.verifyIcon, { backgroundColor: '#10B981' }]}><Ionicons name="phone-portrait" size={10} color="#fff" /></View>
            <View style={[styles.verifyIcon, { backgroundColor: '#F43F5E' }]}><Ionicons name="mail" size={10} color="#fff" /></View>
            <View style={[styles.verifyIcon, { backgroundColor: '#3B82F6' }]}><Ionicons name="logo-facebook" size={10} color="#fff" /></View>
          </View>
        </View>
        <View style={styles.lineDivider} />

        {/* BOTTOM ACTION */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.allProductsBtn}
            onPress={() => navigation.navigate('ShopView', { activeTab: 'products' })}
          >
            <Text style={styles.allProductsText}>Xem tất cả sản phẩm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  shopProfile: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  followStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favBadge: {
    backgroundColor: '#ee4d2d',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 6,
  },
  favText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  followText: {
    fontSize: 13,
    color: colors.text,
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
  lineDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 40,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.text,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  rowValue: {
    fontSize: 14,
    color: '#ee4d2d',
  },
  rowSubValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  linkText: {
    color: '#ee4d2d',
  },
  verifyIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  bottomSection: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f5f5f5',
  },
  allProductsBtn: {
    backgroundColor: '#ee4d2d',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
  },
  allProductsText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});
