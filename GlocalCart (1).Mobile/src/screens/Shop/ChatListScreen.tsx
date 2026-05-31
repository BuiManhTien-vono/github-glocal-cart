import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/apiClient';
import { fetchPagedItems } from '../../services/api/pagedApi';
import { onChatRealtime, startChatRealtime } from '../../services/realtime/chatRealtime';
import { ChatId, Conversation, useChatStore } from '../../store/useChatStore';
import { colors } from '../../theme/colors';

type ChatContactType = 'admin' | 'seller' | 'user' | 'conversation';

type ChatContact = {
  id: string;
  peerId?: string;
  peerName: string;
  avatarUrl?: string;
  productCount?: number;
  role?: string;
  type: Exclude<ChatContactType, 'conversation'>;
};

type ChatListItem = {
  id: string;
  conversationId?: ChatId;
  peerId?: string;
  peerName: string;
  avatarUrl?: string;
  productCount?: number;
  role?: string;
  type: ChatContactType;
  lastMessage: string;
  unreadCount: number;
  updatedAt?: string;
  shopId?: number;
};

const ADMIN_CONTACT: ChatContact = {
  id: 'admin-support',
  peerId: 'admin',
  peerName: 'GlocalCart Admin',
  avatarUrl: 'https://ui-avatars.com/api/?name=GC+Admin&background=2563EB&color=fff&size=80&bold=true',
  type: 'admin',
};

const normalizeText = (value: any) => (typeof value === 'string' ? value.trim() : '');
const itemKey = (peerId?: string, fallback?: string) => (peerId ? `peer-${peerId}` : fallback || '');

