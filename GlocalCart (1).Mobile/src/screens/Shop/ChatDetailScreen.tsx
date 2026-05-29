import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image, ActionSheetIOS, ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { ChatMessage, Conversation, useChatStore } from '../../store/useChatStore';
import { resolveProductImageUrl } from '../../utils/imageUtils';
import { onChatRealtime, startChatRealtime } from '../../services/realtime/chatRealtime';

export default function ChatDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const {
    conversationId: routeConversationId,
    shopName = 'Shop',
    shopId,
    productId,
  } = route.params || {};

  const [conversationId, setConversationId] = useState<number | null>(
    routeConversationId ? Number(routeConversationId) : null
  );
  const [headerTitle, setHeaderTitle] = useState(shopName);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const { startConversation, getMessages, sendMessage, markAsRead, upsertConversation } = useChatStore();

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      inputRef.current?.blur();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    if (!shopId) throw new Error('Không tìm thấy thông tin shop.');

    const conversation = await startConversation(Number(shopId), productId ? Number(productId) : undefined);
    setConversationId(conversation.id);
    setHeaderTitle(conversation.shopName || conversation.otherUserName || shopName);
    return conversation.id;
  };

  const loadMessages = async (id: number, showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getMessages(id);
      setMessages(data);
      await markAsRead(id).catch(() => {});
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể tải tin nhắn.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        setIsLoading(true);
        const id = conversationId;

        if (!id && !shopId) {
          Alert.alert('Lỗi', 'Không tìm thấy cuộc trò chuyện.');
          navigation.goBack();
          return;
        }

        if (id) {
          await loadMessages(id, false);
        } else {
          setMessages([]);
          setHeaderTitle(shopName);
        }
      } catch (error: any) {
        Alert.alert('Lỗi', error?.message || 'Không thể mở chat.');
        navigation.goBack();
      } finally {
        if (active) setIsLoading(false);
      }
    };

    init();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    startChatRealtime().catch(() => {});

    const unsubscribeMessage = onChatRealtime('ReceiveMessage', (incoming: ChatMessage) => {
      if (conversationId && incoming.conversationId !== conversationId) return;
      setMessages(prev => {
        if (prev.some(item => item.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
      if (conversationId && !incoming.isMine) {
        markAsRead(conversationId).catch(() => {});
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    });

    const unsubscribeConversation = onChatRealtime('ConversationUpdated', (conversation: Conversation) => {
      upsertConversation(conversation);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConversation();
    };
  }, [conversationId, markAsRead, upsertConversation]);

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendText = async () => {
    if (!message.trim() || isSending) return;

    const text = message.trim();
    setMessage('');
    setIsSending(true);
    try {
      const targetConversationId = await ensureConversation();
      const sent = await sendMessage(targetConversationId, text);
      setMessages(prev => prev.some(item => item.id === sent.id) ? prev : [...prev, sent]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      setMessage(text);
      Alert.alert('Lỗi', error?.message || 'Không thể gửi tin nhắn.');
    } finally {
      setIsSending(false);
    }
  };

  const sendImage = async (uri: string) => {
    if (isSending) return;

    setIsSending(true);
    try {
      const targetConversationId = await ensureConversation();
      const sent = await sendMessage(targetConversationId, undefined, uri);
      setMessages(prev => prev.some(item => item.id === sent.id) ? prev : [...prev, sent]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể gửi ảnh.');
    } finally {
      setIsSending(false);
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền để tiếp tục.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await sendImage(result.assets[0].uri);
    }
  };

  const handleAttach = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Hủy', 'Chụp ảnh', 'Chọn từ thư viện'], cancelButtonIndex: 0 },
        idx => {
          if (idx === 1) pickImage(true);
          else if (idx === 2) pickImage(false);
        }
      );
    } else {
      Alert.alert('Gửi ảnh', 'Chọn nguồn ảnh', [
        { text: 'Camera', onPress: () => pickImage(true) },
        { text: 'Thư viện ảnh', onPress: () => pickImage(false) },
        { text: 'Hủy', style: 'cancel' },
      ]);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const imageUrl = item.imageUrl ? resolveProductImageUrl(item.imageUrl) : null;

    return (
      <View style={[styles.messageRow, item.isMine ? styles.myMessageRow : styles.theirMessageRow]}>
        {!item.isMine && (
          <View style={styles.avatarSmall}>
            <Ionicons name="storefront-outline" size={14} color={colors.primary} />
          </View>
        )}
        <View style={[styles.messageBubble, item.isMine ? styles.myBubble : styles.theirBubble]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.sentImage} resizeMode="cover" />
          ) : (
            <Text style={[styles.messageText, item.isMine ? styles.myText : styles.theirText]}>
              {item.text}
            </Text>
          )}
          <Text style={[styles.timeText, item.isMine && { color: 'rgba(255,255,255,0.7)' }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const canCompose = !!conversationId || !!shopId;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="storefront-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : isKeyboardVisible ? 'height' : undefined}
        keyboardVerticalOffset={0}
        enabled={Platform.OS === 'ios' || isKeyboardVisible}
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
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={42} color="#bbb" />
                <Text style={styles.emptyText}>Hãy bắt đầu cuộc trò chuyện</Text>
              </View>
            }
          />
        )}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttach} disabled={isSending || !canCompose}>
            <Ionicons name="add-circle" size={30} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#aaa"
            value={message}
            onChangeText={setMessage}
            onFocus={() => setIsKeyboardVisible(true)}
            onBlur={() => setIsKeyboardVisible(false)}
            multiline
            maxLength={1000}
            textAlignVertical="center"
            editable={!isSending && canCompose}
          />

          <TouchableOpacity
            onPress={handleSendText}
            style={[styles.sendBtn, (!message.trim() || isSending || !canCompose) && styles.sendBtnDisabled]}
            disabled={!message.trim() || isSending || !canCompose}
          >
            <Ionicons name="send" size={22} color={message.trim() && !isSending && canCompose ? colors.primary : '#ccc'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  keyboardWrap: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  headerSpacer: { width: 34 },

  listContent: { padding: 12, paddingBottom: 8 },
  emptyContent: { flexGrow: 1, padding: 12 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 10, color: '#888', fontSize: 14 },

  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  myMessageRow: { justifyContent: 'flex-end' },
  theirMessageRow: { justifyContent: 'flex-start', gap: 8 },

  avatarSmall: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
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
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  myText: { color: '#fff' },
  theirText: { color: '#333' },
  timeText: {
    fontSize: 10, color: 'rgba(0,0,0,0.35)',
    alignSelf: 'flex-end', marginTop: 4,
  },
  sentImage: {
    width: 200, height: 160, borderRadius: 10, overflow: 'hidden',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
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
    color: '#333',
  },
  sendBtn: { padding: 6 },
  sendBtnDisabled: { opacity: 0.4 },
});
