import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
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
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, useChatStore } from '../../store/useChatStore';

export default function ChatDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = route.params || {};
  const peerName = params.peerName || params.shopName || 'Người dùng';
  const peerId = params.peerId ?? params.shopId;
  const avatarUrl = params.avatarUrl;
  const currentUserId = String(user?.id || 'me');
  const conversationId = useMemo(
    () => String(params.conversationId || peerId || peerName),
    [params.conversationId, peerId, peerName]
  );

  const { addMessage, fetchConversations, getConversation } = useChatStore();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const loadConversation = useCallback(async () => {
    await fetchConversations();
    setMessages(getConversation(conversationId)?.messages || []);
  }, [conversationId, fetchConversations, getConversation]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation])
  );

  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const appendMessage = async (payload: Pick<ChatMessage, 'text' | 'imageUri'>) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      ...payload,
    };

    setMessages(prev => [...prev, newMessage]);
    await addMessage({
      id: conversationId,
      peerId: peerId != null ? String(peerId) : undefined,
      peerName,
      avatarUrl,
      message: newMessage,
    });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    appendMessage({ text });
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
      : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

    if (!result.canceled && result.assets?.[0]?.uri) {
      appendMessage({ imageUri: result.assets[0].uri });
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
      return;
    }

    Alert.alert('Gửi ảnh', 'Chọn nguồn ảnh', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Thư viện ảnh', onPress: () => pickImage(false) },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === currentUserId;

    return (
      <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.theirMessageRow]}>
        {!isMine && (
          <View style={styles.avatarSmall}>
            <Ionicons name="person-outline" size={14} color={colors.primary} />
          </View>
        )}
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.sentImage} resizeMode="cover" />
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
          <Text style={styles.headerTitle} numberOfLines={1}>{peerName}</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="call-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubble-outline" size={54} color={colors.textMuted} />
              <Text style={styles.emptyText}>Chưa có tin nhắn thật nào.</Text>
            </View>
          }
        />

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
            <Ionicons name="add-circle" size={30} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#aaa"
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
            textAlignVertical="center"
          />

          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
            disabled={!draft.trim()}
          >
            <Ionicons name="send" size={22} color={draft.trim() ? colors.primary : '#ccc'} />
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
  headerIcon: { padding: 6 },
  listContent: { flexGrow: 1, padding: 12, paddingBottom: 8 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: { marginTop: 12, color: colors.textSecondary, fontSize: 14 },
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
