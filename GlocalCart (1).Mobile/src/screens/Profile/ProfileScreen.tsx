import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated, Modal, Dimensions, Platform, Pressable, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';
import { DailyDiscover } from '../../components/shop/DailyDiscover';

const { width } = Dimensions.get('window');

type SupportModalType = 'help' | 'cskh' | 'blog' | null;

const SUPPORT_ITEMS = [
  {
    id: 'help' as const,
    icon: 'help-circle-outline',
    label: 'Trung tâm trợ giúp',
    subtitle: 'Hướng dẫn mua hàng, thanh toán & đổi trả',
    color: colors.primary,
    bg: colors.primaryBg,
  },
  {
    id: 'cskh' as const,
    icon: 'headset-outline',
    label: 'Chăm sóc khách hàng',
    subtitle: 'Hotline, email & chat trực tuyến',
    color: colors.secondary,
    bg: '#EFF6FF',
  },
  {
    id: 'blog' as const,
    icon: 'newspaper-outline',
    label: 'GlocalCart Blog',
    subtitle: 'Mẹo săn deal & đặc sản địa phương',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
];

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout, isLoggedIn, setGuestMode } = useAuth();

  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [activeSupport, setActiveSupport] = useState<SupportModalType>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/products') as any;
      setProducts(res?.items || res || []);
    } catch (err) {
      console.warn("Profile fetch products error:", err);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleActivateSeller = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn muốn trở thành Người bán trên GlocalCart?\n\nSau khi kích hoạt, bạn có thể đăng bán sản phẩm và quản lý cửa hàng.')) {
        try {
          await apiClient.post('/users/activate-seller');
          updateUser({ ...user!, isSeller: true, role: 'Seller' });
          window.alert('🎉 Chúc mừng! Bạn đã trở thành Người bán thành công.');
        } catch (err: any) {
          window.alert('Lỗi: ' + err.message);
        }
      }
      return;
    }

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

  const initial = (user?.fullName || user?.userName || '?')[0].toUpperCase();

  // Shopee-style order status items
  const orderStatusItems = [
    { icon: 'wallet-outline', label: 'Chờ xác nhận', color: colors.primary },
    { icon: 'car-outline', label: 'Đang giao', color: colors.secondary },
    { icon: 'cube-outline', label: 'Đã giao', color: colors.success },
    { icon: 'star-outline', label: 'Đánh giá', color: colors.warning },
  ];

  // Utilities grid – chỉ giữ 4 mục cốt lõi
  const utilityItems = [
    { icon: 'heart-outline', label: 'Yêu Thích', screen: 'Favorites', color: colors.danger, bg: '#FEF2F2', requireAuth: true },
    { icon: 'storefront-outline', label: 'Theo Dõi Shop', screen: 'FollowedShops', color: colors.warning, bg: '#FFFBEB', requireAuth: true },
    { icon: 'briefcase-outline', label: user?.isSeller ? 'Kênh Người Bán' : 'Bán Hàng', action: 'seller', screen: user?.isSeller ? 'SellerShop' : 'ActivateSeller', color: colors.success, bg: '#ECFDF5', requireAuth: true },
    { icon: 'chatbubble-ellipses-outline', label: 'Hỗ Trợ', screen: 'ChatList', color: '#8B5CF6', bg: '#F5F3FF', requireAuth: true },
  ];

  // Admin menu
  const adminItems = user?.role === 'Admin' ? [
    { icon: 'stats-chart-outline', label: 'Dashboard', screen: 'AdminDashboard', color: '#FFF', bg: colors.danger },
    { icon: 'folder-outline', label: 'Danh Mục', screen: 'AdminCategories', color: '#FFF', bg: colors.secondary },
    { icon: 'people-outline', label: 'Quản Lý Users', screen: 'AdminUsers', color: '#FFF', bg: colors.success },
    { icon: 'shield-outline', label: 'Sản Phẩm', screen: 'AdminProducts', color: '#FFF', bg: '#8B5CF6' },
  ] : [];

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

          {/* Settings icon */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => {
              if (isLoggedIn) {
                navigation.navigate('AccountSettings');
              } else {
                // Khi là khách: hiện phiên bản app
                Alert.alert('GlocalCart v1.0.0', 'Phiên bản ứng dụng: 1.0.0\n\nĐăng nhập để truy cập đầy đủ tính năng.', [
                  { text: 'Để sau', style: 'cancel' },
                  { text: 'Đăng nhập', onPress: () => setGuestMode(false) },
                ]);
              }
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>

          {isLoggedIn ? (
            /* Profile info (Logged In) */
            <View style={styles.profileRow}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={handleEditProfile}
              >
                <Text style={styles.avatarText}>{initial}</Text>
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={10} color="#FFF" />
                </View>
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.fullName || user?.userName}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={styles.roleBadgeRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {user?.role === 'Admin' ? '👑 Admin' : user?.isSeller ? '🏪 Seller' : '🛒 Member'}
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

        {/* ===== ORDER STATUS BAR ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Đơn Mua</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => {
                if (!isLoggedIn) {
                  Alert.alert(
                    'Yêu cầu đăng nhập',
                    'Vui lòng đăng nhập để xem lịch sử mua hàng.',
                    [
                      { text: 'Để sau', style: 'cancel' },
                      { text: 'Đăng nhập', onPress: () => setGuestMode(false) },
                    ]
                  );
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
                  Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem đơn hàng.', [
                    { text: 'Để sau', style: 'cancel' },
                    { text: 'Đăng nhập', onPress: () => setGuestMode(false) },
                  ]);
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

        {/* ===== UTILITIES GRID ===== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tiện Ích Của Tôi</Text>
          <View style={styles.utilityGrid}>
            {utilityItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.utilityItem}
                activeOpacity={0.6}
                onPress={() => {
                  // Kiểm tra nếu cần đăng nhập và đang ở guest mode
                  if (item.requireAuth && !isLoggedIn) {
                    Alert.alert(
                      'Yêu cầu đăng nhập',
                      'Bạn cần đăng nhập để sử dụng tính năng này.',
                      [
                        { text: 'Để sau', style: 'cancel' },
                        { text: 'Đăng nhập', onPress: () => setGuestMode(false) },
                      ]
                    );
                    return;
                  }
                  if (item.action === 'seller' && !user?.isSeller) handleActivateSeller();
                  else if (item.screen) navigation.navigate(item.screen);
                }}
              >
                <View style={[styles.utilityIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={styles.utilityLabel} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        {/* ===== ADMIN SECTION ===== */}
        {adminItems.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔒 Quản Trị Viên</Text>
            </View>
            <View style={styles.adminGrid}>
              {adminItems.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.adminItem, { backgroundColor: item.bg }]}
                  activeOpacity={0.7}
                  onPress={() => item.screen && navigation.navigate(item.screen)}
                >
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                  <Text style={[styles.adminLabel, { color: item.color }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ===== SUPPORT MENU ===== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          <View style={styles.supportList}>
            {SUPPORT_ITEMS.map((item) => (
              <SupportMenuCard
                key={item.id}
                item={item}
                onPress={() => setActiveSupport(item.id)}
              />
            ))}
          </View>
        </View>

        {/* ===== RECOMMENDATION HEADER ===== */}
        <View style={styles.recommendHeader}>
          <View style={styles.recommendLine} />
          <Text style={styles.recommendTitle}>CÓ THỂ BẠN CŨNG THÍCH</Text>
          <View style={styles.recommendLine} />
        </View>

        {/* ===== PRODUCT GRID ===== */}
        <DailyDiscover data={products} />




      </Animated.ScrollView>

      <ProfileSupportModal
        type={activeSupport}
        visible={activeSupport !== null}
        onClose={() => setActiveSupport(null)}
        isLoggedIn={isLoggedIn}
        onRequireLogin={() => {
          setActiveSupport(null);
          Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để sử dụng tính năng này.', [
            { text: 'Để sau', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => setGuestMode(false) },
          ]);
        }}
        onOpenChat={() => {
          setActiveSupport(null);
          navigation.navigate('ChatList');
        }}
      />
    </View>
  );
}

function SupportMenuCard({
  item,
  onPress,
}: {
  item: (typeof SUPPORT_ITEMS)[number];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 28,
      bounciness: toValue === 1 ? 6 : 0,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animatePress(0.97)}
      onPressOut={() => animatePress(1)}
    >
      <Animated.View style={[styles.supportCard, { transform: [{ scale }] }]}>
        <View style={[styles.supportIconWrap, { backgroundColor: item.bg }]}>
          <Ionicons name={item.icon as any} size={22} color={item.color} />
        </View>
        <View style={styles.supportTextWrap}>
          <Text style={styles.supportLabel}>{item.label}</Text>
          <Text style={styles.supportSubtitle}>{item.subtitle}</Text>
        </View>
        <View style={[styles.supportChevron, { backgroundColor: item.bg }]}>
          <Ionicons name="chevron-forward" size={14} color={item.color} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function ProfileSupportModal({
  type,
  visible,
  onClose,
  isLoggedIn,
  onRequireLogin,
  onOpenChat,
}: {
  type: SupportModalType;
  visible: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  onOpenChat: () => void;
}) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    if (visible) setExpandedFaq(type === 'help' ? 0 : null);
  }, [visible, type]);

  const helpFaqs = [
    { icon: 'cart-outline', q: 'Làm thế nào để mua hàng?', a: 'Chọn sản phẩm → Thêm vào giỏ → Thanh toán và chọn địa chỉ giao hàng.' },
    { icon: 'time-outline', q: 'Thời gian giao hàng bao lâu?', a: 'Thường 1–3 ngày làm việc (nội tỉnh) hoặc 3–5 ngày (liên tỉnh), tùy khu vực.' },
    { icon: 'card-outline', q: 'Phương thức thanh toán?', a: 'Chuyển khoản qua mã QR VietQR hoặc thanh toán khi nhận hàng (COD).' },
    { icon: 'refresh-outline', q: 'Chính sách đổi trả?', a: 'Đổi trả miễn phí trong 7 ngày nếu sản phẩm lỗi từ nhà sản xuất.' },
  ];

  const blogPosts = [
    { icon: 'leaf-outline', title: 'Chọn chè Thái Nguyên chính gốc', tag: 'Đặc sản' },
    { icon: 'pricetag-outline', title: 'Mẹo săn voucher giảm giá', tag: 'Mua sắm' },
    { icon: 'restaurant-outline', title: 'Ẩm thực 3 miền cộng đồng', tag: 'Khám phá' },
    { icon: 'storefront-outline', title: 'Kinh doanh nông sản online', tag: 'Người bán' },
  ];

  const titles: Record<Exclude<SupportModalType, null>, string> = {
    help: 'Trung tâm trợ giúp',
    cskh: 'Chăm sóc khách hàng',
    blog: 'GlocalCart Blog',
  };

  if (!type) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.supportOverlay} onPress={onClose}>
        <Pressable style={styles.supportSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.supportHandle} />
          <View style={styles.supportSheetHeader}>
            <View>
              <Text style={styles.supportSheetTitle}>{titles[type]}</Text>
              <Text style={styles.supportSheetSub}>
                {type === 'help' && 'Giải đáp nhanh các thắc mắc thường gặp'}
                {type === 'cskh' && 'Chúng tôi luôn sẵn sàng hỗ trợ bạn'}
                {type === 'blog' && 'Góc chia sẻ từ cộng đồng GlocalCart'}
              </Text>
            </View>
            <TouchableOpacity style={styles.supportCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {type === 'help' && helpFaqs.map((faq, idx) => (
              <View key={idx} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  activeOpacity={0.75}
                  onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <View style={styles.faqIconCircle}>
                    <Ionicons name={faq.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Ionicons
                    name={expandedFaq === idx ? 'chevron-up-circle' : 'chevron-down-circle-outline'}
                    size={22}
                    color={expandedFaq === idx ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
                {expandedFaq === idx && (
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                )}
              </View>
            ))}

            {type === 'cskh' && (
              <>
                <TouchableOpacity
                  style={styles.contactActionCard}
                  onPress={() => Linking.openURL('tel:19008888')}
                >
                  <View style={[styles.contactActionIcon, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="call" size={20} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactActionTitle}>Hotline 24/7</Text>
                    <Text style={styles.contactActionVal}>1900 8888</Text>
                  </View>
                  <Text style={styles.contactActionLink}>Gọi ngay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactActionCard}
                  onPress={() => Linking.openURL('mailto:support@glocalcart.vn')}
                >
                  <View style={[styles.contactActionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="mail" size={20} color={colors.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactActionTitle}>Email hỗ trợ</Text>
                    <Text style={styles.contactActionVal}>support@glocalcart.vn</Text>
                  </View>
                  <Text style={styles.contactActionLink}>Gửi mail</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.contactActionCard, styles.contactActionPrimary]}
                  onPress={() => (isLoggedIn ? onOpenChat() : onRequireLogin())}
                >
                  <View style={[styles.contactActionIcon, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <Ionicons name="chatbubbles" size={20} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactActionTitle, { color: '#FFF' }]}>Chat với CSKH</Text>
                    <Text style={[styles.contactActionVal, { color: 'rgba(255,255,255,0.85)' }]}>
                      Phản hồi trực tuyến
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={26} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.cskhHours}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.cskhHoursText}>Giờ làm việc: 08:00 – 22:00 hàng ngày</Text>
                </View>
              </>
            )}

            {type === 'blog' && blogPosts.map((post, idx) => (
              <View key={idx} style={styles.blogCard}>
                <View style={styles.blogIconWrap}>
                  <Ionicons name={post.icon as any} size={20} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.blogTag}>
                    <Text style={styles.blogTagText}>{post.tag}</Text>
                  </View>
                  <Text style={styles.blogTitle}>{post.title}</Text>
                </View>
                <Ionicons name="bookmark-outline" size={18} color={colors.textMuted} />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.supportDoneBtn} onPress={onClose}>
            <Text style={styles.supportDoneText}>
              {type === 'blog' ? 'Khám phá thêm sau' : 'Đã hiểu'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
  settingsBtn: {
    alignSelf: 'flex-end',
    padding: 8,
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
    flexWrap: 'wrap',
    marginTop: 8,
  },
  utilityItem: {
    width: (width - 48) / 3,
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
  // ── Admin Grid ──
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  adminItem: {
    width: (width - 72) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  adminLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Support menu ──
  supportList: {
    gap: 10,
    marginTop: 8,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  supportSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  supportChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  supportSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    maxHeight: '82%',
  },
  supportHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  supportSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  supportSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  supportSheetSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  supportCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  faqIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    marginLeft: 46,
    paddingRight: 8,
  },
  contactActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 10,
  },
  contactActionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    marginTop: 4,
  },
  contactActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  contactActionVal: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  contactActionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  cskhHours: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 10,
  },
  cskhHoursText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  blogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 10,
  },
  blogIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blogTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  blogTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
  },
  blogTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  supportDoneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  supportDoneText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // ── Logout ──

  // ── Recommendations ──
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  recommendLine: {
    height: 1,
    width: 60,
    backgroundColor: '#ddd',
  },
  recommendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EE4D2D',
    letterSpacing: 0.5,
  },
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
});
