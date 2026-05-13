import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/colors';

export default function ChatDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { shopName } = route.params || { shopName: 'Shop' };
  const [message, setMessage] = useState('');
  
  const [messages, setMessages] = useState([
    { id: '1', text: 'Chào bạn, mình có thể giúp gì cho bạn?', isMine: false, time: '10:00' },
    { id: '2', text: 'Sản phẩm này còn hàng không ạ?', isMine: true, time: '10:05' },
    { id: '3', text: 'Dạ còn bạn nhé, bạn đặt hàng ngay để nhận ưu đãi ạ.', isMine: false, time: '10:06' },
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        isMine: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={[styles.messageRow, item.isMine ? styles.myMessageRow : styles.theirMessageRow]}>
      <View style={[styles.messageBubble, item.isMine ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.messageText, item.isMine ? styles.myText : styles.theirText]}>{item.text}</Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shopName}</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="call-outline" size={22} color="#EE4D2D" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        inverted={false}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add-circle-outline" size={28} color="#666" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={!message.trim()}>
            <Ionicons name="send" size={24} color={message.trim() ? "#EE4D2D" : "#ccc"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerIcon: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: '#EE4D2D',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: '#FFF',
  },
  theirText: {
    color: '#333',
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  attachBtn: {
    padding: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: {
    padding: 4,
  },
});
