import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { onChatRealtime, startChatRealtime } from '../../services/realtime/chatRealtime';
import { ChatId, ChatMessage, Conversation, useChatStore } from '../../store/useChatStore';
import { colors } from '../../theme/colors';
import { resolveProductImageUrl } from '../../utils/imageUtils';

const isNumericId = (id: ChatId | null | undefined) => id != null && Number.isFinite(Number(id));

export default function ChatDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = route.params || {};

  const routeConversationId = params.conversationId as ChatId | undefined;
  const numericShopId = Number(params.shopId || 0);
  const productId = params.productId ? Number(params.productId) : undefined;
  const isSupportConversation = Boolean(params.supportAdmin);
  const peerId = params.peerId != null ? String(params.peerId) : numericShopId > 0 ? String(numericShopId) : undefined;
  const avatarUrl = params.avatarUrl;
  const initialPeerName = params.peerName || params.shopName || 'Nguoi dung';
  const directConversationId = useMemo(
    () => String(routeConversationId || peerId || initialPeerName),
    [routeConversationId, peerId, initialPeerName]
  );

  const [conversationId, setConversationId] = useState<ChatId | null>(routeConversationId || null);
  const [headerTitle, setHeaderTitle] = useState(initialPeerName);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const currentUserId = String(user?.id || 'me');

  const {
    addMessage,
    getConversation,
    getMessages,
    markAsRead,
    sendMessage,
    startConversation,
    startSupportConversation,
    upsertConversation,
  } = useChatStore();

  const canStartBackendConversation = numericShopId > 0;
  const canCompose = Boolean(conversationId || canStartBackendConversation || isSupportConversation || directConversationId);

  const scrollToEnd = (animated = false) => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated }), 80);
  };

  const loadMessages = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      if (conversationId) {
        const data = await getMessages(conversationId);
        setMessages(data);
        await markAsRead(conversationId).catch(() => {});
        scrollToEnd(false);
        return;
      }

      const localConversation = getConversation(directConversationId);
      setMessages(localConversation?.messages || []);
      scrollToEnd(false);
    } catch (error: any) {
      Alert.alert('Loi', error?.message || 'Khong the tai tin nhan.');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, directConversationId, getConversation, getMessages, markAsRead]);

  useFocusEffect(
    useCallback(() => {
      loadMessages(true);
    }, [loadMessages])
  );

  useEffect(() => {
    if (!isSupportConversation || conversationId) return;

    let active = true;
    startSupportConversation()
      .then(conversation => {
        if (!active) return;
        setConversationId(conversation.id);
        setHeaderTitle(conversation.peerName || conversation.shopName || initialPeerName);
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [conversationId, initialPeerName, isSupportConversation, startSupportConversation]);

  useEffect(() => {
    startChatRealtime().catch(() => {});

    const unsubscribeMessage = onChatRealtime('ReceiveMessage', (incoming: ChatMessage) => {
      if (!conversationId || String(incoming.conversationId) !== String(conversationId)) return;

      setMessages(prev => {
        if (prev.some(item => String(item.id) === String(incoming.id))) return prev;
        return [...prev, incoming];
      });

      if (!incoming.isMine) {
        markAsRead(conversationId).catch(() => {});
      }
      scrollToEnd(true);
    });

    const unsubscribeConversation = onChatRealtime('ConversationUpdated', (conversation: Conversation) => {
      upsertConversation(conversation);
      if (conversationId && String(conversation.id) === String(conversationId)) {
        setHeaderTitle(conversation.peerName || conversation.shopName || headerTitle);
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConversation();
    };
  }, [conversationId, headerTitle, markAsRead, upsertConversation]);

  const ensureConversation = async () => {
    if (conversationId) return conversationId;

    if (canStartBackendConversation) {
      const conversation = await startConversation(numericShopId, productId);
      setConversationId(conversation.id);
      setHeaderTitle(conversation.peerName || conversation.shopName || initialPeerName);
      return conversation.id;
    }

    if (isSupportConversation) {
      const conversation = await startSupportConversation();
      setConversationId(conversation.id);
      setHeaderTitle(conversation.peerName || conversation.shopName || initialPeerName);
      return conversation.id;
    }

    return directConversationId;
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const appendLocalMessage = async (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    await addMessage({
      id: directConversationId,
      peerId,
      peerName: headerTitle,
      avatarUrl,
      message,
    });
    scrollToEnd(true);
  };

  const handleSend = async (payload: { text?: string; imageUri?: string }) => {
    if (isSending || (!payload.text?.trim() && !payload.imageUri)) return;

    const text = payload.text?.trim();
    setIsSending(true);
    try {
      const targetConversationId = await ensureConversation();

      if (isNumericId(targetConversationId)) {
        const sent = await sendMessage(targetConversationId, text, payload.imageUri);
        setMessages(prev => prev.some(item => String(item.id) === String(sent.id)) ? prev : [...prev, sent]);
        scrollToEnd(true);
      } else {
        await appendLocalMessage({
          id: Date.now().toString(),
          conversationId: targetConversationId,
          senderId: currentUserId,
          isMine: true,
          text: text || null,
          imageUri: payload.imageUri || null,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      Alert.alert('Loi', error?.message || 'Khong the gui tin nhan.');
      if (text) setDraft(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendText = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    handleSend({ text });
  };

  const pickImage = async (fromCamera: boolean) => {
    if (isSending || !canCompose) return;

    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Quyen truy cap', 'Vui long cap quyen de tiep tuc.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await handleSend({ imageUri: result.assets[0].uri });
    }
  };

  const handleAttach = () => {
    if (isSending || !canCompose) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Huy', 'Chup anh', 'Chon tu thu vien'], cancelButtonIndex: 0 },
        idx => {
          if (idx === 1) pickImage(true);
          else if (idx === 2) pickImage(false);
        }
      );
      return;
    }

    Alert.alert('Gui anh', 'Chon nguon anh', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Thu vien anh', onPress: () => pickImage(false) },
      { text: 'Huy', style: 'cancel' },
    ]);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.isMine ?? String(item.senderId) === currentUserId;
    const imageUri = item.imageUri || (item.imageUrl ? resolveProductImageUrl(item.imageUrl) : null);

    return (
      <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.theirMessageRow]}>
        {!isMine && (
          <View style={styles.avatarSmall}>
            <Ionicons name="person-outline" size={14} color={colors.primary} />
          </View>
        )}
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.sentImage} resizeMode="cover" />
          ) : (
            <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>
              {item.text}
            </Text>
          )}
          <Text style={[styles.timeText, isMine && styles.myTimeText]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={messages.length === 0 ? styles.emptyContent : styles.listContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollToEnd(false)}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={42} color="#bbb" />
                <Text style={styles.emptyText}>Hay bat dau cuoc tro chuyen</Text>
              </View>
            }
          />
        )}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttach} disabled={isSending || !canCompose}>
            <Ionicons name="add-circle" size={30} color={isSending || !canCompose ? '#ccc' : colors.primary} />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Nhap tin nhan..."
            placeholderTextColor="#aaa"
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
            textAlignVertical="center"
            editable={!isSending && canCompose}
          />

          <TouchableOpacity
            onPress={handleSendText}
            style={[styles.sendBtn, (!draft.trim() || isSending || !canCompose) && styles.sendBtnDisabled]}
            disabled={!draft.trim() || isSending || !canCompose}
          >
            <Ionicons name="send" size={22} color={draft.trim() && !isSending && canCompose ? colors.primary : '#ccc'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  chatArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  headerSpacer: { width: 34 },
  listContent: { padding: 12, paddingBottom: 8 },
  emptyContent: { flexGrow: 1, padding: 12 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 10, color: colors.textSecondary, fontSize: 14 },
  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  myMessageRow: { justifyContent: 'flex-end' },
  theirMessageRow: { justifyContent: 'flex-start', gap: 8 },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  myText: { color: colors.white },
  theirText: { color: colors.text },
  timeText: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.35)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myTimeText: { color: 'rgba(255,255,255,0.7)' },
  sentImage: {
    width: 200,
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    gap: 6,
  },
  attachBtn: { padding: 4 },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    fontSize: 15,
    maxHeight: 110,
    color: colors.text,
  },
  sendBtn: { padding: 6 },
  sendBtnDisabled: { opacity: 0.4 },
});