export default function ChatListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = normalizeText(user?.role).toLowerCase() === 'admin';
  const { conversations, isLoading, fetchConversations, markAsRead, upsertConversation } = useChatStore();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const normalizeSellerContact = useCallback((item: any): ChatContact | null => {
    const id = item?.id ?? item?.sellerId ?? item?.shopId;
    const peerName = normalizeText(item?.name || item?.fullName || item?.sellerName || item?.shopName || item?.userName);
    if (id == null || !peerName) return null;

    return {
      id: `seller-${id}`,
      peerId: String(id),
      peerName,
      avatarUrl: item?.avatarUrl || item?.logoUrl,
      productCount: Number(item?.productCount || 0),
      type: 'seller',
    };
  }, []);

  const normalizeUserContact = useCallback((item: any): ChatContact | null => {
    const id = item?.id ?? item?.userId;
    const role = normalizeText(item?.role || item?.accountRole);
    const peerName = normalizeText(item?.fullName || item?.userName || item?.email);
    if (id == null || !peerName) return null;
    if (String(id) === String(user?.id)) return null;
    if (role.toLowerCase() === 'admin') return null;

    return {
      id: `user-${id}`,
      peerId: String(id),
      peerName,
      avatarUrl: item?.avatarUrl,
      role,
      type: 'user',
    };
  }, [user?.id]);

  const loadSellersFromProducts = useCallback(async () => {
    const productsRes: any = await apiClient.get('/products?pageSize=100');
    const products = productsRes?.items || productsRes?.data || (Array.isArray(productsRes) ? productsRes : []);
    const sellerMap = new Map<string, ChatContact>();

    products.forEach((product: any) => {
      const contact = normalizeSellerContact({
        id: product?.sellerId,
        name: product?.sellerName,
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
  }, [normalizeSellerContact]);

  const fetchContacts = useCallback(async () => {
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
  }, [isAdmin, loadSellersFromProducts, normalizeSellerContact, normalizeUserContact]);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchConversations(), fetchContacts()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchContacts, fetchConversations]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useFocusEffect(
    useCallback(() => {
      startChatRealtime().catch(() => {});
      const unsubscribe = onChatRealtime('ConversationUpdated', (conversation: Conversation) => {
        upsertConversation(conversation);
      });
      return unsubscribe;
    }, [upsertConversation])
  );

  const chatItems = useMemo<ChatListItem[]>(() => {
    const map = new Map<string, ChatListItem>();
    const allowedAdminPeers = new Set(contacts.map(contact => contact.peerId).filter(Boolean) as string[]);

    contacts.forEach(contact => {
      map.set(itemKey(contact.peerId, contact.id), {
        ...contact,
        lastMessage: contact.type === 'admin'
          ? 'Chat voi ho tro vien GlocalCart'
          : contact.type === 'user'
            ? contact.role ? `Tai khoan ${contact.role}` : 'Nguoi dung GlocalCart'
            : contact.productCount
              ? `${contact.productCount} san pham dang ban`
              : 'Bat dau tro chuyen',
        unreadCount: 0,
        shopId: contact.type === 'seller' && contact.peerId ? Number(contact.peerId) : undefined,
      });
    });

    conversations.forEach(conversation => {
      const peerId = conversation.peerId;
      if (isAdmin && (!peerId || !allowedAdminPeers.has(peerId))) return;
      if (!isAdmin && peerId === 'admin') return;

      const key = itemKey(peerId, `conversation-${conversation.id}`);
      const existing = map.get(key);
      map.set(key, {
        ...(existing || {}),
        id: `conversation-${conversation.id}`,
        conversationId: conversation.id,
        peerId,
        peerName: conversation.peerName || existing?.peerName || conversation.shopName || 'Nguoi dung',
        avatarUrl: conversation.avatarUrl || existing?.avatarUrl,
        type: existing?.type || 'conversation',
        lastMessage: conversation.lastMessage || existing?.lastMessage || 'Chua co tin nhan',
        unreadCount: Number(conversation.unreadCount || 0),
        updatedAt: conversation.updatedAt,
        shopId: conversation.sellerId,
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.updatedAt && b.updatedAt) return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (a.updatedAt) return -1;
      if (b.updatedAt) return 1;
      if (a.type === 'admin') return -1;
      if (b.type === 'admin') return 1;
      return a.peerName.localeCompare(b.peerName);
    });
  }, [contacts, conversations, isAdmin]);

  const handleConversationPress = async (item: ChatListItem) => {
    if (item.conversationId) {
      await markAsRead(item.conversationId).catch(() => {});
    }

    navigation.navigate('ChatDetail', {
      conversationId: item.conversationId,
      shopId: item.shopId,
      shopName: item.peerName,
      peerId: item.peerId,
      peerName: item.peerName,
      avatarUrl: item.avatarUrl,
    });
  };

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const renderItem = ({ item }: { item: ChatListItem }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => handleConversationPress(item)}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Ionicons
            name={item.type === 'admin' ? 'shield-checkmark-outline' : item.type === 'seller' ? 'storefront-outline' : 'person-outline'}
            size={24}
            color={colors.primary}
          />
        </View>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.peerName} numberOfLines={1}>{item.peerName}</Text>
          <Text style={styles.timeText}>{formatDate(item.updatedAt)}</Text>
        </View>

        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage || 'Chua co tin nhan'}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>

        {!item.updatedAt && (
          <Text style={styles.contactHint}>
            {item.type === 'admin' ? 'Ho tro chinh thuc' : item.type === 'user' ? 'Nguoi dung' : 'Nguoi ban'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const showInitialLoading = isLoading && !refreshing && chatItems.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isAdmin ? 'Chat nguoi dung' : 'Chat'}</Text>
      </View>

      {showInitialLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={chatItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={chatItems.length === 0 ? styles.emptyList : styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={54} color={colors.textMuted} />
              <Text style={styles.emptyText}>{isAdmin ? 'Chua co nguoi dung de chat.' : 'Chua co tin nhan nao.'}</Text>
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
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
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
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
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
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
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
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  contactHint: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
  },
  separator: {
    height: 1,
    marginLeft: 78,
    backgroundColor: colors.borderLight,
  },
});
