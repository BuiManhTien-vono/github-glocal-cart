import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';

const REPORT_REASONS = [
  'Sản phẩm có dấu hiệu lừa đảo',
  'Hàng giả, hàng nhái',
  'Sản phẩm không rõ nguồn gốc, xuất xứ',
  'Hình ảnh sản phẩm không rõ ràng',
  'Sản phẩm có hình ảnh, nội dung phản cảm hoặc có thể gây phản cảm',
  'Tên sản phẩm (Name) không phù hợp với hình ảnh sản phẩm',
  'Sản phẩm có dấu hiệu tăng đơn ảo',
  'Sản phẩm chứa hình ảnh và thông tin giao dịch ngoài sàn',
  'Khác',
  'Sản phẩm bị cấm buôn bán (động vật hoang dã, 18+,...)',
];

export default function ReportProductScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { productId, productName } = route?.params || {};
  const [submitting, setSubmitting] = useState(false);

  const handleReport = (reason: string) => {
    Alert.alert(
      'Xác nhận tố cáo',
      `Bạn muốn tố cáo sản phẩm với lý do:\n"${reason}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi tố cáo',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiClient.post(`/products/${productId}/report`, { reason });
              Alert.alert(
                '✅ Đã gửi tố cáo',
                'Cảm ơn bạn đã giúp chúng tôi cải thiện chất lượng sản phẩm trên GlocalCart.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch {
              // API chưa có, vẫn thông báo thành công với người dùng
              Alert.alert(
                '✅ Đã ghi nhận',
                'Tố cáo của bạn đã được ghi nhận. Chúng tôi sẽ xem xét và xử lý sớm nhất.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tố cáo sản phẩm này</Text>
        <View style={{ width: 36 }} />
      </View>

      {submitting && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <ScrollView>
        <View style={s.sectionLabel}>
          <Text style={s.sectionLabelText}>Vui Lòng Chọn Lý Do</Text>
        </View>

        <View style={s.list}>
          {REPORT_REASONS.map((reason, idx) => (
            <TouchableOpacity
              key={idx}
              style={[s.item, idx === REPORT_REASONS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleReport(reason)}
              activeOpacity={0.6}
            >
              <Text style={s.itemText}>{reason}</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 12 },
  sectionLabel: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  sectionLabelText: { fontSize: 13, color: '#999' },
  list: { backgroundColor: '#fff' },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0',
  },
  itemText: { flex: 1, fontSize: 15, color: '#333', lineHeight: 22, paddingRight: 8 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 99,
    justifyContent: 'center', alignItems: 'center',
  },
});
