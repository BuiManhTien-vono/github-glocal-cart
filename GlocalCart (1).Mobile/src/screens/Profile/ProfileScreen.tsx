import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated, Modal, TextInput, Dimensions,
  Linking, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';
import { showLoginRequired } from '../../utils/loginRequired';

const { width } = Dimensions.get('window');

const ADMIN_SUPPORT_CHAT = {
  conversationId: 'admin-support',
  peerId: 'admin',
  peerName: 'GlocalCart Admin',
  avatarUrl: 'https://ui-avatars.com/api/?name=GC+Admin&background=2563EB&color=fff&size=80&bold=true',
};

const DEFAULT_HELP_FAQS = [
  ['Làm thế nào để mua hàng?', 'Chọn sản phẩm, thêm vào giỏ hàng, kiểm tra địa chỉ và thanh toán.'],
  ['Thời gian giao hàng bao lâu?', 'Thông thường 1-3 ngày làm việc tùy khu vực nhận hàng.'],
  ['Có những phương thức thanh toán nào?', 'Hỗ trợ chuyển khoản QR ngân hàng và thanh toán khi nhận hàng COD.'],
  ['Đổi trả sản phẩm như thế nào?', 'Hỗ trợ đổi trả trong 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả.'],
];

const DEFAULT_BLOG_POSTS = [
  ['Mẹo săn voucher hiệu quả', 'Cách kết hợp mã giảm giá và freeship khi mua sắm.'],
  ['Bí quyết chọn đặc sản địa phương', 'Nhận biết sản phẩm uy tín từ shop chất lượng.'],
  ['Cẩm nang bán hàng online', 'Gợi ý tối ưu gian hàng cho người bán mới.'],
];

