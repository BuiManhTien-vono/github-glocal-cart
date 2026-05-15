import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export const NotificationContentScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { notification } = route.params || {};

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {notification?.title || 'Chi tiết thông báo'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.title}>{notification?.title || 'Thông báo'}</Text>
          {notification?.time && (
            <Text style={s.time}>{notification.time}</Text>
          )}
          <View style={s.divider} />
          <Text style={s.body}>
            {notification?.body || 'Không có nội dung chi tiết.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#333', marginLeft: 16 },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#222', lineHeight: 24 },
  time: { fontSize: 12, color: '#aaa', marginTop: 6 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 14 },
  body: { fontSize: 15, color: '#444', lineHeight: 24 },
});
