import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Conversation, useChatStore } from '../../store/useChatStore';
import { colors } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { fetchPagedItems } from '../../services/api/pagedApi';
import { useAuth } from '../../context/AuthContext';

const ADMIN_CONTACT: ChatContact = {
  id: 'admin-support',
  peerId: 'admin',
  peerName: 'GlocalCart Admin',
  avatarUrl: 'https://ui-avatars.com/api/?name=GC+Admin&background=2563EB&color=fff&size=80&bold=true',
  type: 'admin',
};

type ChatContact = {
  id: string;
  peerId?: string;
  peerName: string;
  avatarUrl?: string;
  productCount?: number;
  role?: string;
  type: 'admin' | 'seller' | 'user' | 'conversation';
};

type ChatListItem = ChatContact & Partial<Conversation> & {
  lastMessage: string;
  unreadCount: number;
  updatedAt?: string;
};

export default function ChatListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const { conversations, fetchConversations, markAsRead } = useChatStore();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const normalizeSellerContact = (item: any): ChatContact | null => {
    const id = item?.id ?? item?.sellerId ?? item?.shopId;
    const peerName = item?.name || item?.fullName || item?.sellerName || item?.shopName || item?.userName;
    if (id == null || !peerName) return null;

    return {
      id: String(id),
      peerId: String(id),
      peerName,
      avatarUrl: item?.avatarUrl || item?.logoUrl,
      productCount: Number(item?.productCount || 0),
      type: 'seller',
    };
  };

  const normalizeUserContact = (item: any): ChatContact | null => {
    const id = item?.id ?? item?.userId;
    const peerName = item?.fullName || item?.userName || item?.email;
    if (id == null || !peerName) return null;
    if (String(id) === String(user?.id)) return null;

    return {
      id: `admin-user-${id}`,
      peerId: String(id),
      peerName,
      avatarUrl: item?.avatarUrl,
      role: item?.role || item?.accountRole,
      type: 'user',
    };
  };

  const loadSellersFromProducts = async () => {
    const productsRes: any = await apiClient.get('/products?pageSize=100');
    const products = productsRes?.items || productsRes?.data || (Array.isArray(productsRes) ? productsRes : []);
    const sellerMap = new Map<string, ChatContact>();

    products.forEach((product: any) => {
      const contact = normalizeSellerContact({
        id: product.sellerId,
        name: product.sellerName,
        productCount: 1,
      });
      if (!contact) return;

      const existing = sellerMap.get(contact.id);
      sellerMap.set(contact.id, {
        ...contact,
        productCount: (existing?.productCount || 0) + 1,
      });
    });

    return Array.from(sellerMap.values());
  };

  const fetchContacts = async () => {
    if (isAdmin) {
      try {
        const users = await fetchPagedItems('/admin/users', 100);
        setContacts(users.map(normalizeUserContact).filter(Boolean) as ChatContact[]);
      } catch (error) {
        console.warn('Admin chat contacts error:', error);
        setContacts([]);
      }
      return;
    }

    try {
      const sellersRes: any = await apiClient.get('/shops/sellers');
      const sellers = (Array.isArray(sellersRes) ? sellersRes : sellersRes?.items || [])
        .map(normalizeSellerContact)
        .filter(Boolean) as ChatContact[];

      setContacts([ADMIN_CONTACT, ...sellers]);
    } catch (error) {
      try {
        const sellers = await loadSellersFromProducts();
        setContacts([ADMIN_CONTACT, ...sellers]);
      } catch (fallbackError) {
        console.warn('ChatList fetch contacts error:', fallbackError || error);
        setContacts([ADMIN_CONTACT]);
      }
    }
  };

  const loadData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchConversations(), fetchContacts()]);
    setRefreshing(false);
  }, [fetchConversations, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const chatItems = useMemo<ChatListItem[]>(() => {
    const itemMap = new Map<string, ChatListItem>();
    const adminContactIds = new Set(contacts.map(contact => contact.id));
    const adminPeerIds = new Set(contacts.map(contact => contact.peerId).filter(Boolean));

    contacts.forEach(contact => {
      itemMap.set(contact.id, {
        ...contact,
        lastMessage: contact.type === 'admin'
          ? 'Chat với hỗ trợ viên GlocalCart'
          : contact.type === 'user'
            ? contact.role ? `Tài khoản ${contact.role}` : 'Người dùng GlocalCart'
          : contact.productCount
            ? `${contact.productCount} sản phẩm đang bán`
            : 'Bắt đầu trò chuyện',
        unreadCount: 0,
      });
    });

    conversations.forEach(conversation => {
      if (isAdmin && (!adminContactIds.has(conversation.id) && !adminPeerIds.has(conversation.peerId))) {
        return;
      }
      if (isAdmin && conversation.peerId === 'admin') {
        return;
      }

      const existing = itemMap.get(conversation.id);
      itemMap.set(conversation.id, {
        ...(existing || { type: 'conversation' as const }),
        ...conversation,
        id: conversation.id,
        peerName: conversation.peerName,
        peerId: conversation.peerId,
        avatarUrl: conversation.avatarUrl,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount,
        updatedAt: conversation.updatedAt,
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => {
      if (a.updatedAt && b.updatedAt) return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (a.updatedAt) return -1;
      if (b.updatedAt) return 1;
      if (a.type === 'admin') return -1;
      if (b.type === 'admin') return 1;
      return a.peerName.localeCompare(b.peerName);
    });
  }, [contacts, conversations, isAdmin]);

  const handleConversationPress = (item: ChatListItem) => {
    if (item.updatedAt) markAsRead(item.id);
    navigation.navigate('ChatDetail', {
      conversationId: item.id,
      peerId: item.peerId,
      peerName: item.peerName,
      avatarUrl: item.avatarUrl,
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const renderItem = ({ item }: { item: ChatListItem }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Ionicons name={item.type === 'admin' ? 'shield-checkmark-outline' : item.type === 'user' ? 'person-outline' : 'storefront-outline'} size={24} color={colors.primary} />
        </View>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.peerName} numberOfLines={1}>{item.peerName}</Text>
          <Text style={styles.timeText}>{formatDate(item.updatedAt || '')}</Text>
        </View>
        
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        {!item.updatedAt && (
          <Text style={styles.contactHint}>{item.type === 'admin' ? 'Hỗ trợ chính thức' : item.type === 'user' ? 'Người dùng' : 'Người bán'}</Text>
        )}
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
        <Text style={styles.headerTitle}>{isAdmin ? 'Chat người dùng' : 'Chat'}</Text>
      </View>

      <FlatList
        data={chatItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={54} color={colors.textMuted} />
            <Text style={styles.emptyText}>{isAdmin ? 'Chưa có người dùng để chat.' : 'Chưa có tin nhắn nào.'}</Text>
          </View>
        }
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
  peerName: {
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
  contactHint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
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
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
