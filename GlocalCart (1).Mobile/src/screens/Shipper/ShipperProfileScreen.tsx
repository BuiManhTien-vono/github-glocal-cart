import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal } from 'react-native';
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
  todayFailed: 0,
  monthCompleted: 0,
  monthIncome: 0,
  monthFailed: 0,
  allCompleted: 0,
  allIncome: 0,
  allFailed: 0,
  activeShipments: 0,
  pendingCodAmount: 0,
  successRate: 100,
  rating: 4.8,
};

const ADMIN_SUPPORT_CHAT = {
  supportAdmin: true,
  peerId: 'admin',
  peerName: 'GlocalCart Admin',
  avatarUrl: 'https://ui-avatars.com/api/?name=GC+Admin&background=2563EB&color=fff&size=80&bold=true',
};

const SHIPPER_GUIDES = [
  {
    title: 'Quy trình nhận và giao đơn',
    body: 'Cập nhật vị trí, chọn đơn phù hợp, xác nhận lấy hàng tại shop và giao tới người nhận theo đúng trạng thái trong app.',
  },
  {
    title: 'Xác nhận thanh toán khi giao',
    body: 'Với đơn COD, chỉ xác nhận đã nhận tiền sau khi thu đủ tiền từ người mua. Với chuyển khoản, chờ trạng thái thanh toán hoàn tất.',
  },
  {
    title: 'Xử lý giao hàng thất bại',
    body: 'Khi không liên hệ được người nhận hoặc địa chỉ không hợp lệ, dùng chức năng báo giao thất bại và ghi rõ lý do để admin hỗ trợ.',
  },
];

const SHIPPER_POLICIES = [
  {
    title: 'Tuân thủ quy trình giao hàng',
    body: 'Shipper cần cập nhật đúng trạng thái đơn hàng trên ứng dụng: nhận đơn, lấy hàng, đến nơi, xác nhận thanh toán và hoàn tất giao hàng. Không tự ý chuyển giao đơn cho người khác khi chưa có xác nhận từ hệ thống.',
  },
  {
    title: 'Bảo quản hàng hóa',
    body: 'Hàng hóa phải được giữ nguyên tình trạng khi nhận từ shop. Với sản phẩm dễ vỡ, thực phẩm hoặc hàng cần bảo quản đặc biệt, shipper cần vận chuyển cẩn thận và báo ngay cho admin nếu phát sinh rủi ro.',
  },
  {
    title: 'Quy định thu hộ COD',
    body: 'Chỉ thu đúng số tiền hiển thị trên ứng dụng. Không yêu cầu thêm phụ phí ngoài hệ thống. Tiền COD phải được xác nhận đầy đủ trước khi hoàn tất trạng thái giao hàng.',
  },
  {
    title: 'Bảo mật thông tin khách hàng',
    body: 'Thông tin người mua, số điện thoại, địa chỉ và nội dung đơn hàng chỉ được sử dụng cho mục đích giao hàng. Không chia sẻ, lưu trữ hoặc sử dụng thông tin này cho mục đích cá nhân.',
  },
  {
    title: 'Xử lý vi phạm',
    body: 'Các hành vi giao sai trạng thái, thu sai tiền, làm thất lạc hàng hóa hoặc sử dụng thông tin khách hàng sai mục đích có thể dẫn đến khóa tài khoản shipper và xử lý theo quy định của GlocalCart.',
  },
];

export default function ShipperProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<ShipperStats>(defaultStats);
  const [refreshing, setRefreshing] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

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

  const openAdminSupportChat = () => {
    navigation.navigate('ChatDetail', ADMIN_SUPPORT_CHAT);
  };

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
          <Text style={styles.sectionTitle}>Thống kê</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="checkmark-circle" color={colors.success} value={`${stats.todayCompleted}`} label="Đã giao" onPress={() => navigation.navigate('Completed')} />
            <StatCard icon="wallet" color={colors.primary} value={formatCurrency(stats.todayIncome)} label="Thu nhập" onPress={() => navigation.navigate('Completed')} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard icon="bicycle" color={colors.secondary} value={`${stats.activeShipments}`} label="Đang giữ" onPress={() => navigation.navigate('Delivering')} />
            <StatCard icon="cash" color={colors.warning} value={formatCurrency(stats.pendingCodAmount)} label="COD" onPress={() => navigation.navigate('Delivering')} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard icon="layers" color={colors.secondary} value={`${stats.monthCompleted}`} label="Đơn tháng" onPress={() => navigation.navigate('Completed', { period: 'month', periodRequestAt: Date.now() })} />
            <StatCard icon="trending-up" color={colors.success} value={`${stats.successRate}%`} label="Tỉ lệ thành công" onPress={() => navigation.navigate('Completed')} />
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <OptionItem icon="lock-closed-outline" text="Đổi mật khẩu" onPress={() => navigation.navigate('ShipperChangePassword')} />
          <OptionItem icon="document-text-outline" text="Chính sách & Quy định" onPress={() => setShowPolicyModal(true)} />
        </View>

        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          <OptionItem icon="newspaper-outline" text="Hướng dẫn" onPress={() => setShowGuideModal(true)} />
          <OptionItem icon="chatbubble-ellipses-outline" text="Liên hệ" onPress={openAdminSupportChat} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showGuideModal} transparent animationType="slide" onRequestClose={() => setShowGuideModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.guideModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.guideModalHeader}>
              <View style={styles.guideModalIcon}>
                <Ionicons name="newspaper-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guideModalTitle}>Hướng dẫn Shipper</Text>
                <Text style={styles.guideModalSubtitle}>Các lưu ý vận hành thường dùng</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGuideModal(false)} style={styles.guideCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.guideList}>
              {SHIPPER_GUIDES.map((guide, index) => (
                <View key={`${guide.title}-${index}`} style={styles.guideItem}>
                  <View style={styles.guideDot} />
                  <View style={styles.guideTextWrap}>
                    <Text style={styles.guideTitle}>{guide.title}</Text>
                    <Text style={styles.guideBody}>{guide.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showPolicyModal} transparent animationType="slide" onRequestClose={() => setShowPolicyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.guideModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.guideModalHeader}>
              <View style={styles.guideModalIcon}>
                <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guideModalTitle}>Chính sách & Quy định</Text>
                <Text style={styles.guideModalSubtitle}>Quy tắc vận hành dành cho shipper</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPolicyModal(false)} style={styles.guideCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.guideList}>
              {SHIPPER_POLICIES.map((policy, index) => (
                <View key={`${policy.title}-${index}`} style={styles.guideItem}>
                  <View style={styles.policyDot} />
                  <View style={styles.guideTextWrap}>
                    <Text style={styles.guideTitle}>{policy.title}</Text>
                    <Text style={styles.guideBody}>{policy.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  guideModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: '78%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  guideModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  guideModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideModalTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  guideModalSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  guideCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideList: { paddingBottom: 8 },
  guideItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  guideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  policyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginTop: 7,
  },
  guideTextWrap: { flex: 1 },
  guideTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  guideBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 5 },
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