const APP_VERSION = '1.0.0';

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout, isLoggedIn, setGuestMode } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [supportModal, setSupportModal] = useState<'help' | 'contact' | 'blog' | 'about' | null>(null);
  const [helpFaqs, setHelpFaqs] = useState(DEFAULT_HELP_FAQS);
  const [showAddHelpFaq, setShowAddHelpFaq] = useState(false);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [blogPosts, setBlogPosts] = useState(DEFAULT_BLOG_POSTS);
  const [showAddBlogPost, setShowAddBlogPost] = useState(false);
  const [editingBlogIndex, setEditingBlogIndex] = useState<number | null>(null);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogBody, setNewBlogBody] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const openAdminSupportChat = () => {
    if (!isLoggedIn) {
      showLoginRequired(() => setGuestMode(false), 'Vui lòng đăng nhập để chat với CSKH.');
      return;
    }
    setSupportModal(null);
    navigation.navigate('ChatDetail', ADMIN_SUPPORT_CHAT);
  };

  const handleActivateSeller = async () => {
    Alert.alert(
      'Đăng Ký Bán Hàng',
      'Bạn muốn trở thành Người bán trên GlocalCart?\n\nSau khi kích hoạt, bạn có thể đăng bán sản phẩm và quản lý cửa hàng.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              await apiClient.post('/users/activate-seller');
              updateUser({ ...user!, isSeller: true, role: 'Seller' });
              Alert.alert('🎉 Chúc mừng!', 'Bạn đã trở thành Người bán thành công.');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  };

  const handleSupportPress = (label: string) => {
    switch (label) {
      case 'Trung tâm trợ giúp':
        Alert.alert(
          'Trung tâm trợ giúp GlocalCart',
          '💡 1. Làm thế nào để mua hàng?\nChọn sản phẩm, thêm vào giỏ hàng và tiến hành thanh toán.\n\n' +
          '📦 2. Thời gian giao hàng bao lâu?\nThông thường từ 1-3 ngày làm việc tùy thuộc vào địa chỉ nhận hàng.\n\n' +
          '💳 3. Phương thức thanh toán?\nHỗ trợ chuyển khoản ngân hàng qua mã QR hoặc thanh toán khi nhận hàng (COD).\n\n' +
          '🔄 4. Chính sách đổi trả?\nHỗ trợ đổi trả miễn phí trong vòng 7 ngày kể từ khi nhận hàng nếu có lỗi từ nhà sản xuất.',
          [{ text: 'Đã hiểu' }]
        );
        break;
      case 'Chăm sóc khách hàng':
        Alert.alert(
          'Chăm sóc khách hàng',
          'Tổng đài CSKH GlocalCart luôn sẵn sàng phục vụ bạn 24/7.\n\n📞 Hotline: 1900 8888 (1000đ/phút)\n📧 Email: support@glocalcart.vn\n⏰ Giờ làm việc: 08:00 - 22:00 hàng ngày',
          [
            { text: 'Gửi Email', onPress: () => Alert.alert('Gửi Email', 'Vui lòng gửi email hỗ trợ tới: support@glocalcart.vn') },
            { text: 'Chat CSKH', onPress: openAdminSupportChat },
            { text: 'Đóng', style: 'cancel' }
          ]
        );
        break;
      case 'GlocalCart Blog':
        Alert.alert(
          'GlocalCart Blog - Góc chia sẻ',
          '🔥 Các bài viết nổi bật hôm nay:\n\n' +
          '🍵 1. Bí quyết chọn đặc sản chè Thái Nguyên chính gốc.\n' +
          '🛍️ 2. Mẹo săn voucher giảm giá cực hời tại GlocalCart.\n' +
          '🍲 3. Khám phá ẩm thực 3 miền cùng cộng đồng địa phương.\n' +
          '🏪 4. Cẩm nang khởi nghiệp kinh doanh nông sản online hiệu quả.',
          [
            { text: 'Xem sau', style: 'cancel' },
            { text: 'Đọc ngay', onPress: () => Alert.alert('Thông báo', 'Tính năng đọc trực tiếp trên ứng dụng đang được phát triển. Vui lòng quay lại sau!') }
          ]
        );
        break;
      default:
        break;
    }
  };

  const handleAddHelpFaq = () => {
    const question = newFaqQuestion.trim();
    const answer = newFaqAnswer.trim();
    if (!question || !answer) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập câu hỏi và câu trả lời.');
      return;
    }

    setHelpFaqs(prev => [[question, answer], ...prev]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setShowAddHelpFaq(false);
  };

  const openEditHelpFaq = (index: number) => {
    if (!isAdmin) return;
    const faq = helpFaqs[index];
    if (!faq) return;
    setNewFaqQuestion(faq[0]);
    setNewFaqAnswer(faq[1]);
    setEditingFaqIndex(index);
  };

  const handleUpdateHelpFaq = () => {
    if (editingFaqIndex == null) return;

    const question = newFaqQuestion.trim();
    const answer = newFaqAnswer.trim();
    if (!question || !answer) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập câu hỏi và câu trả lời.');
      return;
    }

    setHelpFaqs(prev => prev.map((faq, index) => index === editingFaqIndex ? [question, answer] : faq));
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setEditingFaqIndex(null);
  };

  const handleAddBlogPost = () => {
    const title = newBlogTitle.trim();
    const body = newBlogBody.trim();
    if (!title || !body) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung bài viết.');
      return;
    }

    setBlogPosts(prev => [[title, body], ...prev]);
    setNewBlogTitle('');
    setNewBlogBody('');
    setShowAddBlogPost(false);
  };

  const openEditBlogPost = (index: number) => {
    if (!isAdmin) return;
    const post = blogPosts[index];
    if (!post) return;
    setNewBlogTitle(post[0]);
    setNewBlogBody(post[1]);
    setEditingBlogIndex(index);
  };

  const handleUpdateBlogPost = () => {
    if (editingBlogIndex == null) return;

    const title = newBlogTitle.trim();
    const body = newBlogBody.trim();
    if (!title || !body) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung bài viết.');
      return;
    }

    setBlogPosts(prev => prev.map((post, index) => index === editingBlogIndex ? [title, body] : post));
    setNewBlogTitle('');
    setNewBlogBody('');
    setEditingBlogIndex(null);
  };

  const initial = (user?.fullName || user?.userName || '?')[0].toUpperCase();

  // Shopee-style order status items
  const orderStatusItems = [
    { icon: 'wallet-outline', label: 'Chờ xác nhận', color: colors.primary },
    { icon: 'cube-outline', label: 'Chờ lấy hàng', color: colors.info },
    { icon: 'car-outline', label: 'Chờ giao hàng', color: colors.secondary },
    { icon: 'checkmark-circle-outline', label: 'Đã giao', color: colors.success },
  ];

  const buyerUtilityItems = [
    { icon: 'heart-outline', label: 'Yêu Thích', screen: 'Favorites', color: colors.danger, bg: '#FEF2F2', requireAuth: true },
    { icon: 'storefront-outline', label: 'Theo Dõi Shop', screen: 'FollowedShops', color: colors.warning, bg: '#FFFBEB', requireAuth: true },
    ...(!user?.isSeller ? [{
      icon: 'briefcase-outline',
      label: 'Bán Hàng',
      action: 'seller',
      screen: 'ActivateSeller',
      color: colors.success,
      bg: '#ECFDF5',
      requireAuth: true,
    }] : []),
  ];

  const accountShortcutItems = [
    { icon: 'lock-closed-outline', label: 'Đổi mật khẩu', screen: 'ChangePassword', color: '#7C3AED', bg: '#F5F3FF', requireAuth: true },
    { icon: 'location-outline', label: 'Sổ Địa Chỉ', screen: 'Addresses', color: '#2563EB', bg: '#EFF6FF', requireAuth: true },
    { icon: 'card-outline', label: 'Tài khoản / Thẻ', screen: 'PaymentMethods', color: '#16A34A', bg: '#ECFDF5', requireAuth: true },
  ];
  const showBuyerUtilities = !isAdmin && !user?.isSeller;

  const handleShortcutPress = (item: any) => {
    if (item.requireAuth && !isLoggedIn) {
      showLoginRequired(() => setGuestMode(false), 'Bạn cần đăng nhập để sử dụng tính năng này.');
      return;
    }

    if (item.action === 'seller' && !user?.isSeller) handleActivateSeller();
    else if (item.screen) navigation.navigate(item.screen);
  };

  const supportItems = [
    {
      icon: 'help-circle-outline',
      label: 'Trung tâm trợ giúp',
      sub: 'FAQ mua hàng, thanh toán, giao nhận',
      color: '#2563EB',
      bg: '#EFF6FF',
      modal: 'help' as const,
    },
    {
      icon: 'headset-outline',
      label: 'Chăm sóc khách hàng',
      sub: 'Chat, email hoặc hotline hỗ trợ',
      color: '#16A34A',
      bg: '#ECFDF5',
      modal: 'contact' as const,
    },
    {
      icon: 'newspaper-outline',
      label: 'GlocalCart Blog',
      sub: 'Mẹo mua sắm và tin khuyến mãi',
      color: '#F59E0B',
      bg: '#FFFBEB',
      modal: 'blog' as const,
    },
    {
      icon: 'information-circle-outline',
      label: 'Giới Thiệu',
      sub: `Phiên bản ${APP_VERSION}`,
      color: '#0EA5E9',
      bg: '#F0F9FF',
      modal: 'about' as const,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ===== HEADER GRADIENT ===== */}
        <View style={styles.headerGradient}>
          <View style={styles.headerBg1} />
          <View style={styles.headerBg2} />

          {isLoggedIn ? (
            /* Profile info (Logged In) */
            <View style={styles.profileRow}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={handleEditProfile}
              >
                {(user as any)?.avatarUrl ? (
                  <Image source={{ uri: (user as any).avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initial}</Text>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={10} color="#FFF" />
                </View>
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.fullName || user?.userName}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={[styles.roleBadgeRow, isAdmin && styles.hiddenAdminBadge]}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {isAdmin ? '👑 Admin' : user?.isSeller ? '🏪 Seller' : '🛒 Member'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={handleEditProfile}
              >
                <Ionicons name="create-outline" size={16} color="#FFF" />
                <Text style={styles.editProfileText}>Sửa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Guest Welcome Header */
            <View style={styles.guestHeaderRow}>
              <View style={styles.guestAvatar}>
                <Ionicons name="person-circle-outline" size={60} color="rgba(255,255,255,0.8)" />
              </View>
              <View style={styles.guestInfo}>
                <Text style={styles.guestWelcomeText}>Chào mừng bạn đến với GlocalCart!</Text>
                <TouchableOpacity
                  style={styles.guestLoginBtn}
                  onPress={() => setGuestMode(false)}
                >
                  <Text style={styles.guestLoginText}>Đăng nhập/tạo tài khoản</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isLoggedIn && (
            /* Member card strip */
            <View style={styles.memberCard}>
              <View style={styles.memberLeft}>
                <Ionicons name="diamond-outline" size={16} color={colors.warning} />
                <Text style={styles.memberLabel}>Thành viên GlocalCart</Text>
              </View>
              <Text style={styles.memberPoints}>0 xu</Text>
            </View>
          )}
        </View>

        {!isAdmin && !user?.isSeller && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Đơn Mua</Text>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => {
                  if (!isLoggedIn) {
                    showLoginRequired(() => setGuestMode(false), 'Vui lòng đăng nhập để tiếp tục.');
                    return;
                  }
                  navigation.navigate('MyOrders', { activeTab: 'Tất cả' });
                }}
              >
                <Text style={styles.viewAllText}>Xem lịch sử mua hàng</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.orderStatusRow}>
              {orderStatusItems.map((item, i) => (
                <TouchableOpacity key={i} style={styles.orderStatusItem} onPress={() => {
                  if (!isLoggedIn) {
                    showLoginRequired(() => setGuestMode(false), 'Vui lòng đăng nhập để xem đơn hàng.');
                    return;
                  }
                  navigation.navigate('MyOrders', { activeTab: item.label });
                }}>
                  <View style={[styles.orderStatusIcon, { backgroundColor: item.color + '12' }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <Text style={styles.orderStatusLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ===== BUYER UTILITIES ===== */}
        {showBuyerUtilities && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tiện Ích Của Tôi</Text>
            <View style={styles.utilityGrid}>
              {buyerUtilityItems.map((item, i) => (
                <TouchableOpacity key={i} style={styles.utilityItem} activeOpacity={0.6} onPress={() => handleShortcutPress(item)}>
                  <View style={[styles.utilityIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.utilityLabel} numberOfLines={1}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ===== ACCOUNT SHORTCUTS ===== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.utilityGrid}>
            {accountShortcutItems.map((item, i) => (
              <TouchableOpacity key={i} style={styles.utilityItem} activeOpacity={0.6} onPress={() => handleShortcutPress(item)}>
                <View style={[styles.utilityIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={styles.utilityLabel} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          {supportItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.supportItem, i === 0 && { marginTop: 8 }]}
              activeOpacity={0.7}
              onPress={() => {
                if (isAdmin && item.modal === 'contact') {
                  navigation.navigate('ChatList');
                  return;
                }
                setSupportModal(item.modal);
              }}
            >
              <View style={[styles.supportIconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={styles.supportTextWrap}>
                <Text style={styles.supportLabel}>{item.label}</Text>
                <Text style={styles.supportSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        )}

        <Modal visible={supportModal !== null} transparent animationType="slide" onRequestClose={() => setSupportModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.supportModalContent}>
              <View style={styles.modalHandle} />
              <View style={styles.supportModalHeader}>
                <View style={styles.supportModalIcon}>
                  <Ionicons
                    name={supportModal === 'contact' ? 'headset-outline' : supportModal === 'blog' ? 'newspaper-outline' : supportModal === 'about' ? 'information-circle-outline' : 'help-circle-outline'}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportModalTitle}>
                    {supportModal === 'contact' ? 'Chăm sóc khách hàng' : supportModal === 'blog' ? 'GlocalCart Blog' : supportModal === 'about' ? 'Giới Thiệu' : 'Trung tâm trợ giúp'}
                  </Text>
                  <Text style={styles.supportModalSubtitle}>
                    {supportModal === 'contact' ? 'Chọn kênh hỗ trợ phù hợp với bạn' : supportModal === 'blog' ? 'Tin mới và mẹo mua sắm' : supportModal === 'about' ? `GlocalCart v${APP_VERSION}` : 'Các câu hỏi thường gặp'}
                  </Text>
                </View>
                {isAdmin && (supportModal === 'help' || supportModal === 'blog') && (
                  <TouchableOpacity
                    style={styles.supportAddBtn}
                    onPress={() => {
                      if (supportModal === 'help') {
                        setNewFaqQuestion('');
                        setNewFaqAnswer('');
                        setShowAddHelpFaq(true);
                        return;
                      }
                      setNewBlogTitle('');
                      setNewBlogBody('');
                      setShowAddBlogPost(true);
                    }}
                  >
                    <Ionicons name="add" size={18} color={colors.white} />
                    <Text style={styles.supportAddText}>Thêm mới</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setSupportModal(null)} style={styles.supportCloseBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {supportModal === 'help' && (
                <View style={styles.supportContent}>
                  {helpFaqs.map(([title, body], index) => (
                    <TouchableOpacity
                      key={`${title}-${index}`}
                      style={styles.faqItem}
                      activeOpacity={isAdmin ? 0.75 : 1}
                      onPress={() => openEditHelpFaq(index)}
                      disabled={!isAdmin}
                    >
                      <View style={styles.faqTitleRow}>
                        <Text style={styles.faqTitle}>{title}</Text>
                        {isAdmin && <Ionicons name="create-outline" size={17} color={colors.primary} />}
                      </View>
                      <Text style={styles.faqBody}>{body}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {supportModal === 'contact' && (
                <View style={styles.supportContent}>
                  <TouchableOpacity style={styles.contactAction} onPress={openAdminSupportChat}>
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#2563EB" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactActionTitle}>Chat với hỗ trợ viên</Text>
                      <Text style={styles.contactActionSub}>Phản hồi trực tiếp trong ứng dụng</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.contactAction} onPress={() => Linking.openURL('mailto:support@glocalcart.vn')}>
                    <Ionicons name="mail-outline" size={22} color="#16A34A" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactActionTitle}>support@glocalcart.vn</Text>
                      <Text style={styles.contactActionSub}>Gửi mô tả vấn đề và mã đơn hàng nếu có</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.contactAction} onPress={() => Linking.openURL('tel:19008888')}>
                    <Ionicons name="call-outline" size={22} color="#F59E0B" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactActionTitle}>1900 8888</Text>
                      <Text style={styles.contactActionSub}>08:00 - 22:00 hằng ngày</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {supportModal === 'blog' && (
                <View style={styles.supportContent}>
                  {blogPosts.map(([title, body], index) => (
                    <TouchableOpacity
                      key={`${title}-${index}`}
                      style={styles.blogItem}
                      activeOpacity={isAdmin ? 0.75 : 1}
                      onPress={() => openEditBlogPost(index)}
                      disabled={!isAdmin}
                    >
                      <View style={styles.blogDot} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.faqTitleRow}>
                          <Text style={styles.faqTitle}>{title}</Text>
                          {isAdmin && <Ionicons name="create-outline" size={17} color={colors.primary} />}
                        </View>
                        <Text style={styles.faqBody}>{body}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {supportModal === 'about' && (
                <View style={styles.aboutContent}>
                  <View style={styles.aboutLogo}>
                    <Ionicons name="cart" size={40} color={colors.primary} />
                  </View>
                  <Text style={styles.aboutName}>GlocalCart</Text>
                  <Text style={styles.aboutVersion}>Phiên bản {APP_VERSION}</Text>
                  <View style={styles.aboutDivider} />
                  <Text style={styles.aboutBody}>
                    GlocalCart - Nền tảng mua sắm kết nối người bán địa phương và khách hàng toàn cầu, mang lại trải nghiệm tiện lợi và an tâm.
                  </Text>
                  <Text style={styles.aboutCopyright}>Copyright © 2026 GlocalCart Inc. All rights reserved.</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
        <Modal visible={showAddHelpFaq} transparent animationType="fade" onRequestClose={() => setShowAddHelpFaq(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.addHelpModal}>
              <View style={styles.addHelpHeader}>
                <Text style={styles.addHelpTitle}>Thêm câu hỏi trợ giúp</Text>
                <TouchableOpacity onPress={() => setShowAddHelpFaq(false)} style={styles.supportCloseBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.addHelpInput}
                placeholder="Câu hỏi"
                value={newFaqQuestion}
                onChangeText={setNewFaqQuestion}
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.addHelpInput, styles.addHelpTextarea]}
                placeholder="Câu trả lời"
                value={newFaqAnswer}
                onChangeText={setNewFaqAnswer}
                multiline
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity style={styles.addHelpSubmit} onPress={handleAddHelpFaq}>
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={styles.addHelpSubmitText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={editingFaqIndex !== null} transparent animationType="fade" onRequestClose={() => setEditingFaqIndex(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.addHelpModal}>
              <View style={styles.addHelpHeader}>
                <Text style={styles.addHelpTitle}>Chỉnh sửa câu hỏi trợ giúp</Text>
                <TouchableOpacity onPress={() => setEditingFaqIndex(null)} style={styles.supportCloseBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.addHelpInput}
                placeholder="Câu hỏi"
                value={newFaqQuestion}
                onChangeText={setNewFaqQuestion}
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.addHelpInput, styles.addHelpTextarea]}
                placeholder="Câu trả lời"
                value={newFaqAnswer}
                onChangeText={setNewFaqAnswer}
                multiline
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity style={styles.addHelpSubmit} onPress={handleUpdateHelpFaq}>
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={styles.addHelpSubmitText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={showAddBlogPost} transparent animationType="fade" onRequestClose={() => setShowAddBlogPost(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.addHelpModal}>
              <View style={styles.addHelpHeader}>
                <Text style={styles.addHelpTitle}>Thêm bài viết Blog</Text>
                <TouchableOpacity onPress={() => setShowAddBlogPost(false)} style={styles.supportCloseBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.addHelpInput}
                placeholder="Tiêu đề"
                value={newBlogTitle}
                onChangeText={setNewBlogTitle}
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.addHelpInput, styles.addHelpTextarea]}
                placeholder="Nội dung"
                value={newBlogBody}
                onChangeText={setNewBlogBody}
                multiline
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity style={styles.addHelpSubmit} onPress={handleAddBlogPost}>
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={styles.addHelpSubmitText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={editingBlogIndex !== null} transparent animationType="fade" onRequestClose={() => setEditingBlogIndex(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.addHelpModal}>
              <View style={styles.addHelpHeader}>
                <Text style={styles.addHelpTitle}>Chỉnh sửa bài viết Blog</Text>
                <TouchableOpacity onPress={() => setEditingBlogIndex(null)} style={styles.supportCloseBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.addHelpInput}
                placeholder="Tiêu đề"
                value={newBlogTitle}
                onChangeText={setNewBlogTitle}
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.addHelpInput, styles.addHelpTextarea]}
                placeholder="Nội dung"
                value={newBlogBody}
                onChangeText={setNewBlogBody}
                multiline
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity style={styles.addHelpSubmit} onPress={handleUpdateBlogPost}>
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={styles.addHelpSubmitText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Animated.ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── Header ──
  headerGradient: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerBg1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -40,
  },
  headerBg2: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: -30,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  profileEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  hiddenAdminBadge: {
    display: 'none',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
  },
  roleText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: borderRadius.round,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editProfileText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Member card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  memberPoints: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '700',
  },
  // Guest Header
  guestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  guestAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestInfo: {
    flex: 1,
  },
  guestWelcomeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  guestLoginBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  guestLoginText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Section Cards ──
  sectionCard: {
    backgroundColor: '#FFF',
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // ── Order Status ──
  orderStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  orderStatusItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  orderStatusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderStatusLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // ── Utility Grid ──
  utilityGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginTop: 8,
  },
  utilityItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  utilityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  // ── Menu List ──
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  supportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextWrap: {
    flex: 1,
  },
  supportLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  supportSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  supportModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    maxHeight: '82%',
  },
  supportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  supportModalIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  supportModalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  supportCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportAddBtn: {
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  supportAddText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  supportContent: {
    gap: 10,
  },
  faqItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  faqTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  faqBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 5,
  },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contactActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  contactActionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  blogItem: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  blogDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginTop: 6,
  },
  aboutContent: {
    alignItems: 'center',
    paddingTop: 4,
  },
  aboutLogo: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  aboutName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  aboutVersion: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  aboutDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 18,
  },
  aboutBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  aboutCopyright: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 22,
    textAlign: 'center',
  },
  logoutBtn: {
    marginHorizontal: spacing.md,
    marginTop: 12,
    marginBottom: 20,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  // ── Logout ──

  versionText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 16,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalReadonly: {
    fontSize: 15,
    color: colors.textMuted,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 10,
  },
  modalInput: {
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  addHelpModal: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    ...shadow.lg,
  },
  addHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addHelpTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  addHelpInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  addHelpTextarea: {
    minHeight: 96,
  },
  addHelpSubmit: {
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addHelpSubmitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
