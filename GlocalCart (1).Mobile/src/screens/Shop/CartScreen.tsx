import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/apiClient';
import { colors } from '../../theme/colors';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();

  const {
    items,
    totalAmount,
    isLoading,
    fetchCart,
    updateQuantity,
    removeFromCart,
    syncCart,
    clearCart
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [qrUrl, setQrUrl] = React.useState('');

  useEffect(() => {
    fetchCart();
  }, [isLoggedIn]);

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }

    navigation.navigate('Checkout');
  };

  const handlePaymentDone = () => {
    setPaymentModalVisible(false);
    clearCart();
    Alert.alert('Thành công', 'Đơn hàng của bạn đã được tiếp nhận và chờ xác nhận thanh toán.');
    navigation.navigate('Home');
  };

  const handleIncrease = (item: any) => {
    if (item.availableStock !== undefined && item.quantity >= item.availableStock) {
      Alert.alert('Thông báo', 'Vượt quá số lượng tồn kho!');
      return;
    }
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrease = (item: any) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  if (isLoading) {
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
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={colors.textMuted} />
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image
              source={{ uri: item.productImage || 'https://via.placeholder.com/100' }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
              <Text style={styles.itemPrice}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.priceSnapshot)}
              </Text>

              <View style={styles.actionRow}>
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleDecrease(item)}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleIncrease(item)}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, isCheckingOut && { opacity: 0.7 }]}
          onPress={handleCheckout}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutText}>
              {isLoggedIn ? 'Tiến hành thanh toán' : 'Đăng nhập để thanh toán'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Modal for QR Code */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thanh toán VietQR</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              <Text style={styles.qrMessage}>Vui lòng quét mã bên dưới để thanh toán đơn hàng</Text>
              <Image
                source={{ uri: qrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.qrInstruction}>Số tiền: <Text style={styles.boldText}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</Text></Text>
              <Text style={styles.qrSubText}>Hệ thống sẽ tự động cập nhật sau khi nhận được tiền.</Text>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handlePaymentDone}>
              <Text style={styles.confirmText}>Xác nhận đã chuyển khoản</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  shopNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  listContainer: { padding: 16, paddingBottom: 100 },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '500', color: colors.text },
  itemPrice: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 4 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  qtyBtn: { padding: 4, paddingHorizontal: 8 },
  qtyText: { fontSize: 14, fontWeight: '600', paddingHorizontal: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: { fontSize: 16, color: colors.textSecondary },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  checkoutBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  qrImage: { width: 250, height: 250, backgroundColor: '#f9f9f9', borderRadius: 8 },
  qrInstruction: { fontSize: 16, marginTop: 16, color: colors.text },
  boldText: { fontWeight: '700', color: colors.primary },
  qrSubText: { fontSize: 12, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  confirmBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
