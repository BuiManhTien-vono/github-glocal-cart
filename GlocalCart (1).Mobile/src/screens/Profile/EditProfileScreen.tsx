import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Modal, Platform, ActivityIndicator, Image, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import * as ImagePicker from 'expo-image-picker';

// ─── Helpers ───
const maskEmail = (email: string) => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!name || name.length <= 2) return email;
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
};

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 4) return phone;
  return `${'*'.repeat(phone.length - 3)}${phone.slice(-3)}`;
};

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];
type EditableField = 'fullName' | 'phone' | 'email';

// ─── Custom Date Picker ───
function DatePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  value: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const parsedDate = value && value !== 'Chưa thiết lập' ? new Date(value) : today;

  const [day, setDay] = useState(parsedDate.getDate());
  const [month, setMonth] = useState(parsedDate.getMonth() + 1);
  const [year, setYear] = useState(parsedDate.getFullYear());

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 80 }, (_, i) => today.getFullYear() - i);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dp.overlay} activeOpacity={1} onPress={onClose} />
      <View style={dp.sheet}>
        <View style={dp.header}>
          <TouchableOpacity onPress={onClose}><Text style={dp.cancel}>Hủy</Text></TouchableOpacity>
          <Text style={dp.title}>Chọn ngày sinh</Text>
          <TouchableOpacity onPress={() => onConfirm(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`)}>
            <Text style={dp.confirm}>Xong</Text>
          </TouchableOpacity>
        </View>
        <View style={dp.pickerRow}>
          {/* Day */}
          <ScrollView style={dp.col} showsVerticalScrollIndicator={false}>
            {days.map(d => (
              <TouchableOpacity key={d} style={[dp.item, d === day && dp.itemActive]} onPress={() => setDay(d)}>
                <Text style={[dp.itemText, d === day && dp.itemTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Month */}
          <ScrollView style={dp.col} showsVerticalScrollIndicator={false}>
            {months.map(m => (
              <TouchableOpacity key={m} style={[dp.item, m === month && dp.itemActive]} onPress={() => setMonth(m)}>
                <Text style={[dp.itemText, m === month && dp.itemTextActive]}>Tháng {m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Year */}
          <ScrollView style={dp.col} showsVerticalScrollIndicator={false}>
            {years.map(y => (
              <TouchableOpacity key={y} style={[dp.item, y === year && dp.itemActive]} onPress={() => setYear(y)}>
                <Text style={[dp.itemText, y === year && dp.itemTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const dp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600', color: '#333' },
  cancel: { fontSize: 15, color: '#999' },
  confirm: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  pickerRow: { flexDirection: 'row', height: 220, paddingHorizontal: 8 },
  col: { flex: 1 },
  item: { paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginVertical: 2, marginHorizontal: 4 },
  itemActive: { backgroundColor: colors.primaryBg },
  itemText: { fontSize: 15, color: '#555' },
  itemTextActive: { color: colors.primary, fontWeight: '700' },
});

// ─── Main Component ───
export default function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState((user as any)?.gender || 'Chưa thiết lập');
  const [dob, setDob] = useState((user as any)?.dateOfBirth || (user as any)?.dob || 'Chưa thiết lập');
  const [avatarUri, setAvatarUri] = useState<string | null>((user as any)?.avatarUrl || null);

  const [saving, setSaving] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editModal, setEditModal] = useState<{ field: EditableField; title: string; value: string } | null>(null);

  const initial = (user?.fullName || user?.userName || '?')[0].toUpperCase();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const profile = await apiClient.get('/users/profile') as any;
        if (!mounted || !profile) return;

        updateUser({ ...user!, ...profile });
        setFullName(profile.fullName || '');
        setPhone(profile.phone || '');
        setEmail(profile.email || '');
        setGender(profile.gender || 'Chưa thiết lập');
        setDob(profile.dateOfBirth || 'Chưa thiết lập');
        setAvatarUri(profile.avatarUrl || null);
      } catch (err) {
        console.log('[EditProfile] Load profile error:', err);
      }
    };

    loadProfile();
    return () => { mounted = false; };
  }, []);

  // ─── Validation ───
  const validatePhone = (val: string) => /^0\d{9}$/.test(val.trim());
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const openEditModal = (field: EditableField) => {
    const config = {
      fullName: { title: 'Tên hiển thị', value: fullName },
      phone: { title: 'Số điện thoại', value: phone },
      email: { title: 'Email', value: email },
    }[field];
    setEditModal({ field, ...config });
  };

  const applyEditModal = () => {
    if (!editModal) return;
    const value = editModal.value.trim();

    if (editModal.field === 'fullName') {
      if (!value) {
        Alert.alert('Lỗi', 'Tên không được để trống.');
        return;
      }
      setFullName(value);
    }

    if (editModal.field === 'phone') {
      if (value && !validatePhone(value)) {
        Alert.alert('Số điện thoại không hợp lệ', 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.');
        return;
      }
      setPhone(value);
    }

    if (editModal.field === 'email') {
      if (!validateEmail(value)) {
        Alert.alert('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email.');
        return;
      }
      setEmail(value);
    }

    setEditModal(null);
  };

  // ─── Chọn ảnh ───
  const pickImage = async (fromCamera: boolean) => {
    if (Platform.OS !== 'web') {
      const { status } = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', `Cần cấp quyền ${fromCamera ? 'camera' : 'thư viện ảnh'} để tiếp tục.`);
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handlePickImage = () => {
    if (Platform.OS === 'web') {
      pickImage(false);
      return;
    }
    Alert.alert('Thay đổi ảnh đại diện', 'Chọn nguồn ảnh', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Thư viện ảnh', onPress: () => pickImage(false) },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const uploadAvatarIfNeeded = async () => {
    if (!avatarUri || avatarUri.startsWith('http://') || avatarUri.startsWith('https://')) {
      return avatarUri;
    }

    const extension = avatarUri.split('.').pop()?.split('?')[0] || 'jpg';
    const formData = new FormData();
    formData.append('file', {
      uri: avatarUri,
      name: `avatar.${extension}`,
      type: extension.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg',
    } as any);
    formData.append('folderName', 'avatars');

    const uploaded = await apiClient.post('/upload', formData) as any;
    return uploaded?.url || uploaded?.relativeUrl || avatarUri;
  };

  // ─── Lưu profile ───
  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống.');
      return;
    }
    if (phone && !validatePhone(phone)) {
      Alert.alert('Số điện thoại không hợp lệ', 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.');
      return;
    }
    if (email && !validateEmail(email)) {
      Alert.alert('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email (ví dụ: user@example.com).');
      return;
    }
    setSaving(true);
    try {
      const uploadedAvatarUrl = await uploadAvatarIfNeeded();
      const updated = await apiClient.put('/users/profile', {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gender: gender !== 'Chưa thiết lập' ? gender : null,
        dateOfBirth: dob !== 'Chưa thiết lập' ? dob : null,
        avatarUrl: uploadedAvatarUrl || null,
      }) as any;
      const freshProfile = await apiClient.get('/users/profile') as any;
      const savedProfile = freshProfile || updated;
      const expectedEmail = email.trim().toLowerCase();
      const savedEmail = String((savedProfile as any)?.email || '').trim().toLowerCase();
      if (expectedEmail && savedEmail !== expectedEmail) {
        throw new Error(`Backend chưa lưu email mới. Email trong DB hiện tại vẫn là ${(savedProfile as any)?.email || 'trống'}.`);
      }

      const nextUser = {
        ...user!,
        fullName: fullName.trim(),
        phone: phone.trim() || '',
        email: email.trim() || user?.email,
        gender: gender !== 'Chưa thiết lập' ? gender : null,
        dateOfBirth: dob !== 'Chưa thiết lập' ? dob : null,
        avatarUrl: uploadedAvatarUrl,
        ...(savedProfile || {}),
      };

      updateUser(nextUser);
      setFullName((savedProfile as any)?.fullName || fullName.trim());
      setPhone((savedProfile as any)?.phone || '');
      setEmail((savedProfile as any)?.email || email.trim());
      setGender((savedProfile as any)?.gender || 'Chưa thiết lập');
      setDob((savedProfile as any)?.dateOfBirth || 'Chưa thiết lập');
      setAvatarUri((savedProfile as any)?.avatarUrl || uploadedAvatarUrl || null);

      Alert.alert('✅ Thành công', 'Đã cập nhật hồ sơ của bạn!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể cập nhật. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#EE4D2D" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={s.saveText}>Lưu</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ─── Avatar ─── */}
        <View style={s.avatarSection}>
          <TouchableOpacity style={s.avatarWrap} onPress={handlePickImage} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarCircle}>
                <Text style={s.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={s.cameraOverlay}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={s.avatarHint}>Nhấn để thay đổi ảnh đại diện</Text>
        </View>

        {
          /* Card thông tin cơ bản */
        }
        <View style={s.card}>
          <Text style={s.cardTitle}>Thông tin cơ bản</Text>

          {/* Tên hiển thị */}
          <TouchableOpacity style={s.row} onPress={() => openEditModal('fullName')}>
            <Text style={s.rowLabel}>Tên hiển thị</Text>
            <View style={s.rowRight}>
              <Text style={s.rowValue}>{fullName || 'Chưa thiết lập'}</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          {/* Giới tính */}
          <TouchableOpacity style={s.row} onPress={() => setShowGenderModal(true)}>
            <Text style={s.rowLabel}>Giới tính</Text>
            <View style={s.rowRight}>
              <Text style={s.rowValue}>{gender}</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          {/* Ngày sinh */}
          <TouchableOpacity style={[s.row, { borderBottomWidth: 0 }]} onPress={() => setShowDatePicker(true)}>
            <Text style={s.rowLabel}>Ngày sinh</Text>
            <View style={s.rowRight}>
              <Text style={[s.rowValue, dob === 'Chưa thiết lập' && s.placeholder]}>
                {dob === 'Chưa thiết lập' ? 'Chưa thiết lập' : formatDisplayDate(dob)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Card thông tin liên lạc (có thể sửa) */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Thông tin liên lạc</Text>

          {/* Số điện thoại */}
          <TouchableOpacity style={s.row} onPress={() => openEditModal('phone')}>
            <Text style={s.rowLabel}>Số điện thoại</Text>
            <View style={s.rowRight}>
              <Text style={[s.rowValue, !phone && s.placeholder]}>
                {phone ? maskPhone(phone) : 'Chưa thiết lập'}
              </Text>
              <Ionicons name="pencil-outline" size={14} color="#bbb" style={{ marginLeft: 4 }} />
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity style={[s.row, { borderBottomWidth: 0 }]} onPress={() => openEditModal('email')}>
            <Text style={s.rowLabel}>Email</Text>
            <View style={s.rowRight}>
              <Text style={[s.rowValue, !email && s.placeholder]}>
                {email ? maskEmail(email) : 'Chưa thiết lập'}
              </Text>
              <Ionicons name="pencil-outline" size={14} color="#bbb" style={{ marginLeft: 4 }} />
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={s.tip}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={s.tipText}>Cập nhật thông tin chính xác giúp bảo mật tài khoản tốt hơn.</Text>
        </View>
      </ScrollView>

      {/* ─── Modal Giới tính ─── */}
      <Modal visible={showGenderModal} transparent animationType="slide" onRequestClose={() => setShowGenderModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowGenderModal(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Chọn giới tính</Text>
          </View>
          {GENDER_OPTIONS.map(g => (
            <TouchableOpacity
              key={g}
              style={s.modalItem}
              onPress={() => { setGender(g); setShowGenderModal(false); }}
            >
              <Text style={[s.modalItemText, gender === g && s.modalItemActive]}>{g}</Text>
              {gender === g && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </View>
      </Modal>

      {/* ─── Date Picker Modal ─── */}
      <DatePickerModal
        visible={showDatePicker}
        value={dob}
        onConfirm={(date) => { setDob(date); setShowDatePicker(false); }}
        onClose={() => setShowDatePicker(false)}
      />

      <Modal visible={!!editModal} transparent animationType="fade" onRequestClose={() => setEditModal(null)}>
        <View style={s.editOverlay}>
          <View style={s.editSheet}>
            <Text style={s.editTitle}>{editModal?.title}</Text>
            <TextInput
              style={s.editInput}
              value={editModal?.value || ''}
              onChangeText={(value) => setEditModal(prev => prev ? { ...prev, value } : prev)}
              placeholder={editModal?.field === 'phone' ? '0xxxxxxxxx' : editModal?.field === 'email' ? 'user@example.com' : 'Nhập tên của bạn'}
              placeholderTextColor="#bbb"
              keyboardType={editModal?.field === 'phone' ? 'phone-pad' : editModal?.field === 'email' ? 'email-address' : 'default'}
              autoCapitalize={editModal?.field === 'email' ? 'none' : 'words'}
              autoFocus
            />
            <View style={s.editActions}>
              <TouchableOpacity style={s.editCancel} onPress={() => setEditModal(null)}>
                <Text style={s.editCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.editConfirm} onPress={applyEditModal}>
                <Text style={s.editConfirmText}>Xong</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Format ngày hiển thị
function formatDisplayDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, color: '#333', marginLeft: 16 },
  saveText: { fontSize: 16, color: colors.primary, fontWeight: '700' },

  avatarSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', marginBottom: 12 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FFF5F1', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFD5C8',
  },
  avatarInitial: { fontSize: 36, fontWeight: 'bold', color: '#EE4D2D' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#EE4D2D', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarHint: { marginTop: 10, fontSize: 13, color: '#999' },

  card: { backgroundColor: '#fff', marginBottom: 12, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#eee' },
  cardTitle: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0',
  },
  rowLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 15, color: '#555' },
  rowValueMuted: { fontSize: 15, color: '#999' },
  placeholder: { color: '#ccc' },

  tip: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 12, color: '#888', lineHeight: 18 },

  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  editSheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
  },
  editTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 14 },
  editInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  editCancel: { paddingVertical: 10, paddingHorizontal: 14 },
  editCancelText: { color: '#777', fontSize: 15, fontWeight: '600' },
  editConfirm: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#EE4D2D', borderRadius: 8 },
  editConfirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#eee', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20,
    borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5',
  },
  modalItemText: { fontSize: 16, color: '#333' },
  modalItemActive: { color: colors.primary, fontWeight: '700' },
});
