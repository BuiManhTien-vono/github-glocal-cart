import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { ShipperStats, shipperService } from '../../services/api/shipperService';

const defaultStats: ShipperStats = {
  todayCompleted: 0,
  todayIncome: 0,
  monthCompleted: 0,
  monthIncome: 0,
  activeShipments: 0,
  pendingCodAmount: 0,
  successRate: 100,
  rating: 4.8,
};

export default function ShipperProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<ShipperStats>(defaultStats);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await shipperService.getStats();
      setStats({ ...defaultStats, ...data });
    } catch (error) {
      console.log('Lỗi tải thống kê shipper', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadStats);
    return unsubscribe;
  }, [navigation, loadStats]);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStats();
            }}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Shipper')}&background=FF6B35&color=fff` }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Tên Shipper'}</Text>
            <Text style={styles.userPhone}>{user?.phone || 'Chưa cập nhật số điện thoại'}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{stats.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Thống kê hôm nay</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="checkmark-circle" color={colors.success} value={`${stats.todayCompleted}`} label="Đã giao" onPress={() => navigation.navigate('Completed')} />
            <StatCard icon="wallet" color={colors.primary} value={formatCurrency(stats.todayIncome)} label="Thu nhập" onPress={() => navigation.navigate('Completed')} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard icon="bicycle" color={colors.secondary} value={`${stats.activeShipments}`} label="Đang giữ" onPress={() => navigation.navigate('Delivering')} />
            <StatCard icon="cash" color={colors.warning} value={formatCurrency(stats.pendingCodAmount)} label="COD" onPress={() => navigation.navigate('Delivering')} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard icon="layers" color={colors.secondary} value={`${stats.monthCompleted}`} label="Đơn tháng" onPress={() => navigation.navigate('Completed')} />
            <StatCard icon="trending-up" color={colors.success} value={`${stats.successRate}%`} label="Tỉ lệ thành công" onPress={() => navigation.navigate('Completed')} />
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Thiết lập tài khoản</Text>
          <OptionItem icon="lock-closed-outline" text="Đổi mật khẩu" onPress={() => navigation.navigate('ShipperChangePassword')} />
          <OptionItem icon="document-text-outline" text="Chính sách & Quy định" onPress={() => Alert.alert('Chính sách', 'Tính năng đang được hoàn thiện.')} />
          <OptionItem icon="help-circle-outline" text="Hỗ trợ Shipper" onPress={() => Alert.alert('Hỗ trợ', 'Liên hệ tổng đài hỗ trợ vận hành.')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  color,
  value,
  label,
  onPress,
}: {
  icon: any;
  color: string;
  value: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.82} disabled={!onPress}>
      <Ionicons name={icon} size={30} color={color} />
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{label}</Text>
        {onPress ? <Ionicons name="chevron-forward" size={13} color={colors.textMuted} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function OptionItem({ icon, text, onPress }: { icon: any; text: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={colors.text} />
      <Text style={styles.optionText}>{text}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { paddingBottom: 100 },
  header: {
    backgroundColor: colors.primary,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#FFF' },
  userInfo: { marginLeft: 18, flex: 1 },
  userName: { fontSize: 21, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  userPhone: { fontSize: 14, color: 'rgba(255,255,255,0.86)', marginBottom: 8 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { color: '#FFF', fontWeight: '800', marginLeft: 4 },
  statsSection: { marginTop: 22, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 12, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 10, marginBottom: 4, maxWidth: '100%' },
  statLabel: { fontSize: 13, color: colors.textSecondary },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  optionsSection: {
    marginTop: 22,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 14,
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
  optionText: { flex: 1, fontSize: 16, color: colors.text, marginLeft: 16 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 28,
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logoutText: { fontSize: 16, fontWeight: '800', color: colors.danger, marginLeft: 8 },
});
