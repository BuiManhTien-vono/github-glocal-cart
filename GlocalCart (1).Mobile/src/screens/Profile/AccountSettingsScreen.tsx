import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform,
  TextInput, Modal, KeyboardAvoidingView, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme/colors';
import { ChatBadge } from '../../components/common/ChatBadge';
import apiClient from '../../services/api/apiClient';

const ADMIN_SUPPORT_CHAT = {
  conversationId: 'admin-support',
  peerId: 'admin',
  peerName: 'GlocalCart Admin',
  avatarUrl: 'https://ui-avatars.com/api/?name=GC+Admin&background=2563EB&color=fff&size=80&bold=true',
};

// --- Custom Switch Component ---
function CustomSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={{
        width: 46,
        height: 24,
        borderRadius: 12,
        backgroundColor: value ? '#16A34A' : '#E5E7EB',
        padding: 2,
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
      }}
    >
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', elevation: 1 }} />
    </TouchableOpacity>
  );
}

// --- Đổi mật khẩu Modal ---
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

// --- Cài đặt Chat Modal ---
function ChatSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [autoReply, setAutoReply] = useState(true);
  const [preview, setPreview] = useState(true);
  const [sound, setSound] = useState(true);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>Cài đặt Chat</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
          </View>
          
          <View style={m.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={m.rowLabel}>Tự động gửi tin nhắn chào mừng</Text>
              <Text style={m.rowDesc}>Tự động trả lời khi có khách hàng nhắn tin lần đầu</Text>
            </View>
            <CustomSwitch value={autoReply} onValueChange={setAutoReply} />
          </View>

          <View style={m.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={m.rowLabel}>Xem trước tin nhắn</Text>
              <Text style={m.rowDesc}>Hiển thị nội dung tin nhắn trên thanh thông báo</Text>
            </View>
            <CustomSwitch value={preview} onValueChange={setPreview} />
          </View>

          <View style={m.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={m.rowLabel}>Âm thanh & Rung</Text>
              <Text style={m.rowDesc}>Phát âm thanh và rung khi có tin nhắn mới</Text>
            </View>
            <CustomSwitch value={sound} onValueChange={setSound} />
          </View>

          <TouchableOpacity style={m.submitBtn} onPress={onClose}>
            <Text style={m.submitText}>Lưu cài đặt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// --- Cài đặt Thông báo Modal ---
function NotificationSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [promo, setPromo] = useState(true);
  const [order, setOrder] = useState(true);
  const [account, setAccount] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>Cài đặt Thông báo</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
          </View>
          
          <View style={m.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={m.rowLabel}>Khuyến mãi & Ưu đãi</Text>
              <Text style={m.rowDesc}>Nhận tin nhắn về mã giảm giá, khuyến mãi độc quyền</Text>
            </View>
            <CustomSwitch value={promo} onValueChange={setPromo} />
          </View>

          <View style={m.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={m.rowLabel}>Cập nhật Đơn hàng</Text>
              <Text style={m.rowDesc}>Thông báo khi trạng thái đơn hàng thay đổi</Text>
            </View>
            <CustomSwitch value={order} onValueChange={setOrder} />
          </View>

          <View style={m.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={m.rowLabel}>Bảo mật & Tài khoản</Text>
              <Text style={m.rowDesc}>Thông báo khi phát hiện đăng nhập lạ hoặc đổi mật khẩu</Text>
            </View>
            <CustomSwitch value={account} onValueChange={setAccount} />
          </View>

          <TouchableOpacity style={m.submitBtn} onPress={onClose}>
            <Text style={m.submitText}>Lưu cài đặt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// --- Cài đặt Riêng tư Modal ---
function PrivacySettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [active, setActive] = useState(true);
  const [location, setLocation] = useState(true);
  const [bio, setBio] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>Cài đặt Riêng tư</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
          </View>
          
          <View style={m.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={m.rowLabel}>Trạng thái hoạt động</Text>
              <Text style={m.rowDesc}>Cho người khác thấy khi bạn đang trực tuyến</Text>
            </View>
            <CustomSwitch value={active} onValueChange={setActive} />
          </View>

          <View style={m.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={m.rowLabel}>Chia sẻ Vị trí</Text>
              <Text style={m.rowDesc}>Sử dụng GPS để định vị địa chỉ giao hàng chính xác hơn</Text>
            </View>
            <CustomSwitch value={location} onValueChange={setLocation} />
          </View>

          <View style={m.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={m.rowLabel}>Đăng nhập sinh trắc học</Text>
              <Text style={m.rowDesc}>Yêu cầu FaceID hoặc Vân tay khi mở ứng dụng</Text>
            </View>
            <CustomSwitch value={bio} onValueChange={setBio} />
          </View>

          <TouchableOpacity style={m.submitBtn} onPress={onClose}>
            <Text style={m.submitText}>Lưu cài đặt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// --- Người dùng đã chặn Modal ---
function BlockedUsersModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [users, setUsers] = useState([
    { id: 1, name: 'Shop Gia Dụng Giá Rẻ', date: '20/05/2026' },
    { id: 2, name: 'Spammer 999', date: '18/05/2026' }
  ]);

  const handleUnblock = (id: number, name: string) => {
    Alert.alert('Bỏ chặn', `Bạn có chắc muốn bỏ chặn ${name}?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Bỏ chặn', onPress: () => {
          setUsers(users.filter(u => u.id !== id));
          Alert.alert('✅ Thành công', `Đã bỏ chặn ${name}.`);
        }
      }
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.sheet, { maxHeight: '80%' }]}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>Người dùng đã chặn</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
          </View>

          <ScrollView style={{ marginVertical: 10 }}>
            {users.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="people-outline" size={48} color="#ccc" style={{ marginBottom: 12 }} />
                <Text style={{ color: '#999', fontSize: 14 }}>Bạn chưa chặn người dùng nào</Text>
              </View>
            ) : (
              users.map(u => (
                <View key={u.id} style={m.userRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={m.userName}>{u.name}</Text>
                    <Text style={m.userDate}>Đã chặn ngày {u.date}</Text>
                  </View>
                  <TouchableOpacity style={m.unblockBtn} onPress={() => handleUnblock(u.id, u.name)}>
                    <Text style={m.unblockText}>Bỏ chặn</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// --- Chọn ngôn ngữ Modal ---
function LanguageModal({ visible, selected, onSelect, onClose }: { visible: boolean; selected: string; onSelect: (v: string) => void; onClose: () => void }) {
  const languages = [
    { key: 'vi', name: 'Tiếng Việt', sub: 'Vietnamese' },
    { key: 'en', name: 'English', sub: 'Tiếng Anh' },
    { key: 'km', name: 'ភាសាខ្មែរ', sub: 'Khmer' }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>Chọn ngôn ngữ</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
          </View>

          {languages.map(l => (
            <TouchableOpacity
              key={l.key}
              style={[m.langRow, selected === l.key && m.langRowActive]}
              onPress={() => {
                onSelect(l.key);
                onClose();
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[m.langName, selected === l.key && { color: colors.primary, fontWeight: '700' }]}>{l.name}</Text>
                <Text style={m.langSub}>{l.sub}</Text>
              </View>
              {selected === l.key && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// --- Trung tâm hỗ trợ Modal ---
function SupportCenterModal({ visible, onClose, navigation }: { visible: boolean; onClose: () => void; navigation: any }) {
  const { isLoggedIn } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const openAdminSupportChat = () => {
    if (!isLoggedIn) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để chat với CSKH.');
      return;
    }
    onClose();
    navigation.navigate('ChatDetail', ADMIN_SUPPORT_CHAT);
  };

  const faqs = [
    {
      q: 'Làm sao để hủy đơn hàng?',
      a: 'Bạn có thể vào mục Đơn Hàng -> Chọn đơn hàng cần hủy -> Nhấn nút Hủy đơn hàng ở cuối màn hình nếu đơn hàng đang ở trạng thái Chờ xác nhận.'
    },
    {
      q: 'Giao hàng mất bao lâu?',
      a: 'Thông thường thời gian giao hàng dao động từ 1 - 3 ngày làm việc đối với đơn hàng nội tỉnh, và 3 - 5 ngày đối với liên tỉnh.'
    },
    {
      q: 'Làm sao để đăng ký bán hàng?',
      a: 'Vào trang Hồ sơ cá nhân của bạn -> Chọn "Kích hoạt tài khoản người bán". Bạn sẽ được cấp quyền đăng bán sản phẩm ngay lập tức.'
    }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.sheet, { height: '85%' }]}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>Trung tâm hỗ trợ</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* FAQ Section */}
            <Text style={m.sectionLabel}>Câu hỏi thường gặp (FAQ)</Text>
            {faqs.map((faq, idx) => (
              <View key={idx} style={m.faqItem}>
                <TouchableOpacity
                  style={m.faqHeader}
                  activeOpacity={0.7}
                  onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <Text style={m.faqQuestion}>{faq.q}</Text>
                  <Ionicons name={expandedFaq === idx ? 'chevron-up' : 'chevron-down'} size={18} color="#999" />
                </TouchableOpacity>
                {expandedFaq === idx && (
                  <View style={m.faqAnswer}>
                    <Text style={m.faqAnswerText}>{faq.a}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Contact Section */}
            <Text style={[m.sectionLabel, { marginTop: 20 }]}>Kênh liên hệ trực tiếp</Text>
            
            <TouchableOpacity style={m.contactCard} onPress={() => Linking.openURL('tel:18006789')}>
              <Ionicons name="call-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={m.contactTitle}>Tổng đài Chăm sóc khách hàng</Text>
                <Text style={m.contactVal}>1800-6789 (Miễn phí cước gọi)</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={m.contactCard} onPress={() => Linking.openURL('mailto:support@glocalcart.app')}>
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={m.contactTitle}>Email hỗ trợ</Text>
                <Text style={m.contactVal}>support@glocalcart.app</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={m.contactCard}
              onPress={openAdminSupportChat}
            >
              <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={m.contactTitle}>Chat với hỗ trợ viên</Text>
                <Text style={m.contactVal}>Hỗ trợ trực tuyến 24/7</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// --- Tài liệu Điều khoản & Tiêu chuẩn cộng đồng Modal ---
function TextContentModal({ visible, title, content, onClose }: { visible: boolean; title: string; content: string[]; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.sheet, { height: '80%' }]}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {content.map((p, i) => (
              <Text key={i} style={m.paragraphText}>{p}</Text>
            ))}
          </ScrollView>
          <TouchableOpacity style={m.submitBtn} onPress={onClose}>
            <Text style={m.submitText}>Tôi đã hiểu & Đồng ý</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const COMMUNITY_GUIDELINES = [
  "1. Tôn trọng cộng đồng: GlocalCart cam kết duy trì một không gian an toàn, tôn trọng và công bằng cho tất cả các thành viên. Mọi bình luận, nhắn tin xúc phạm, kỳ thị sẽ bị xử lý nghiêm khắc.",
  "2. Thông tin trung thực: Người bán cam kết cung cấp thông tin sản phẩm đầy đủ, đúng thực tế và có trách nhiệm với chất lượng sản phẩm đăng bán. Hành vi giả mạo sản phẩm hoặc lừa đảo sẽ bị khóa tài khoản vĩnh viễn.",
  "3. Giao dịch an toàn: Mọi giao dịch nên được tiến hành qua các công cụ thanh toán được tích hợp sẵn của GlocalCart để bảo vệ tối đa quyền lợi của cả người mua và người bán.",
  "4. Không spam & quảng cáo rác: Nghiêm cấm mọi hành vi gửi tin nhắn quảng cáo hàng loạt, lôi kéo người dùng sang các nền tảng khác nhằm mục đích trục lợi bất chính."
];

const TERMS_OF_SERVICE = [
  "1. Chấp thuận điều khoản: Bằng việc đăng ký tài khoản và sử dụng ứng dụng GlocalCart, người dùng đồng ý tuân thủ toàn bộ các điều khoản dịch vụ và chính sách bảo mật của chúng tôi.",
  "2. Trách nhiệm tài khoản: Người dùng có trách nhiệm bảo mật thông tin mật khẩu đăng nhập cá nhân. Mọi hoạt động xảy ra dưới tài khoản của bạn sẽ thuộc về trách nhiệm của bạn.",
  "3. Quyền sở hữu trí tuệ: Tất cả hình ảnh, giao diện, logo, mã nguồn thuộc GlocalCart đều là tài sản trí tuệ được bảo hộ. Nghiêm cấm hành vi sao chép hoặc phân phối trái phép.",
  "4. Giới hạn trách nhiệm: GlocalCart đóng vai trò là nền tảng kết nối người mua và người bán. Chúng tôi hỗ trợ giải quyết tranh chấp nhưng không chịu trách nhiệm trực tiếp đối với chất lượng dịch vụ hoặc sản phẩm của bên thứ ba."
];

export default function AccountSettingsScreen({ navigation }: any) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [lang, setLang] = useState('vi'); // 'vi', 'en', 'km'

  const APP_VERSION = '1.0.0';

  const handleItem = (label: string, screen?: string) => {
    if (screen) {
      navigation.navigate(screen);
      return;
    }
    
    // Tự động mở Modal tương ứng với Label
    if (label === 'Yêu cầu xóa tài khoản') {
      Alert.alert(
        'Xóa tài khoản',
        'Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xóa tài khoản', style: 'destructive', onPress: () => Alert.alert('Đã ghi nhận', 'Yêu cầu của bạn đã được ghi nhận. Tài khoản sẽ bị xóa sau 7 ngày.') },
        ]
      );
    } else {
      setActiveModal(label);
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

  const getLangSubtext = (key: string) => {
    if (key === 'vi') return 'Tiếng Việt';
    if (key === 'en') return 'English';
    return 'ភាសាខ្មែរ';
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
        { label: 'Ngôn ngữ / Language / ភាសា', icon: 'language-outline', color: '#0EA5E9', sub: getLangSubtext(lang) },
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
        {sections.filter((_, idx) => idx !== 1).map((section, idx) => {
          const visibleItems = section.items.filter((item: any) => item.icon !== 'trash-outline');

          return (
            <View key={idx} style={s.section}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <View style={s.itemsContainer}>
                {visibleItems.map((item: any, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.item, i === visibleItems.length - 1 && { borderBottomWidth: 0 }]}
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
          );
        })}

        {/* Đăng xuất */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={s.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals cài đặt & hỗ trợ */}
      <ChangePasswordModal visible={activeModal === 'Đổi mật khẩu'} onClose={() => setActiveModal(null)} />
      <ChatSettingsModal visible={activeModal === 'Cài đặt Chat'} onClose={() => setActiveModal(null)} />
      <NotificationSettingsModal visible={activeModal === 'Cài đặt Thông báo'} onClose={() => setActiveModal(null)} />
      <PrivacySettingsModal visible={activeModal === 'Cài đặt riêng tư'} onClose={() => setActiveModal(null)} />
      <BlockedUsersModal visible={activeModal === 'Người dùng đã bị chặn'} onClose={() => setActiveModal(null)} />
      <LanguageModal visible={activeModal === 'Ngôn ngữ / Language / ភាសា'} selected={lang} onSelect={setLang} onClose={() => setActiveModal(null)} />
      <SupportCenterModal visible={activeModal === 'Trung tâm hỗ trợ'} onClose={() => setActiveModal(null)} navigation={navigation} />
      <TextContentModal visible={activeModal === 'Tiêu chuẩn cộng đồng'} title="Tiêu chuẩn cộng đồng" content={COMMUNITY_GUIDELINES} onClose={() => setActiveModal(null)} />
      <TextContentModal visible={activeModal === 'Điều khoản GlocalCart'} title="Điều khoản dịch vụ" content={TERMS_OF_SERVICE} onClose={() => setActiveModal(null)} />
      
      {/* Giới thiệu */}
      <Modal visible={activeModal === 'Giới Thiệu'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={[m.overlay, { justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={{ backgroundColor: '#fff', margin: 24, borderRadius: 20, padding: 24, alignItems: 'center' }}>
            <View style={{ width: 70, height: 70, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="cart" size={40} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#333' }}>GlocalCart</Text>
            <Text style={{ fontSize: 13, color: '#999', marginTop: 4 }}>Phiên bản {APP_VERSION}</Text>
            
            <View style={{ width: '100%', height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 }} />
            
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 }}>
              GlocalCart – Nền tảng mua sắm kết nối người bán địa phương và khách hàng toàn cầu, mang lại trải nghiệm tiện lợi và an tâm tuyệt đối.
            </Text>
            <Text style={{ fontSize: 11, color: '#aaa', marginTop: 24 }}>
              Copyright © 2026 GlocalCart Inc. All rights reserved.
            </Text>
            
            <TouchableOpacity style={[m.submitBtn, { width: '100%' }]} onPress={() => setActiveModal(null)}>
              <Text style={m.submitText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
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
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  
  // Custom switch rows
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  rowDesc: { fontSize: 12, color: '#999', marginTop: 2, paddingRight: 10 },
  
  // Blocked users
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  userName: { fontSize: 15, fontWeight: '600', color: '#333' },
  userDate: { fontSize: 12, color: '#999', marginTop: 2 },
  unblockBtn: { borderWidth: 1, borderColor: colors.danger, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  unblockText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  
  // Languages
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  langRowActive: { backgroundColor: '#FFFAF9' },
  langName: { fontSize: 15, color: '#333' },
  langSub: { fontSize: 12, color: '#999', marginTop: 2 },
  
  // Support Center
  sectionLabel: { fontSize: 13, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  faqItem: { borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0', paddingVertical: 12 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1, marginRight: 10 },
  faqAnswer: { marginTop: 8, paddingHorizontal: 4, paddingVertical: 6 },
  faqAnswerText: { fontSize: 13, color: '#666', lineHeight: 18 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#ECECEC', borderRadius: 10, padding: 14, marginBottom: 10 },
  contactTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  contactVal: { fontSize: 12, color: '#666', marginTop: 2 },
  
  // Paragraphs
  paragraphText: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 16 },
});
