import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl,
  Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../../components/common/Header';
import { Loading } from '../../components/common/Loading';
import apiClient from '../../services/api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, shadow } from '../../theme/colors';

const LOCAL_STORAGE_KEY = '@glocal_addresses';

// --- Dữ liệu mock phân cấp (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã) ---
const LOCATION_DATA: Record<string, Record<string, string[]>> = {
  'Hà Nội': {
    'Cầu Giấy': ['Dịch Vọng', 'Mai Dịch', 'Nghĩa Đô', 'Trung Hòa'],
    'Đống Đa': ['Cát Linh', 'Láng Hạ', 'Ô Chợ Dừa', 'Trung Liệt'],
    'Thanh Xuân': ['Khương Đình', 'Khương Mai', 'Thanh Xuân Bắc', 'Thanh Xuân Nam'],
  },
  'Hồ Chí Minh': {
    'Quận 1': ['Bến Nghé', 'Bến Thành', 'Đa Kao', 'Phạm Ngũ Lão'],
    'Quận 7': ['Bình Thuận', 'Phú Mỹ', 'Tân Kiểng', 'Tân Phong'],
    'Thành phố Thủ Đức': ['An Khánh', 'Bình Trưng Tây', 'Linh Chiểu', 'Thảo Điền'],
  },
  'Đà Nẵng': {
    'Hải Châu': ['Hải Châu 1', 'Hải Châu 2', 'Thạch Thang', 'Thuận Phước'],
    'Sơn Trà': ['An Hải Bắc', 'An Hải Tây', 'Mân Thái', 'Phước Mỹ'],
  }
};

interface Address {
  id: string | number;
  fullName: string;
  phone: string;
  street: string; // Số nhà, ngõ
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export default function AddressScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const isSelecting = route.params?.isSelecting || false;
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({ fullName: '', phone: '', street: '', ward: '', district: '', city: '', isDefault: false });

