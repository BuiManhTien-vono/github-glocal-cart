import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function ShipperProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();

  // Mock data for shipper statistics
  const [stats] = useState({
    todayCompleted: 12,
    todayIncome: 350000,
    monthCompleted: 156,
    monthIncome: 4500000,
    rating: 4.8,
  });

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header - User Info */}
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://ui-avatars.com/api/?name=' + (user?.fullName || 'Shipper') + '&background=random&color=fff' }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Tên Shipper'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '09xxxxxxxx'}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{stats.rating}</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Thống kê hôm nay</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={styles.statValue}>{stats.todayCompleted}</Text>
              <Text style={styles.statLabel}>Đã giao</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="wallet" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{formatCurrency(stats.todayIncome)}</Text>
              <Text style={styles.statLabel}>Thu nhập</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Thống kê tháng</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="layers" size={32} color={colors.secondary} />
              <Text style={styles.statValue}>{stats.monthCompleted}</Text>
              <Text style={styles.statLabel}>Tổng đơn</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={32} color={colors.success} />
              <Text style={styles.statValue}>{formatCurrency(stats.monthIncome)}</Text>
              <Text style={styles.statLabel}>Tổng thu nhập</Text>
            </View>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Thiết lập tài khoản</Text>
          
          <TouchableOpacity style={styles.optionItem} onPress={() => navigation.navigate('ShipperChangePassword')}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.text} />
            <Text style={styles.optionText}>Đổi mật khẩu</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={() => {}}>
            <Ionicons name="document-text-outline" size={24} color={colors.text} />
            <Text style={styles.optionText}>Chính sách & Quy định</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={() => {}}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <Text style={styles.optionText}>Hỗ trợ Shipper</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
  },
  scrollContent: {
    paddingBottom: 100, // For bottom tabs
  },
  header: {
    backgroundColor: colors.primary,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  userInfo: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
    marginLeft: 8,
  },
});
