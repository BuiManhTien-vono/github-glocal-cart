import { Image } from 'expo-image';
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, shadow, borderRadius } from '../../theme/colors';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { useChatStore } from '../../store/useChatStore';
import { ChatBadge } from '../../components/common/ChatBadge';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, setGuestMode } = useAuth();
  const { totalUnreadCount } = useChatStore();

  const {
    items,
    isLoading,
    fetchCart,
    updateQuantity,
    removeFromCart,
  } = useCartStore();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCart();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="cart-outline" size={80} color="#ccc" />
        <Text style={{ fontSize: 18, color: '#333', fontWeight: 'bold', marginTop: 20 }}>Giỏ hàng của bạn đang trống</Text>
        <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginTop: 10, marginBottom: 30 }}>Đăng nhập để xem giỏ hàng của bạn và tiếp tục mua sắm.</Text>
        <TouchableOpacity 
          style={{ backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 4 }}
          onPress={() => setGuestMode(false)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>ĐĂNG NHẬP</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group items by "Shop" (Mocking shops based on first few letters or category for UI demonstration)
  const groupedItems = useMemo(() => {
    if (!items) return [];
    const groups: { [key: string]: any[] } = {};
    items.forEach(item => {
      const shopName = item.sellerName || "Glocal Mall"; // Fallback to a generic shop name
      if (!groups[shopName]) groups[shopName] = [];
      groups[shopName].push(item);
    });
    return Object.entries(groups).map(([name, products]) => ({ name, products }));
  }, [items]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectShop = (shopItems: any[]) => {
    const shopIds = shopItems.map(i => i.id);
    const allSelected = shopIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !shopIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...shopIds])]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const calculateSelectedTotal = () => {
    return items
      .filter(i => selectedIds.includes(i.id))
      .reduce((sum, i) => sum + (i.priceSnapshot * i.quantity), 0);
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm để mua hàng.');
      return;
    }
    if (!isLoggedIn) {
      navigation.navigate('Auth', { screen: 'Login' });
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
        onPress: () => {
          selectedIds.forEach(id => removeFromCart(id));
          setSelectedIds([]);
        } 
      }
    ]);
  };

  if (isLoading && (!items || items.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopNowText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng ({items.length})</Text>
        <TouchableOpacity 
          style={styles.chatBtn}
          onPress={() => navigation.navigate('ChatList')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#EE4D2D" />
          <ChatBadge />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {groupedItems.map((group, idx) => (
          <View key={idx} style={styles.shopGroup}>
            {/* Shop Header */}
            <View style={styles.shopHeader}>
              <TouchableOpacity 
                style={styles.checkbox} 
                onPress={() => toggleSelectShop(group.products)}
              >
                <Ionicons 
                  name={group.products.every(p => selectedIds.includes(p.id)) ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={group.products.every(p => selectedIds.includes(p.id)) ? "#EE4D2D" : "#ccc"} 
                />
              </TouchableOpacity>
              <Ionicons name="storefront-outline" size={18} color="#333" style={{marginHorizontal: 8}} />
              <Text style={styles.shopName}>{group.name}</Text>
              <Ionicons name="chevron-forward" size={14} color="#999" />
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
                <Text style={styles.editBtnText}>{isEditMode ? 'Xong' : 'Sửa'}</Text>
              </TouchableOpacity>
            </View>

            {/* Shop Items */}
            {group.products.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <TouchableOpacity 
                  style={styles.checkbox} 
                  onPress={() => toggleSelect(item.id)}
                >
                  <Ionicons 
                    name={selectedIds.includes(item.id) ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={selectedIds.includes(item.id) ? "#EE4D2D" : "#ccc"} 
                  />
                </TouchableOpacity>
                
                <Image
                  source={{ uri: resolveProductImageUrl(item.productImage) || 'https://via.placeholder.com/100' }}
                  style={styles.itemImage}
                />
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.priceSnapshot)}
                    </Text>
                    
                    <View style={styles.quantityControl}>
                      <TouchableOpacity 
                        style={styles.qtyBtn} 
                        onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      >
                        <Ionicons name="remove" size={16} color="#666" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.qtyBtn} 
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.voucherBtn}>
              <Ionicons name="pricetag-outline" size={16} color="#EE4D2D" />
              <Text style={styles.voucherText}>Thêm Shop Voucher</Text>
              <Ionicons name="chevron-forward" size={14} color="#999" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Ionicons name="ticket-outline" size={20} color="#EE4D2D" />
          <Text style={styles.shopeeVoucherText}>GlocalCart Voucher</Text>
          <Text style={styles.selectVoucherText}>Chọn hoặc nhập mã</Text>
          <Ionicons name="chevron-forward" size={14} color="#999" />
        </View>

        <View style={styles.footerMain}>
          <TouchableOpacity style={styles.footerLeft} onPress={toggleSelectAll}>
            <View style={[
              styles.checkboxCustom, 
              selectedIds.length > 0 && selectedIds.length === items.length && styles.checkboxCustomActive
            ]}>
              {selectedIds.length > 0 && selectedIds.length === items.length && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
            <Text style={styles.selectAllText}>Tất cả</Text>
          </TouchableOpacity>

          <View style={styles.summaryContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalValue}>
                {calculateSelectedTotal().toLocaleString('vi-VN')}
                <Text style={styles.currencyUnderline}>đ</Text>
              </Text>
            </View>
            <Text style={styles.savingText}>Tiết kiệm đ0</Text>
          </View>

          <TouchableOpacity 
            style={[styles.checkoutBtn, selectedIds.length === 0 && styles.checkoutBtnDisabled]} 
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutBtnText}>Mua hàng ({selectedIds.length})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#fff',
    gap: 12
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '500', color: '#333' },
  editBtnText: { fontSize: 15, color: '#666' },
  chatBtn: { padding: 4, position: 'relative' },
  chatBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#EE4D2D', borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff'
  },
  chatBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#999', marginVertical: 20 },
  shopNowBtn: { paddingHorizontal: 30, paddingVertical: 10, borderRadius: 2, borderWidth: 1, borderColor: '#EE4D2D' },
  shopNowText: { color: '#EE4D2D', fontWeight: '500' },

  listContent: { paddingBottom: 150 },
  shopGroup: { backgroundColor: '#fff', marginTop: 10, paddingBottom: 10 },
  shopHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#f0f0f0' 
  },
  checkbox: { padding: 4 },
  shopName: { fontSize: 15, fontWeight: '500', color: '#333', marginRight: 4 },

  cartItem: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  itemImage: { width: 80, height: 80, borderRadius: 4, marginHorizontal: 10, backgroundColor: '#f9f9f9' },
  itemInfo: { flex: 1, height: 80, justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: '#333', lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  itemPrice: { fontSize: 15, color: '#EE4D2D', fontWeight: '500' },

  quantityControl: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 0.5, 
    borderColor: '#ccc', 
    borderRadius: 2 
  },
  qtyBtn: { padding: 4, paddingHorizontal: 8, backgroundColor: '#fff' },
  qtyText: { paddingHorizontal: 10, fontSize: 13, borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#ccc' },

  voucherBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderTopWidth: 0.5, 
    borderTopColor: '#f0f0f0',
    gap: 8
  },
  voucherText: { flex: 1, fontSize: 13, color: '#333' },

  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#eee',
    ...shadow.sm
  },
  footerTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#FFF8E1',
    gap: 8
  },
  shopeeVoucherText: { flex: 1, fontSize: 13, color: '#333' },
  selectVoucherText: { fontSize: 12, color: '#999' },

  footerMain: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxCustom: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxCustomActive: {
    backgroundColor: '#EE4D2D',
    borderColor: '#EE4D2D',
  },
  summaryContainer: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
  selectAllText: { fontSize: 15, color: '#333' },
  totalRow: { flexDirection: 'row', alignItems: 'center' },
  totalValue: { fontSize: 16, color: '#EE4D2D', fontWeight: '500' },
  currencyUnderline: { textDecorationLine: 'underline' },
  savingText: { fontSize: 13, color: '#EE4D2D', marginTop: 2 },
  checkoutBtn: { 
    backgroundColor: '#EE4D2D', 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 110,
  },
  checkoutBtnDisabled: { backgroundColor: '#ccc' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },

  deleteBtn: { flex: 1, backgroundColor: '#fff', borderLeftWidth: 0.5, borderLeftColor: '#eee', paddingVertical: 18, alignItems: 'center' },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { color: '#EE4D2D', fontSize: 15, fontWeight: '600' }
});
