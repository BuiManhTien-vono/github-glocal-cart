import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform,
  TextInput, Modal, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme/colors';
import { ChatBadge } from '../../components/common/ChatBadge';
import apiClient from '../../services/api/apiClient';

// ─── Đổi mật khẩu Modal ───
function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPwd || !newPwd || !confirmPwd) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.put('/auth/change-password', { oldPassword: oldPwd, newPassword: newPwd });
      Alert.alert('✅ Thành công', 'Đã đổi mật khẩu thành công!', [{ text: 'OK', onPress: onClose }]);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.sheetHeader}>
              <Text style={m.sheetTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
            </View>

            {[
              { label: 'Mật khẩu hiện tại', value: oldPwd, set: setOldPwd },
              { label: 'Mật khẩu mới', value: newPwd, set: setNewPwd },
              { label: 'Xác nhận mật khẩu mới', value: confirmPwd, set: setConfirmPwd },
            ].map(field => (
              <View key={field.label} style={m.fieldGroup}>
                <Text style={m.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={m.input}
                  secureTextEntry
                  value={field.value}
                  onChangeText={field.set}
                  placeholder="••••••••"
                  placeholderTextColor="#ccc"
                />
              </View>
            ))}

            <TouchableOpacity
              style={[m.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={m.submitText}>{loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AccountSettingsScreen({ navigation }: any) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [showChangePwd, setShowChangePwd] = useState(false);

  const APP_VERSION = '1.0.0';

  const handleItem = (label: string, screen?: string) => {
    if (screen) {
      navigation.navigate(screen);
      return;
    }
    // Các mục không có screen → hiện nội dung hoặc thông báo
    switch (label) {
      case 'Đổi mật khẩu':
        setShowChangePwd(true);
        break;
      case 'Cài đặt Chat':
        Alert.alert('Cài đặt Chat', 'Hiện chưa có tùy chọn cài đặt chat. Cập nhật sắp tới!');
        break;
      case 'Cài đặt Thông báo':
        Alert.alert('Cài đặt Thông báo', 'Cho phép thông báo đẩy để nhận cập nhật đơn hàng và ưu đãi kịp thời.');
        break;
      case 'Cài đặt riêng tư':
        Alert.alert('Cài đặt riêng tư', 'Dữ liệu của bạn được bảo vệ theo chính sách bảo mật GlocalCart.');
        break;
      case 'Người dùng đã bị chặn':
        Alert.alert('Người dùng đã bị chặn', 'Bạn chưa chặn người dùng nào.');
        break;
      case 'Ngôn ngữ / Language / ភាសា':
        Alert.alert('Ngôn ngữ', 'Hiện tại ứng dụng hỗ trợ tiếng Việt. Các ngôn ngữ khác sẽ được cập nhật sớm.');
        break;
      case 'Trung tâm hỗ trợ':
        Alert.alert('Trung tâm hỗ trợ', 'Liên hệ hỗ trợ:\n📧 support@glocalcart.app\n📞 1800-6789\n⏰ 8:00 - 22:00 mỗi ngày');
        break;
      case 'Tiêu chuẩn cộng đồng':
        Alert.alert('Tiêu chuẩn cộng đồng', 'GlocalCart cam kết xây dựng môi trường mua bán lành mạnh, an toàn và minh bạch cho tất cả người dùng.');
        break;
      case 'Điều khoản GlocalCart':
        Alert.alert('Điều khoản dịch vụ', 'Bằng cách sử dụng GlocalCart, bạn đồng ý với các điều khoản dịch vụ và chính sách bảo mật của chúng tôi.');
        break;
      case 'Giới Thiệu':
        Alert.alert(`GlocalCart v${APP_VERSION}`, `Phiên bản: ${APP_VERSION}\n\nGlocalCart – Nền tảng mua bán đa nền tảng.\nCopyright © 2026 GlocalCart Inc.`);
        break;
      case 'Yêu cầu xóa tài khoản':
        Alert.alert(
          'Xóa tài khoản',
          'Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Xóa tài khoản', style: 'destructive', onPress: () => Alert.alert('Đã ghi nhận', 'Yêu cầu của bạn đã được ghi nhận. Tài khoản sẽ bị xóa sau 7 ngày.') },
          ]
        );
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc muốn đăng xuất?')) logout();
      return;
    }
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const sections = [
    {
      title: 'Tài khoản',
      items: [
        { label: 'Đổi mật khẩu', icon: 'lock-closed-outline', color: '#7C3AED' },
        { label: 'Sổ Địa Chỉ', icon: 'location-outline', screen: 'Addresses', color: '#2563EB' },
        { label: 'Tài khoản / Thẻ Ngân hàng', icon: 'card-outline', screen: 'PaymentMethods', color: '#16A34A' },
      ],
    },
    {
      title: 'Cài đặt',
      items: [
        { label: 'Cài đặt Chat', icon: 'chatbubble-outline', color: '#EE4D2D' },
        { label: 'Cài đặt Thông báo', icon: 'notifications-outline', color: '#F59E0B' },
        { label: 'Cài đặt riêng tư', icon: 'shield-outline', color: '#6366F1' },
        { label: 'Người dùng đã bị chặn', icon: 'ban-outline', color: '#EF4444' },
        { label: 'Ngôn ngữ / Language / ភាសា', icon: 'language-outline', color: '#0EA5E9', sub: 'Tiếng Việt' },
      ],
    },
    {
      title: 'Hỗ trợ',
      items: [
        { label: 'Trung tâm hỗ trợ', icon: 'headset-outline', color: '#EE4D2D' },
        { label: 'Tiêu chuẩn cộng đồng', icon: 'people-outline', color: '#8B5CF6' },
        { label: 'Điều khoản GlocalCart', icon: 'document-text-outline', color: '#64748B' },
        { label: 'Giới Thiệu', icon: 'information-circle-outline', color: '#0EA5E9', sub: `v${APP_VERSION}` },
        { label: 'Yêu cầu xóa tài khoản', icon: 'trash-outline', color: '#EF4444' },
      ],
    },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Thiết lập tài khoản</Text>
        <TouchableOpacity style={s.chatBtn} onPress={() => navigation.navigate('ChatList')}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
          <ChatBadge />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {sections.map((section, idx) => (
          <View key={idx} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.itemsContainer}>
              {section.items.map((item: any, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.item, i === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => handleItem(item.label, item.screen)}
                >
                  <View style={[s.itemIcon, { backgroundColor: (item.color || colors.primary) + '15' }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color || colors.primary} />
                  </View>
                  <View style={s.itemLeft}>
                    <Text style={s.itemLabel}>{item.label}</Text>
                    {item.sub && <Text style={s.itemSub}>{item.sub}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Đăng xuất */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={s.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      <ChangePasswordModal visible={showChangePwd} onClose={() => setShowChangePwd(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  chatBtn: { position: 'relative', padding: 4 },

  section: { marginTop: 10 },
  sectionTitle: { fontSize: 12, color: '#999', fontWeight: '600', paddingHorizontal: 16, paddingVertical: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemsContainer: { backgroundColor: '#fff' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0', gap: 12,
  },
  itemIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  itemLeft: { flex: 1 },
  itemLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
  itemSub: { fontSize: 12, color: '#999', marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, margin: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: colors.danger + '40',
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#333', backgroundColor: '#fafafa',
  },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
