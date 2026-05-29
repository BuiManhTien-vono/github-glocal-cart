import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Conversation, useChatStore } from '../../store/useChatStore';
import { colors } from '../../theme/colors';
import { onChatRealtime, startChatRealtime } from '../../services/realtime/chatRealtime';

export default function ChatListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { conversations, isLoading, fetchConversations, markAsRead, upsertConversation } = useChatStore();

  useEffect(() => {
    startChatRealtime().catch(() => {});
    const unsubscribe = onChatRealtime('ConversationUpdated', (conversation) => {
      upsertConversation(conversation);
    });
    return unsubscribe;
  }, [upsertConversation]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations().catch(() => {});
    }, [fetchConversations])
  );

  const handleConversationPress = async (item: Conversation) => {
    await markAsRead(item.id).catch(() => {});
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

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => handleConversationPress(item)}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Ionicons name="storefront-outline" size={24} color={colors.primary} />
        </View>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.shopName} numberOfLines={1}>{item.shopName || item.otherUserName}</Text>
          <Text style={styles.timeText}>{formatDate(item.updatedAt)}</Text>
        </View>

        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage || 'Chưa có tin nhắn'}</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {isLoading && conversations.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Ionicons name="chatbubble-ellipses-outline" size={44} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
            </View>
          }
        />
      )}
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
  emptyList: {
    flexGrow: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
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
