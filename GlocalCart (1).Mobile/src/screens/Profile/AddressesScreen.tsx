import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { Loading } from '../../components/common/Loading';
import apiClient from '../../services/api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, shadow } from '../../theme/colors';

interface Address {
  id: number;
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  isDefault: boolean;
}

interface AddressForm {
  streetLine: string;
  ward: string;
  district: string;
  city: string;
  zipcode: string;
  country: string;
  isDefault: boolean;
}

interface LocationOption {
  code?: number | string;
  name: string;
}

type PickerType = 'country' | 'city' | 'district' | 'ward';

const LOCATION_API = 'https://provinces.open-api.vn/api';
const COUNTRY_OPTIONS: LocationOption[] = [{ code: 'VN', name: 'Việt Nam' }];

const createEmptyForm = (isDefault = false): AddressForm => ({
  streetLine: '',
  ward: '',
  district: '',
  city: '',
  zipcode: '000000',
  country: 'Việt Nam',
  isDefault,
});

const formatAddress = (address: Address) =>
  [
    address.streetAddress,
    address.state,
    address.city,
    address.zipcode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

const parseStreetAddress = (streetAddress?: string) => {
  const parts = String(streetAddress || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return { streetLine: parts[0] || '', ward: '' };
  }

  return {
    streetLine: parts.slice(0, -1).join(', '),
    ward: parts[parts.length - 1],
  };
};

const isVietnam = (country: string) => {
  const normalized = country.trim().toLowerCase();
  return normalized === 'việt nam' || normalized === 'viet nam' || normalized === 'vietnam';
};

const optionMatchesSearch = (option: LocationOption, search: string) =>
  option.name.toLowerCase().includes(search.trim().toLowerCase());

export default function AddressScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const isSelecting = route.params?.isSelecting || false;
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddressForm>(createEmptyForm());

  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [districtCode, setDistrictCode] = useState<number | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>('country');
  const [pickerOptions, setPickerOptions] = useState<LocationOption[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerEmptyText, setPickerEmptyText] = useState('');

  const fullAddressPreview = useMemo(
    () =>
      [
        form.streetLine.trim(),
        form.ward.trim(),
        form.district.trim(),
        form.city.trim(),
        form.zipcode.trim(),
        form.country.trim(),
      ]
        .filter(Boolean)
        .join(', '),
    [form],
  );

  const filteredPickerOptions = useMemo(
    () => pickerOptions.filter(option => optionMatchesSearch(option, pickerSearch)),
    [pickerOptions, pickerSearch],
  );

  const fetchAddresses = async () => {
    try {
      const data: any = await apiClient.get('/users/addresses');
      const list = Array.isArray(data) ? data : data?.items || [];
      setAddresses(list);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể tải sổ địa chỉ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const closeModal = () => {
    setEditId(null);
    setForm(createEmptyForm(addresses.length === 0));
    setProvinceCode(null);
    setDistrictCode(null);
    setShowModal(false);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(createEmptyForm(addresses.length === 0));
    setProvinceCode(null);
    setDistrictCode(null);
    setShowModal(true);
  };

  const openEdit = (address: Address) => {
    const parsed = parseStreetAddress(address.streetAddress);
    setEditId(address.id);
    setForm({
      streetLine: parsed.streetLine,
      ward: parsed.ward,
      city: address.city || '',
      district: address.state || '',
      zipcode: address.zipcode || '000000',
      country: address.country || 'Việt Nam',
      isDefault: !!address.isDefault,
    });
    setProvinceCode(null);
    setDistrictCode(null);
    setShowModal(true);
  };

  const updateForm = (key: keyof AddressForm, value: string | boolean) => {
    setForm(current => ({ ...current, [key]: value }));
    if (key === 'country' || key === 'city') {
      setProvinceCode(null);
      setDistrictCode(null);
    }
    if (key === 'district') {
      setDistrictCode(null);
    }
  };

  const buildPayload = () => ({
    streetAddress: [form.streetLine.trim(), form.ward.trim()].filter(Boolean).join(', '),
    city: form.city.trim(),
    state: form.district.trim(),
    zipcode: form.zipcode.trim() || '000000',
    country: form.country.trim() || 'Việt Nam',
    isDefault: form.isDefault || addresses.length === 0,
  });

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload.streetAddress || !payload.state || !payload.city || !payload.country) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập số nhà/tên đường, quận/huyện, tỉnh/thành phố và quốc gia.',
      );
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await apiClient.put(`/users/addresses/${editId}`, payload);
      } else {
        await apiClient.post('/users/addresses', payload);
      }

      await fetchAddresses();
      closeModal();
      Alert.alert('Thành công', editId ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể lưu địa chỉ.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Xóa địa chỉ', 'Bạn có chắc chắn muốn xóa địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/users/addresses/${id}`);
            await fetchAddresses();
          } catch (error: any) {
            Alert.alert('Lỗi', error?.message || 'Không thể xóa địa chỉ.');
          }
        },
      },
    ]);
  };

  const openPicker = async (type: PickerType) => {
    setPickerType(type);
    setPickerVisible(true);
    setPickerSearch('');
    setPickerOptions([]);
    setPickerEmptyText('');
    setPickerLoading(true);

    try {
      if (type === 'country') {
        setPickerOptions(COUNTRY_OPTIONS);
        return;
      }

      if (!isVietnam(form.country)) {
        setPickerEmptyText('Hiện chỉ có API địa giới cho Việt Nam. Bạn vẫn có thể nhập tay.');
        return;
      }

      if (type === 'city') {
        const response = await fetch(`${LOCATION_API}/p/`);
        const data = await response.json();
        setPickerOptions(Array.isArray(data) ? data.map(item => ({ code: item.code, name: item.name })) : []);
        return;
      }

      if (type === 'district') {
        if (!provinceCode) {
          setPickerEmptyText('Hãy chọn tỉnh/thành phố bằng nút Chọn trước, hoặc nhập quận/huyện thủ công.');
          return;
        }
        const response = await fetch(`${LOCATION_API}/p/${provinceCode}?depth=2`);
        const data = await response.json();
        setPickerOptions((data?.districts || []).map((item: any) => ({ code: item.code, name: item.name })));
        return;
      }

      if (!districtCode) {
        setPickerEmptyText('Hãy chọn quận/huyện bằng nút Chọn trước, hoặc nhập phường/xã thủ công.');
        return;
      }
      const response = await fetch(`${LOCATION_API}/d/${districtCode}?depth=2`);
      const data = await response.json();
      setPickerOptions((data?.wards || []).map((item: any) => ({ code: item.code, name: item.name })));
    } catch (error) {
      setPickerEmptyText('Không tải được danh sách địa điểm. Bạn có thể nhập tay.');
    } finally {
      setPickerLoading(false);
    }
  };

  const selectLocation = (option: LocationOption) => {
    if (pickerType === 'country') {
      setForm(current => ({
        ...current,
        country: option.name,
        city: '',
        district: '',
        ward: '',
      }));
      setProvinceCode(null);
      setDistrictCode(null);
    }

    if (pickerType === 'city') {
      setForm(current => ({
        ...current,
        city: option.name,
        district: '',
        ward: '',
      }));
      setProvinceCode(Number(option.code));
      setDistrictCode(null);
    }

    if (pickerType === 'district') {
      setForm(current => ({
        ...current,
        district: option.name,
        ward: '',
      }));
      setDistrictCode(Number(option.code));
    }

    if (pickerType === 'ward') {
      setForm(current => ({
        ...current,
        ward: option.name,
      }));
    }

    setPickerVisible(false);
  };

  const pickerTitle = {
    country: 'Chọn quốc gia',
    city: 'Chọn tỉnh/thành phố',
    district: 'Chọn quận/huyện',
    ward: 'Chọn phường/xã',
  }[pickerType];

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <Header title="Sổ Địa Chỉ" subtitle={`${addresses.length} địa chỉ`} onBack={() => navigation.goBack()} />

      <FlatList
        data={addresses}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAddresses();
            }}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có địa chỉ</Text>
            <Text style={styles.emptyDesc}>Thêm địa chỉ đủ cấp để shipper định vị chính xác trên bản đồ.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={isSelecting ? 0.7 : 1}
            onPress={() => {
              if (isSelecting) {
                navigation.navigate('Checkout', { selectedAddress: item });
              }
            }}
          >
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.white} />
                <Text style={styles.defaultText}>Mặc định</Text>
              </View>
            )}

            <View style={styles.cardTop}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user?.fullName || 'Người nhận'}</Text>
                <Text style={styles.phone}>{user?.phone || 'Chưa có số điện thoại'}</Text>
              </View>
            </View>

            <Text style={styles.detail}>{formatAddress(item)}</Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => openEdit(item)}>
                <Ionicons name="create-outline" size={16} color={colors.secondary} />
                <Text style={[styles.actionText, { color: colors.secondary }]}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={[styles.actionText, { color: colors.danger }]}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoiding}
          >
            <View style={[styles.modal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.handle} />
              <Text style={styles.modalTitle}>{editId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <AddressInput
                  icon="home-outline"
                  label="Số nhà, tên đường *"
                  value={form.streetLine}
                  placeholder="Ví dụ: 123 Nguyễn Trãi"
                  multiline
                  onChangeText={value => updateForm('streetLine', value)}
                />
                <SelectableAddressInput
                  icon="flag-outline"
                  label="Quốc gia *"
                  value={form.country}
                  placeholder="Ví dụ: Việt Nam"
                  onChangeText={value => updateForm('country', value)}
                  onPick={() => openPicker('country')}
                />
                <SelectableAddressInput
                  icon="business-outline"
                  label="Tỉnh/Thành phố *"
                  value={form.city}
                  placeholder="Ví dụ: Thành phố Hồ Chí Minh"
                  onChangeText={value => updateForm('city', value)}
                  onPick={() => openPicker('city')}
                />
                <SelectableAddressInput
                  icon="navigate-outline"
                  label="Quận/Huyện *"
                  value={form.district}
                  placeholder="Ví dụ: Quận 1"
                  onChangeText={value => updateForm('district', value)}
                  onPick={() => openPicker('district')}
                />
                <SelectableAddressInput
                  icon="map-outline"
                  label="Phường/Xã"
                  value={form.ward}
                  placeholder="Ví dụ: Phường Bến Thành"
                  onChangeText={value => updateForm('ward', value)}
                  onPick={() => openPicker('ward')}
                />
                <AddressInput
                  icon="mail-outline"
                  label="Mã bưu chính"
                  value={form.zipcode}
                  placeholder="Ví dụ: 700000"
                  keyboardType="number-pad"
                  onChangeText={value => updateForm('zipcode', value)}
                />

                <View style={styles.previewBox}>
                  <Text style={styles.previewLabel}>Địa chỉ lưu vào DB</Text>
                  <Text style={styles.previewText}>
                    {fullAddressPreview || 'Nhập địa chỉ để xem trước chuỗi shipper sẽ định vị.'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.defaultToggle}
                  onPress={() => updateForm('isDefault', !form.isDefault)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={form.isDefault ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.defaultToggleText}>Đặt làm địa chỉ mặc định</Text>
                </TouchableOpacity>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                    <Text style={styles.cancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu vào DB'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{pickerTitle}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.pickerClose}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Tìm địa điểm"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {pickerLoading ? (
              <View style={styles.pickerLoading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.pickerEmptyText}>Đang tải danh sách...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredPickerOptions}
                keyExtractor={(item, index) => `${item.code || item.name}_${index}`}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.pickerEmptyText}>
                    {pickerEmptyText || 'Không có dữ liệu phù hợp. Bạn có thể nhập tay ở ô bên ngoài.'}
                  </Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.pickerItem} onPress={() => selectLocation(item)}>
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AddressInput({
  icon,
  label,
  value,
  placeholder,
  multiline,
  keyboardType,
  onChangeText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, multiline && styles.textAreaWrap]}>
        <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          keyboardType={keyboardType || 'default'}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}

function SelectableAddressInput({
  icon,
  label,
  value,
  placeholder,
  onChangeText,
  onPick,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onPick: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectWrap}>
        <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onChangeText={onChangeText}
        />
        <TouchableOpacity style={styles.pickButton} onPress={onPick}>
          <Ionicons name="list-outline" size={16} color={colors.primary} />
          <Text style={styles.pickButtonText}>Chọn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  defaultBadge: {
    position: 'absolute',
    top: 0,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  defaultText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  phone: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  detail: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginLeft: 30 },
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  keyboardAvoiding: { width: '100%', maxHeight: '92%' },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '100%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 20 },
  field: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  selectWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 48,
  },
  textAreaWrap: { alignItems: 'flex-start', paddingTop: 12, paddingBottom: 12 },
  inputIcon: { marginRight: 10, marginTop: 1 },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  pickButton: {
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.primaryBg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickButtonText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  previewBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 12,
    marginBottom: 12,
  },
  previewLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  previewText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  defaultToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, marginBottom: 16 },
  defaultToggleText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { fontSize: 15, fontWeight: '700', color: colors.white },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    height: '82%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  pickerClose: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 },
  pickerLoading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  pickerEmptyText: { color: colors.textSecondary, textAlign: 'center', padding: 24, lineHeight: 20 },
  pickerItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: 12,
  },
  pickerItemText: { color: colors.text, fontSize: 15, flex: 1, paddingRight: 12 },
});
