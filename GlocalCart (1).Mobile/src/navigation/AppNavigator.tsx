import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/common/Loading';
import { colors } from '../theme/colors';
import { notificationService } from '../services/api/notificationService';
import { onDeliveryRealtime, startDeliveryRealtime } from '../services/realtime/deliveryRealtime';

// Auth Screens
import SplashScreen from '../screens/Auth/SplashScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

// Profile Screens
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AddressesScreen from '../screens/Profile/AddressesScreen';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import PaymentMethodsScreen from '../screens/Profile/PaymentMethodsScreen';
import MyOrdersScreen from '../screens/Profile/MyOrdersScreen';
import OrderDetailScreen from '../screens/Profile/OrderDetailScreen';
import CancelOrderDetailScreen from '../screens/Profile/CancelOrderDetailScreen';
import ShipmentTrackingScreen from '../screens/Profile/ShipmentTrackingScreen';
import FavoritesScreen from '../screens/Profile/FavoritesScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import { FollowedShopsScreen } from '../screens/Profile/FollowShops';

// Seller Screens
import SellerProductScreen from '../screens/Seller/SellerProductScreen';
import SellerOrdersScreen from '../screens/Seller/SellerOrdersScreen';
import SellerShopInfoScreen from '../screens/Seller/SellerShopInfoScreen';
import SellerCategoriesScreen from '../screens/Seller/SellerCategoriesScreen';
import SellerAddCategoryScreen from '../screens/Seller/SellerAddCategoryScreen';
import SellerEditCategoryScreen from '../screens/Seller/SellerEditCategoryScreen';
import SellerFlashSaleScreen from '../screens/Seller/SellerFlashSaleScreen';
import SellerAddProductScreen from '../screens/Seller/SellerAddProductScreen';
import SellerEditProductScreen from '../screens/Seller/SellerEditProductScreen';
import SellerShopScreen from '../screens/Seller/SellerShopScreen';
import SellerReviewScreen from '../screens/Seller/SellerReviewScreen';
import SellerRevenueScreen from '../screens/Seller/SellerRevenueScreen';
import SellerOrderDetailScreen from '../screens/Seller/SellerOrderDetailScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminCategoriesScreen from '../screens/Admin/AdminCategoriesScreen';
import AdminUsersScreen from '../screens/Admin/AdminUsersScreen';
import AdminProductsScreen from '../screens/Admin/AdminProductsScreen';

// Shop Screens
import HomeScreen from '../screens/Shop/HomeScreen';
import CategoryScreen from '../screens/Shop/CategoryScreen';
import ProductDetailScreen from '../screens/Shop/ProductDetailScreen';
import CartScreen from '../screens/Shop/CartScreen';
import SearchScreen from '../screens/Shop/SearchScreen';
import CheckoutScreen from '../screens/Shop/CheckoutScreen';
import WriteReviewScreen from '../screens/Shop/WriteReviewScreen';
import NotificationsScreen from '../screens/Shop/NotificationsScreen';
import ShopScreen from '../screens/Shop/ShopScreen';
import ShopDetailScreen from '../screens/Shop/ShopDetailScreen';
import NotificationDetailScreen from '../screens/Shop/NotificationDetailScreen';
import { NotificationContentScreen } from '../screens/Shop/NotifContent';
import ChatListScreen from '../screens/Shop/ChatListScreen';
import ChatDetailScreen from '../screens/Shop/ChatDetailScreen';
import ReportProductScreen from '../screens/Shop/ReportProductScreen';
import OrderTrackingScreen from '../screens/Shop/OrderTrackingScreen';
import VietQRScreen from '../screens/Shop/VietQRScreen';
import PaymentWaitingScreen from '../screens/Shop/PaymentWaitingScreen';
import AllReviewsScreen from '../screens/Shop/AllReviewsScreen';

// Shipper Screens
import ShipperAvailableScreen from '../screens/Shipper/ShipperAvailableScreen';
import ShipperDeliveringScreen from '../screens/Shipper/ShipperDeliveringScreen';
import ShipperShipmentDetailScreen from '../screens/Shipper/ShipperShipmentDetailScreen';
import ShipperProfileScreen from '../screens/Shipper/ShipperProfileScreen';
import ShipperCompletedScreen from '../screens/Shipper/ShipperCompletedScreen';
import ShipperChangePasswordScreen from '../screens/Shipper/ShipperChangePasswordScreen';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SellerCreateShipmentScreen from '../screens/Seller/SellerCreateShipmentScreen';

// ─── Stacks ───
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const getUserRole = (user: any) => String(user?.role || '').toLowerCase();
const isAdminUser = (user: any) => getUserRole(user) === 'admin';
const isSellerUser = (user: any) => Boolean(user?.isSeller || getUserRole(user) === 'seller' || isAdminUser(user));

