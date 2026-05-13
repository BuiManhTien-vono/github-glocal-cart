import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../../store/useCartStore';
import { useChatStore } from '../../store/useChatStore';
import { ChatBadge } from '../common/ChatBadge';

export const HomeHeader = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCartStore();
  const { totalUnreadCount } = useChatStore();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => {
          console.log('Navigating to Search');
          navigation.navigate('Search');
        }}
      >
        <Ionicons name="search" size={20} color={colors.primary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Glocal Cart Mall | Điện thoại & Phụ kiện"
          placeholderTextColor={colors.primary}
          editable={false}
        />
        <View style={styles.cameraIcon}>
          <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* Cart Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate('Cart')}
      >
        <Ionicons name="cart-outline" size={30} color={colors.white} />
        {totalItems > 0 && (
          <View style={styles.badge} />
        )}
      </TouchableOpacity>

      {/* Chat Icon */}
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={() => navigation.navigate('ChatList')}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.white} />
        <ChatBadge />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 4,
    height: 38,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  cameraIcon: {
    paddingLeft: 8,
  },
  iconButton: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