  // Autocomplete UI state
  const [activePicker, setActivePicker] = useState<'city' | 'district' | 'ward' | null>(null);

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try {
      // Thử API
      const d = await apiClient.get('/users/addresses') as any;
      if (d && d.length > 0) {
        setAddresses(d);
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(d));
      } else {
        // Fallback local
        const local = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) setAddresses(JSON.parse(local));
      }
    } catch (e: any) {
      // Lỗi API thì dùng local
      const local = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) setAddresses(JSON.parse(local));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const saveLocalAddresses = async (newAddresses: Address[]) => {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  const resetForm = () => {
    setForm({ fullName: '', phone: '', street: '', ward: '', district: '', city: '', isDefault: false });
    setEditId(null);
    setShowModal(false);
    setActivePicker(null);
  };

  const openEdit = (a: Address) => {
    setForm({ fullName: a.fullName, phone: a.phone, street: a.street, ward: a.ward, district: a.district, city: a.city, isDefault: a.isDefault });
    setEditId(a.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.street || !form.city || !form.district || !form.ward) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    setSaving(true);
    try {
      // Chỉnh isDefault cho list
      let currentList = [...addresses];
      if (form.isDefault) {
        currentList = currentList.map(a => ({ ...a, isDefault: false }));
      }

      if (editId) {
        // Cập nhật
        const idx = currentList.findIndex(a => a.id === editId);
        if (idx >= 0) {
          currentList[idx] = { ...form, id: editId } as Address;
        }
        // Thử API
        try { await apiClient.put(`/users/addresses/${editId}`, form); } catch (e) { }
      } else {
        // Thêm mới
        const newAddr = { ...form, id: Date.now().toString() };
        currentList.push(newAddr);
        try { await apiClient.post('/users/addresses', form); } catch (e) { }
      }

      await saveLocalAddresses(currentList);
      resetForm();
      Alert.alert('✅ Thành công', editId ? 'Đã cập nhật.' : 'Đã thêm địa chỉ.');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number | string) => {
    Alert.alert('Xóa', 'Bạn có chắc chắn muốn xóa địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            try { await apiClient.delete(`/users/addresses/${id}`); } catch (e) { }
            const newList = addresses.filter(a => a.id !== id);
            await saveLocalAddresses(newList);
          } catch (e: any) { Alert.alert('Lỗi', e.message); }
        }
      },
    ]);
  };

  // Các tuỳ chọn gợi ý
  const cities = Object.keys(LOCATION_DATA);
  const districts = form.city && LOCATION_DATA[form.city] ? Object.keys(LOCATION_DATA[form.city]) : [];
  const wards = form.city && form.district && LOCATION_DATA[form.city]?.[form.district] ? LOCATION_DATA[form.city][form.district] : [];

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <Header title="Sổ Địa Chỉ" subtitle={`${addresses.length} địa chỉ`} onBack={() => navigation.goBack()} />
      <FlatList
        data={addresses}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAddresses(); }} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}><Ionicons name="location-outline" size={48} color={colors.textMuted} /></View>
            <Text style={s.emptyTitle}>Chưa có địa chỉ</Text>
            <Text style={s.emptyDesc}>Thêm địa chỉ giao hàng để mua sắm nhanh hơn</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            activeOpacity={isSelecting ? 0.7 : 1}
            onPress={() => {
              if (isSelecting) {
                navigation.navigate('Checkout', { selectedAddress: item });
              }
            }}
          >
            {item.isDefault && <View style={s.defBadge}><Ionicons name="checkmark-circle" size={12} color="#FFF" /><Text style={s.defText}>Mặc định</Text></View>}
            <View style={s.cardTop}><Ionicons name="location" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.fullName || user?.fullName || 'Người nhận'}</Text>
                <Text style={s.phone}>{item.phone || user?.phone || 'Số điện thoại'}</Text>
              </View>
            </View>
            <Text style={s.detail}>{item.street}</Text>
            <Text style={s.detail}>{[item.ward, item.district, item.city].filter(Boolean).join(', ')}</Text>
            <View style={s.actions}>
              <TouchableOpacity style={s.actBtn} onPress={() => openEdit(item)}><Ionicons name="create-outline" size={16} color={colors.secondary} /><Text style={[s.actText, { color: colors.secondary }]}>Sửa</Text></TouchableOpacity>
              <TouchableOpacity style={s.actBtn} onPress={() => handleDelete(item.id)}><Ionicons name="trash-outline" size={16} color={colors.danger} /><Text style={[s.actText, { color: colors.danger }]}>Xóa</Text></TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}><Ionicons name="add" size={28} color="#FFF" /></TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', maxHeight: '90%' }}
          >
            <View style={[s.modal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={s.handle} /><Text style={s.modalTitle}>{editId ? 'Sửa Địa Chỉ' : 'Thêm Địa Chỉ Mới'}</Text>

              {activePicker ? (
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => setActivePicker(null)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <Ionicons name="arrow-back" size={20} color={colors.primary} />
                    <Text style={{ marginLeft: 8, color: colors.primary, fontWeight: '600' }}>Quay lại</Text>
                  </TouchableOpacity>
                  <Text style={s.modalTitle}>
                    Chọn {activePicker === 'city' ? 'Thành phố/Tỉnh' : activePicker === 'district' ? 'Quận/Huyện' : 'Phường/Xã'}
                  </Text>
                  <ScrollView>
                    {(activePicker === 'city' ? cities : activePicker === 'district' ? districts : wards).map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={s.pickerItem}
                        onPress={() => {
                          if (activePicker === 'city') setForm({ ...form, city: opt, district: '', ward: '' });
                          if (activePicker === 'district') setForm({ ...form, district: opt, ward: '' });
                          if (activePicker === 'ward') setForm({ ...form, ward: opt });
                          setActivePicker(null);
                        }}
                      >
                        <Text style={s.pickerItemText}>{opt}</Text>
                        {(activePicker === 'city' && form.city === opt ||
                          activePicker === 'district' && form.district === opt ||
                          activePicker === 'ward' && form.ward === opt) && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                          )}
                      </TouchableOpacity>
                    ))}
                    {(activePicker === 'district' && districts.length === 0) && <Text style={{ color: '#999' }}>Vui lòng chọn Thành phố trước.</Text>}
                    {(activePicker === 'ward' && wards.length === 0) && <Text style={{ color: '#999' }}>Vui lòng chọn Quận/Huyện trước.</Text>}
                  </ScrollView>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                  {/* Thành phố */}
                  <View style={s.field}>
                    <Text style={s.label}>Thành phố/Tỉnh *</Text>
                    <TouchableOpacity style={s.inputWrap} onPress={() => setActivePicker('city')}>
                      <Ionicons name="location-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                      <Text style={[s.input, !form.city && { color: colors.textMuted }]}>{form.city || 'Chọn Thành phố'}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#ccc" />
                    </TouchableOpacity>
                  </View>
                  {/* Quận/Huyện */}
                  <View style={s.field}>
                    <Text style={s.label}>Quận/Huyện *</Text>
                    <TouchableOpacity style={s.inputWrap} onPress={() => setActivePicker('district')}>
                      <Ionicons name="navigate-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                      <Text style={[s.input, !form.district && { color: colors.textMuted }]}>{form.district || 'Chọn Quận/Huyện'}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#ccc" />
                    </TouchableOpacity>
                  </View>
                  {/* Phường/Xã */}
                  <View style={s.field}>
                    <Text style={s.label}>Phường/Xã *</Text>
                    <TouchableOpacity style={s.inputWrap} onPress={() => setActivePicker('ward')}>
                      <Ionicons name="map-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                      <Text style={[s.input, !form.ward && { color: colors.textMuted }]}>{form.ward || 'Chọn Phường/Xã'}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#ccc" />
                    </TouchableOpacity>
                  </View>

                  {/* Số nhà, ngõ */}
                  <View style={s.field}>
                    <Text style={s.label}>Số nhà, Tên đường *</Text>
                    <View style={s.inputWrap}>
                      <Ionicons name="home-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                      <TextInput style={s.input} value={form.street} onChangeText={v => setForm({ ...form, street: v })} placeholder="Ví dụ: 123 Đường Số 1, Ngõ 4" />
                    </View>
                  </View>

                  <TouchableOpacity style={s.defToggle} onPress={() => setForm({ ...form, isDefault: !form.isDefault })}>
                    <Ionicons name={form.isDefault ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
                    <Text style={s.defTogText}>Đặt làm mặc định</Text>
                  </TouchableOpacity>

                  <View style={s.modalActs}>
                    <TouchableOpacity style={s.cancelBtn} onPress={resetForm}><Text style={s.cancelText}>Hủy</Text></TouchableOpacity>
                    <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}><Text style={s.saveText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text></TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12, ...shadow.sm, borderLeftWidth: 4, borderLeftColor: colors.primary },
  defBadge: { position: 'absolute', top: 0, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  defText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  phone: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  detail: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginLeft: 30 },
  actions: { flexDirection: 'row', gap: 20, marginTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actText: { fontSize: 13, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.lg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '100%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  defToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, marginBottom: 16 },
  defTogText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  modalActs: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  pickerItemText: { fontSize: 15, color: colors.text },
});
