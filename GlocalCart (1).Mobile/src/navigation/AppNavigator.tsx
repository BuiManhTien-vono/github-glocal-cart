import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../../components/common/Loading';
import { colors } from '../theme/colors';

// Auth Screens
import SplashScreen from '../screens/Auth/SplashScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Profile Screens
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AddressScreen from '../screens/Profile/AddressScreen';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import PaymentMethodsScreen from '../screens/Profile/PaymentMethodsScreen';

// Admin Screens
import AdminDashboardScreen from '../src/screens/Admin/AdminDashboardScreen';
import AdminCategoriesScreen from '../src/screens/Admin/AdminCategoriesScreen';
import AdminUsersScreen from '../src/screens/Admin/AdminUsersScreen';
import AdminProductsScreen from '../src/screens/Admin/AdminProductsScreen';

// ─── Placeholder screens (sẽ do FE2 & FE3 hoàn thiện) ───
import { View, Text, StyleSheet } from 'react-native';

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={ph.container}>
    <Ionicons name="construct-outline" size={48} color={colors.textMuted} />
    <Text style={ph.title}>{title}</Text>
    <Text style={ph.desc}>Đang phát triển bởi team FE...</Text>
  </View>
);
const ph = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 12, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  desc: { fontSize: 14, color: colors.textSecondary },
});

// ─── Screen dành cho FE2 / FE3 (placeholder) ───
import HomeScreen from '../src/screens/Shop/HomeScreen';
import CategoryScreen from '../src/screens/Shop/CategoryScreen';
import ProductDetailScreen from '../src/screens/Shop/ProductDetailScreen';
import CartScreen from '../src/screens/Shop/CartScreen';
import SearchScreen from '../src/screens/Shop/SearchScreen';
const NotificationsScreen = () => <PlaceholderScreen title="Thông Báo (FE3)" />;

// ─── Stacks ───
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Shop Stack (Home -> Category -> ProductDetail)
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
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
    </Stack.Navigator>
  );
}

// Profile Stack — bao gồm Admin sub-screens
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Addresses" component={AddressScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

// Main Bottom Tabs (khi đã đăng nhập)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          backgroundColor: '#FFF',
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
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
