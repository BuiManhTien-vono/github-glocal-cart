import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated, Dimensions, Platform, UIManager
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '../../context/AuthContext';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { colors, shadow } from '../../theme/colors';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { useChatStore } from '../../store/useChatStore';
import { ChatBadge } from '../../components/common/ChatBadge';
import { CartBadge } from '../../components/common/CartBadge';
import { showLoginRequired } from '../../utils/loginRequired';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Bật LayoutAnimation trên Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Component: CartItem với slide animation per-shop ───
function CartItemRow({
  item,
  isSliding,
  isGlobalEdit,
  isSelected,
  onSelect,
  onUpdateQty,
  onRemove,
  onSaveFavorite,
}: {
  item: any;
  isSliding: boolean;
  isGlobalEdit: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
  onSaveFavorite: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isSliding ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [isSliding]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(SCREEN_WIDTH * 0.42)],
  });
  const availableStock = Number(item.availableStock ?? item.availableItemCount ?? item.stock ?? 0);
  const canIncrease = availableStock <= 0 || item.quantity < availableStock;

  return (
    <View style={styles.cartItemOuter}>
      {/* Main content (slides left) */}
      <Animated.View style={[styles.cartItemMain, { transform: [{ translateX }] }]}>
        {/* Checkbox */}
        <TouchableOpacity style={styles.checkbox} onPress={onSelect}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={20}
            color={isSelected ? '#EE4D2D' : '#ccc'}
          />
        </TouchableOpacity>

        {/* Ảnh */}
        <Image
          source={{ uri: resolveProductImageUrl(item.productImage) || 'https://via.placeholder.com/100' }}
          style={styles.itemImage}
        />

        {/* Thông tin */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.priceSnapshot)}
            </Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateQty(Math.max(1, item.quantity - 1))}>
                <Ionicons name="remove" size={16} color="#666" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, !canIncrease && styles.qtyBtnDisabled]}
                disabled={!canIncrease}
                onPress={() => onUpdateQty(item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Nút action (lộ khi slide) – ẩn hoàn toàn khi chưa nhấn Sửa */}
      {!isGlobalEdit && (
        <View
          style={[
            styles.slideActions,
            { opacity: isSliding ? 1 : 0, pointerEvents: isSliding ? 'auto' : 'none' } as any
          ]}
        >
          <TouchableOpacity style={styles.favActionBtn} onPress={() => {
            onSaveFavorite(); // lưu yêu thích rồi tự động xóa khỏi cart (được xử lý ở onSaveFavorite)
          }}>
            <Ionicons name="heart" size={20} color="#fff" />
            <Text style={styles.slideActionText}>Yêu thích</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.delActionBtn} onPress={onRemove}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.slideActionText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main CartScreen ───
export default function CartScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isGuestMode, setGuestMode } = useAuth();
  const { totalUnreadCount } = useChatStore();
  const { items, isLoading, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const { addFavorite } = useFavoritesStore();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isGlobalEdit, setIsGlobalEdit] = useState(false);
  // shop đang mở slide
  const [slidingShop, setSlidingShop] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [isLoggedIn]);

  // ─── Guest: vẫn vào được Cart nhưng không thanh toán ───
  // (fetchCart đã dùng SQLite local cho guest)

  const groupedItems = React.useMemo(() => {
    if (!items) return [];
    const groups: { [key: string]: any[] } = {};
    items.forEach(item => {
      const shopName = item.sellerName || 'Glocal Mall';
      if (!groups[shopName]) groups[shopName] = [];
      groups[shopName].push(item);
    });
    return Object.entries(groups).map(([name, products]) => ({ name, products }));
  }, [items]);

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleSelectShop = (shopItems: any[]) => {
    const shopIds = shopItems.map(i => i.id);
    const allSelected = shopIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev => allSelected ? prev.filter(id => !shopIds.includes(id)) : [...new Set([...prev, ...shopIds])]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) setSelectedIds([]);
    else setSelectedIds(items.map(i => i.id));
  };

  const calculateSelectedTotal = () =>
    items.filter(i => selectedIds.includes(i.id)).reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);

  const getActionErrorMessage = (error: any, fallback: string) => error?.message || fallback;

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch (error: any) {
      Alert.alert('Lỗi', getActionErrorMessage(error, 'Không thể cập nhật số lượng sản phẩm.'));
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeFromCart(itemId);
      setSelectedIds(prev => prev.filter(id => id !== itemId));
    } catch (error: any) {
      Alert.alert('Lỗi', getActionErrorMessage(error, 'Không thể xóa sản phẩm khỏi giỏ hàng.'));
    }
  };

  const handleSaveFavoriteItem = async (item: any) => {
    if (!isLoggedIn) {
      showLoginRequired(() => setGuestMode(false), 'Bạn cần đăng nhập để lưu sản phẩm yêu thích.');
      return;
    }

    try {
      await addFavorite({
        id: item.productId || item.id,
        name: item.productName,
        price: item.priceSnapshot,
        mediaUrl: item.productImage,
        sellerName: item.sellerName,
      });
      await removeFromCart(item.id);
      setSlidingShop(null);
      setSelectedIds(prev => prev.filter(id => id !== item.id));
      Alert.alert('Đã lưu', 'Sản phẩm đã được chuyển vào mục Yêu thích!');
    } catch (error: any) {
      Alert.alert('Lỗi', getActionErrorMessage(error, 'Không thể chuyển sản phẩm vào yêu thích.'));
    }
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Thông báo\n\nVui lòng chọn ít nhất một sản phẩm để mua hàng.');
      } else {
        Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm để mua hàng.');
      }
      return;
    }
    if (!isLoggedIn) {
      showLoginRequired(() => setGuestMode(false), 'Bạn cần đăng nhập để tiến hành thanh toán.');
      return;
    }
    navigation.navigate('Checkout', { selectedItems: items.filter(i => selectedIds.includes(i.id)) });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    Alert.alert('Xóa sản phẩm', `Bạn có chắc muốn xóa ${selectedIds.length} sản phẩm đã chọn?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const idsToDelete = [...selectedIds];
          try {
            await Promise.all(idsToDelete.map(id => removeFromCart(id)));
            setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
          } catch (error: any) {
            Alert.alert('Lỗi', getActionErrorMessage(error, 'Không thể xóa các sản phẩm đã chọn.'));
            fetchCart();
          }
        },
      },
    ]);
  };

  const handleSaveFavoritesSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!isLoggedIn) {
      showLoginRequired(() => setGuestMode(false), 'Bạn cần đăng nhập để lưu sản phẩm yêu thích.');
      return;
    }

    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    try {
      for (const item of selectedItems) {
        await addFavorite({
          id: item.productId || item.id,
          name: item.productName,
          price: item.priceSnapshot,
          mediaUrl: item.productImage,
          sellerName: item.sellerName,
        });
      }
      setSelectedIds([]);
      setIsGlobalEdit(false);
      Alert.alert('Đã lưu', `${selectedItems.length} sản phẩm đã được lưu vào yêu thích!`);
    } catch (error: any) {
      Alert.alert('Lỗi', getActionErrorMessage(error, 'Không thể lưu sản phẩm vào yêu thích.'));
    }
  };

  const toggleShopSlide = (shopName: string) => {
    setSlidingShop(prev => (prev === shopName ? null : shopName));
  };

  const toggleGlobalEdit = () => {
    setIsGlobalEdit(prev => !prev);
    setSlidingShop(null); // đóng tất cả slide per-shop
  };

  // Loading
  if (isLoading && (!items || items.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Empty
  if (!items || items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#ddd" />
          <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
            <Text style={styles.shopNowText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng ({items.length})</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={toggleGlobalEdit}>
            <Text style={styles.editBtnText}>{isGlobalEdit ? 'Xong' : 'Sửa'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatBtn} onPress={() => {
            if (!isLoggedIn) {
              showLoginRequired(() => setGuestMode(false), 'Bạn cần đăng nhập để dùng Chat.');
              return;
            }
            navigation.navigate('ChatList');
          }}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#EE4D2D" />
            <ChatBadge />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Danh sách theo Shop ─── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {groupedItems.map((group, idx) => (
          <View key={idx} style={styles.shopGroup}>
            {/* Shop header */}
            <View style={styles.shopHeader}>
              <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelectShop(group.products)}>
                <Ionicons
                  name={group.products.every(p => selectedIds.includes(p.id)) ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={group.products.every(p => selectedIds.includes(p.id)) ? '#EE4D2D' : '#ccc'}
                />
              </TouchableOpacity>
              <Ionicons name="storefront-outline" size={18} color="#333" style={{ marginHorizontal: 8 }} />
              <Text style={styles.shopName}>{group.name}</Text>
              <Ionicons name="chevron-forward" size={14} color="#999" />
              <View style={{ flex: 1 }} />
              {/* Nút Sửa per-shop chỉ hiện khi KHÔNG ở global edit */}
              {!isGlobalEdit && (
                <TouchableOpacity onPress={() => toggleShopSlide(group.name)}>
                  <Text style={styles.editBtnText}>{slidingShop === group.name ? 'Xong' : 'Sửa'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {group.products.map((item, itemIdx) => (
              <View key={item.id} style={itemIdx > 0 ? { borderTopWidth: 5, borderTopColor: '#f5f5f5' } : {}}>
                <CartItemRow
                  item={item}
                  isSliding={slidingShop === group.name && !isGlobalEdit}
                  isGlobalEdit={isGlobalEdit}
                  isSelected={selectedIds.includes(item.id)}
                  onSelect={() => toggleSelect(item.id)}
                  onUpdateQty={qty => handleUpdateQuantity(item.id, qty)}
                  onRemove={() => {
                    Alert.alert('Xóa sản phẩm', 'Bạn có chắc muốn xóa sản phẩm này?', [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Xóa', style: 'destructive', onPress: () => handleRemoveItem(item.id) },
                    ]);
                  }}
                  onSaveFavorite={() => handleSaveFavoriteItem(item)}

                />
              </View>
            ))}


            {/* Voucher */}
            <TouchableOpacity style={styles.voucherBtn}>
              <Ionicons name="pricetag-outline" size={16} color="#EE4D2D" />
              <Text style={styles.voucherText}>Thêm Shop Voucher</Text>
              <Ionicons name="chevron-forward" size={14} color="#999" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* ─── Footer ─── */}
      <View style={styles.footer}>
        {/* Voucher row – ẩn khi global edit */}
        {!isGlobalEdit && (
          <View style={styles.footerTop}>
            <Ionicons name="ticket-outline" size={20} color="#EE4D2D" />
            <Text style={styles.shopeeVoucherText}>GlocalCart Voucher</Text>
            <Text style={styles.selectVoucherText}>Chọn hoặc nhập mã</Text>
            <Ionicons name="chevron-forward" size={14} color="#999" />
          </View>
        )}

        <View style={styles.footerMain}>
          {/* Checkbox tất cả */}
          <TouchableOpacity style={styles.footerLeft} onPress={toggleSelectAll}>
            <View style={[styles.checkboxCustom, selectedIds.length > 0 && selectedIds.length === items.length && styles.checkboxCustomActive]}>
              {selectedIds.length > 0 && selectedIds.length === items.length && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
            <Text style={styles.selectAllText}>Tất cả</Text>
          </TouchableOpacity>

          {/* Normal mode: tổng tiền + nút mua */}
          {!isGlobalEdit ? (
            <>
              <View style={styles.summaryContainer}>
                <Text style={styles.totalValue}>
                  {calculateSelectedTotal().toLocaleString('vi-VN')}
                  <Text style={styles.currencyUnderline}>đ</Text>
                </Text>
                <Text style={styles.savingText}>Tiết kiệm đ0</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkoutBtn, selectedIds.length === 0 && styles.checkoutBtnDisabled]}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutBtnText}>Mua hàng ({selectedIds.length})</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Global edit mode: nút Yêu thích + Xóa */
            <View style={styles.globalEditActions}>
              <TouchableOpacity
                style={[styles.favGlobalBtn, selectedIds.length === 0 && styles.btnDisabled]}
                onPress={handleSaveFavoritesSelected}
              >
                <Ionicons name="heart-outline" size={16} color="#EE4D2D" />
                <Text style={styles.favGlobalBtnText}>Lưu vào yêu thích</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.delGlobalBtn, selectedIds.length === 0 && styles.btnDisabled]}
                onPress={handleDeleteSelected}
              >
                <Text style={styles.delGlobalBtnText}>Xóa ({selectedIds.length})</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '500', color: '#333' },
  editBtnText: { fontSize: 15, color: '#EE4D2D', fontWeight: '500' },
  chatBtn: { padding: 4, position: 'relative' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#999', marginVertical: 20 },
  shopNowBtn: { paddingHorizontal: 30, paddingVertical: 10, borderRadius: 2, borderWidth: 1, borderColor: '#EE4D2D' },
  shopNowText: { color: '#EE4D2D', fontWeight: '500' },

  listContent: { paddingBottom: 160 },
  shopGroup: { backgroundColor: '#fff', marginTop: 10, paddingBottom: 10 },
  shopHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0',
  },
  checkbox: { padding: 4 },
  shopName: { fontSize: 15, fontWeight: '500', color: '#333', marginRight: 4 },

  // CartItemRow
  cartItemOuter: { flexDirection: 'row', overflow: 'hidden', backgroundColor: '#fff' },
  cartItemMain: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, width: SCREEN_WIDTH,
  },
  itemImage: { width: 80, height: 80, borderRadius: 4, marginHorizontal: 10, backgroundColor: '#f9f9f9' },
  itemInfo: { flex: 1, height: 80, justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: '#333', lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  itemPrice: { fontSize: 15, color: '#EE4D2D', fontWeight: '500' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: '#ccc', borderRadius: 2 },
  qtyBtn: { padding: 4, paddingHorizontal: 8 },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyText: { paddingHorizontal: 10, fontSize: 13, borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#ccc' },

  slideActions: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 0.42,
    position: 'absolute', right: 0, top: 0, bottom: 0,
  },
  favActionBtn: { flex: 1, backgroundColor: '#FF9500', justifyContent: 'center', alignItems: 'center', gap: 4 },
  delActionBtn: { flex: 1, backgroundColor: '#EE4D2D', justifyContent: 'center', alignItems: 'center', gap: 4 },
  slideActionText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  voucherBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 0.5, borderTopColor: '#f0f0f0', gap: 8,
  },
  voucherText: { flex: 1, fontSize: 13, color: '#333' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#eee',
    ...shadow.sm,
  },
  footerTop: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, backgroundColor: '#FFF8E1', gap: 8,
  },
  shopeeVoucherText: { flex: 1, fontSize: 13, color: '#333' },
  selectVoucherText: { fontSize: 12, color: '#999' },

  footerMain: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12, minHeight: 56,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 10 },
  checkboxCustom: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  checkboxCustomActive: { backgroundColor: '#EE4D2D', borderColor: '#EE4D2D' },
  selectAllText: { fontSize: 15, color: '#333' },

  summaryContainer: { flex: 1, alignItems: 'flex-end', paddingRight: 10 },
  totalValue: { fontSize: 16, color: '#EE4D2D', fontWeight: '500' },
  currencyUnderline: { textDecorationLine: 'underline' },
  savingText: { fontSize: 12, color: '#EE4D2D', marginTop: 2 },

  checkoutBtn: {
    backgroundColor: '#EE4D2D', paddingHorizontal: 18,
    paddingVertical: 10, borderRadius: 8, minWidth: 110,
  },
  checkoutBtnDisabled: { backgroundColor: '#ccc' },
  checkoutBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },

  // Global edit footer
  globalEditActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  favGlobalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#EE4D2D',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
  },
  favGlobalBtnText: { color: '#EE4D2D', fontSize: 13, fontWeight: '600' },
  delGlobalBtn: { backgroundColor: '#EE4D2D', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  delGlobalBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnDisabled: { opacity: 0.4 },
});
