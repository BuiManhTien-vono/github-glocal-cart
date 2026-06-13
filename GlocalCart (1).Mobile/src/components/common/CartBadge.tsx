import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useCartStore } from '../../store/useCartStore';

interface CartBadgeProps {
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export const CartBadge: React.FC<CartBadgeProps> = ({ containerStyle, textStyle }) => {
  const { items, fetchCart } = useCartStore();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  
  useEffect(() => {
    fetchCart().catch(() => {});
  }, [fetchCart]);
  
  if (count <= 0) return null;

  return (
    <View style={[styles.badge, containerStyle]}>
      <Text style={[styles.badgeText, textStyle]}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EE4D2D',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