function UnauthorizedScreen({ navigation, title, message }: any) {
  return (
    <View style={styles.guardContainer}>
      <Ionicons name="lock-closed-outline" size={52} color={colors.primary} />
      <Text style={styles.guardTitle}>{title || 'Không có quyền truy cập'}</Text>
      <Text style={styles.guardMessage}>
        {message || 'Tài khoản hiện tại không được phép mở màn hình này.'}
      </Text>
      <TouchableOpacity
        style={styles.guardButton}
        onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation?.navigate?.('MainTabs'))}
      >
        <Text style={styles.guardButtonText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}

function AdminOnlyScreen({ component: Component, ...props }: any) {
  const { user } = useAuth();
  if (!isAdminUser(user)) {
    return (
      <UnauthorizedScreen
        {...props}
        title="Không có quyền admin"
        message="Chỉ tài khoản admin mới có thể truy cập khu vực quản trị."
      />
    );
  }
  return <Component {...props} />;
}

function SellerOnlyScreen({ component: Component, ...props }: any) {
  const { user } = useAuth();
  if (!isSellerUser(user)) {
    return (
      <UnauthorizedScreen
        {...props}
        title="Không có quyền người bán"
        message="Chỉ tài khoản người bán mới có thể truy cập khu vực bán hàng."
      />
    );
  }
  return <Component {...props} />;
}

