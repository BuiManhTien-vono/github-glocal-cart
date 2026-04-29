import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/common/Loading';
import { colors } from '../theme/colors';

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
import ShipmentTrackingScreen from '../screens/Profile/ShipmentTrackingScreen';
import FavoritesScreen from '../screens/Profile/FavouritesScreen';


// Seller Screens
import SellerDashboardScreen from '../screens/Seller/SellerDashboardScreen';
import SellerProductScreen from '../screens/Seller/SellerProductScreen';
import SellerOrdersScreen from '../screens/Seller/SellerOrdersScreen';
import SellerShopInfoScreen from '../screens/Seller/SellerShopInfoScreen';
import SellerCategoriesScreen from '../screens/Seller/SellerCategoriesScreen';
import SellerFlashSaleScreen from '../screens/Seller/SellerFlashSaleScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminCategoriesScreen from '../screens/Admin/AdminCategoriesScreen';
import AdminUsersScreen from '../screens/Admin/AdminUsersScreen';
import AdminProductsScreen from '../screens/Admin/AdminProductsScreen';

// ─── Placeholder screens (sẽ do FE2 & FE3 hoàn thiện) ───
import { View, Text, StyleSheet } from 'react-native';

// ─── Shop Screens ───
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Stacks ───
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Shop Stack (Home -> Category -> ProductDetail)
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

// Auth Stack (khi chưa đăng nhập) — bao gồm Splash + Onboarding
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

// Profile Stack — bao gồm Admin sub-screens
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
      <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
      <Stack.Screen name="SellerProducts" component={SellerProductScreen} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerShopInfo" component={SellerShopInfoScreen} />
      <Stack.Screen name="SellerCategories" component={SellerCategoriesScreen} />
      <Stack.Screen name="SellerFlashSale" component={SellerFlashSaleScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="ShipmentTracking" component={ShipmentTrackingScreen} />
    </Stack.Navigator>
  );
}

// Main Bottom Tabs (khi đã đăng nhập)
function MainTabs() {
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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Cart') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: 'Giỏ hàng' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Thông báo' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: 'Tôi' }} />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───
export default function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <Loading message="Đang khởi tạo..." />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          {/* Shared screens — bottom tabs will be hidden when navigating here */}
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Category" component={CategoryScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="Addresses" component={AddressesScreen} />
          <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="ShopView" component={ShopScreen} />
          <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}