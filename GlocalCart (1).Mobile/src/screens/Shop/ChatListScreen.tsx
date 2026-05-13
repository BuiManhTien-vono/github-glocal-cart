import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatStore } from '../../store/useChatStore';
import { colors, spacing, shadow } from '../../theme/colors';

export default function ChatListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { conversations, markAsRead } = useChatStore();

  const handleConversationPress = (item: any) => {
    markAsRead(item.id);
    navigation.navigate('ChatDetail', { conversationId: item.id, shopName: item.shopName });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.avatarContainer}>
        {/* Placeholder avatar or shop logo */}
        <View style={styles.avatarCircle}>
          <Ionicons name="storefront-outline" size={24} color={colors.primary} />
        </View>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
          <Text style={styles.timeText}>{formatDate(item.updatedAt)}</Text>
        </View>
        
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
  },
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#EE4D2D',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 78,
  },
});