function NotificationTabIcon({ focused, color }: { focused: boolean; color: string }) {
  const { isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const refreshUnreadCount = async () => {
      if (!isLoggedIn) {
        if (isMounted) setUnreadCount(0);
        return;
      }

      try {
        const response: any = await notificationService.getUnreadCount();
        const count = Number(response?.count ?? response?.unreadCount ?? response ?? 0);
        if (isMounted) setUnreadCount(Number.isFinite(count) ? count : 0);
      } catch {
        if (isMounted) setUnreadCount(0);
      }
    };

    refreshUnreadCount();
    startDeliveryRealtime();
    const offOrder = onDeliveryRealtime('OrderUpdated', refreshUnreadCount);
    const offPayment = onDeliveryRealtime('PaymentUpdated', refreshUnreadCount);
    const offShipment = onDeliveryRealtime('ShipmentUpdated', refreshUnreadCount);

    return () => {
      isMounted = false;
      offOrder();
      offPayment();
      offShipment();
    };
  }, [isLoggedIn]);

  return (
    <View style={styles.tabIconWrap}>
      <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={22} color={color} />
      {unreadCount > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function SellerManagementStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerShop" component={SellerShopScreen} />
      <Stack.Screen name="SellerProducts" component={SellerProductScreen} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerOrderDetail" component={SellerOrderDetailScreen} />
      <Stack.Screen name="SellerCreateShipment" component={SellerCreateShipmentScreen} />
      <Stack.Screen name="SellerShopInfo" component={SellerShopInfoScreen} />
      <Stack.Screen name="SellerCategories" component={SellerCategoriesScreen} />
      <Stack.Screen name="SellerAddCategory" component={SellerAddCategoryScreen} />
      <Stack.Screen name="SellerEditCategory" component={SellerEditCategoryScreen} />
      <Stack.Screen name="SellerFlashSale" component={SellerFlashSaleScreen} />
      <Stack.Screen name="SellerAddProduct" component={SellerAddProductScreen} />
      <Stack.Screen name="SellerEditProduct" component={SellerEditProductScreen} />
      <Stack.Screen name="SellerReview" component={SellerReviewScreen} />
      <Stack.Screen name="SellerRevenue" component={SellerRevenueScreen} />
    </Stack.Navigator>
  );
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Profile Stack
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="FollowedShops" component={FollowedShopsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="AdminDashboard">{props => <AdminOnlyScreen component={AdminDashboardScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="AdminCategories">{props => <AdminOnlyScreen component={AdminCategoriesScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="AdminUsers">{props => <AdminOnlyScreen component={AdminUsersScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="AdminProducts">{props => <AdminOnlyScreen component={AdminProductsScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerProducts">{props => <SellerOnlyScreen component={SellerProductScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerOrders">{props => <SellerOnlyScreen component={SellerOrdersScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerOrderDetail">{props => <SellerOnlyScreen component={SellerOrderDetailScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerCreateShipment">{props => <SellerOnlyScreen component={SellerCreateShipmentScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerShopInfo">{props => <SellerOnlyScreen component={SellerShopInfoScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerCategories">{props => <SellerOnlyScreen component={SellerCategoriesScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerAddCategory">{props => <SellerOnlyScreen component={SellerAddCategoryScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerEditCategory">{props => <SellerOnlyScreen component={SellerEditCategoryScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerFlashSale">{props => <SellerOnlyScreen component={SellerFlashSaleScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerAddProduct">{props => <SellerOnlyScreen component={SellerAddProductScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerEditProduct">{props => <SellerOnlyScreen component={SellerEditProductScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerShop">{props => <SellerOnlyScreen component={SellerShopScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerReview">{props => <SellerOnlyScreen component={SellerReviewScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerRevenue">{props => <SellerOnlyScreen component={SellerRevenueScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="CancelOrderDetailScreen" component={CancelOrderDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Main Bottom Tabs (dùng cho cả logged-in và guest) ───
function MainTabs() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isSeller = role === 'seller';
  const usesSellerInterface = Boolean(user?.isSeller || isSeller || isAdmin);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 5 : 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          backgroundColor: '#FFF',
          elevation: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') {
            iconName = usesSellerInterface ? (focused ? 'storefront' : 'storefront-outline') : (focused ? 'home' : 'home-outline');
          }
          else if (route.name === 'Cart') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Notifications') {
            return <NotificationTabIcon focused={focused} color={color} />;
          }
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home" component={usesSellerInterface ? SellerManagementStack : HomeStack} options={{ tabBarLabel: 'Trang chủ' }} />
      {usesSellerInterface ? (
        <Tab.Screen name="Orders" component={SellerOrdersScreen} options={{ tabBarLabel: 'Đơn hàng' }} />
      ) : (
        <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: 'Giỏ hàng' }} />
      )}
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Thông báo' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: 'Tôi' }} />
    </Tab.Navigator>
  );
}

// ─── Shipper Tabs ───
function ShipperTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 5 : 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          backgroundColor: '#FFF',
          elevation: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'cube';
          if (route.name === 'Available') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Delivering') iconName = focused ? 'bicycle' : 'bicycle-outline';
          else if (route.name === 'Completed') iconName = focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline';
          else if (route.name === 'ShipperProfile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Available" component={ShipperAvailableScreen} options={{ tabBarLabel: 'Chờ lấy hàng' }} />
      <Tab.Screen name="Delivering" component={ShipperDeliveringScreen} options={{ tabBarLabel: 'Đang giao' }} />
      <Tab.Screen name="Completed" component={ShipperCompletedScreen} options={{ tabBarLabel: 'Đã giao' }} />
      <Tab.Screen name="ShipperProfile" component={ShipperProfileScreen} options={{ tabBarLabel: 'Tài khoản' }} />
    </Tab.Navigator>
  );
}

// ─── Shipper Stack ───
function ShipperStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShipperTabs" component={ShipperTabs} />
      <Stack.Screen name="ShipperShipmentDetail" component={ShipperShipmentDetailScreen} />
      <Stack.Screen name="ShipperChangePassword" component={ShipperChangePasswordScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Shared Screens Stack (dùng chung cho logged-in và guest) ───
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="AllReviews" component={AllReviewsScreen} />
      <Stack.Screen name="ShopView" component={ShopScreen} />
      <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="ReportProduct" component={ReportProductScreen} />
      <Stack.Screen name="OrderTracking" component={ShipmentTrackingScreen} />
      <Stack.Screen name="ShipmentTracking" component={ShipmentTrackingScreen} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <Stack.Screen name="NotificationContent" component={NotificationContentScreen} />
      <Stack.Screen name="VietQR" component={VietQRScreen} />
      <Stack.Screen name="PaymentWaiting" component={PaymentWaitingScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="SellerOrderDetail">{props => <SellerOnlyScreen component={SellerOrderDetailScreen} {...props} />}</Stack.Screen>
      <Stack.Screen name="SellerCreateShipment">{props => <SellerOnlyScreen component={SellerCreateShipmentScreen} {...props} />}</Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  guardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: colors.background,
  },
  guardTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  guardMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  guardButton: {
    marginTop: 22,
    minWidth: 140,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
  },
  guardButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tabIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});

// ─── Root Navigator ───
export default function AppNavigator() {
  const { isLoggedIn, isGuestMode, isLoading, user } = useAuth();
  const role = String(user?.role || '').toLowerCase();

  if (isLoading) return <Loading message="Đang khởi tạo..." />;

  // Cả logged-in và guest đều dùng AppStack (kiểm tra quyền trong từng màn hình)
  if (isLoggedIn || isGuestMode) {
    if (role === 'shipper') {
      return <ShipperStack />;
    }
    return <AppStack />;
  }

  // Chưa đăng nhập và chưa chọn guest → AuthStack
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthStack} />
    </Stack.Navigator>
  );
}
