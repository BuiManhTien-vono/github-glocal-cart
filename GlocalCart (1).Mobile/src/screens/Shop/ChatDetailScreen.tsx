import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image, ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';

interface Message {
  id: string;
  text?: string;
  imageUri?: string;
  isMine: boolean;
  time: string;
}

export default function ChatDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { shopName = 'Shop', shopId } = route.params || {};
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Chào bạn, mình có thể giúp gì cho bạn?', isMine: false, time: '10:00' },
    { id: '2', text: 'Sản phẩm này còn hàng không ạ?', isMine: true, time: '10:05' },
    { id: '3', text: 'Dạ còn bạn nhé, bạn đặt hàng ngay để nhận ưu đãi ạ.', isMine: false, time: '10:06' },
  ]);

  const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), text: message.trim(), isMine: true, time: timeNow() },
    ]);
    setMessage('');
    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
      const uri = result.assets[0].uri;
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), imageUri: uri, isMine: true, time: timeNow() },
      ]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isMine ? styles.myMessageRow : styles.theirMessageRow]}>
      {!item.isMine && (
        <View style={styles.avatarSmall}>
          <Ionicons name="storefront-outline" size={14} color={colors.primary} />
        </View>
      )}
      <View style={[styles.messageBubble, item.isMine ? styles.myBubble : styles.theirBubble]}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.sentImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.messageText, item.isMine ? styles.myText : styles.theirText]}>
            {item.text}
          </Text>
        )}
        <Text style={[styles.timeText, item.isMine && { color: 'rgba(255,255,255,0.7)' }]}>
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="storefront-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{shopName}</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="call-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Chat Content & Input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {/* Nút + gửi ảnh */}
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
            <Ionicons name="add-circle" size={30} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#aaa"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
            textAlignVertical="center"
          />

          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={22} color={message.trim() ? colors.primary : '#ccc'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },

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
  headerIcon: { padding: 6 },

  listContent: { padding: 12, paddingBottom: 8 },

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
