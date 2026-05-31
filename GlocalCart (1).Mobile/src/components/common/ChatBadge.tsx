import React, { useEffect } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useChatStore } from '../../store/useChatStore';

interface ChatBadgeProps {
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export const ChatBadge: React.FC<ChatBadgeProps> = ({ containerStyle, textStyle }) => {
  const { totalUnreadCount, fetchConversations } = useChatStore();

  useEffect(() => {
    fetchConversations().catch(() => {});
  }, [fetchConversations]);

  if (totalUnreadCount <= 0) return null;

  return (
    <View style={[styles.badge, containerStyle]}>
      <Text style={[styles.badgeText, textStyle]}>
        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
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
    paddingHorizontal: 4,
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
