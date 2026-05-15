import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';

const STORAGE_KEY = '@glocal_payment_methods';

const BANKS = [
  'Vietcombank', 'BIDV', 'Agribank', 'Techcombank',
  'MB Bank', 'Sacombank', 'VPBank', 'TPBank',
  'ACB', 'SHB', 'HDBank', 'Eximbank',
];

interface PaymentMethod {
  id: string;
  type: 'bank' | 'card';
  bankName?: string; // For bank
  accountNumber?: string; // For bank
  accountName?: string; // For bank
  cardNumber?: string; // For card
  cardHolder?: string; // For card
  expiryDate?: string; // For card
  isDefault: boolean;
}

function AddPaymentModal({ visible, onClose, onSave }: any) {
  const [type, setType] = useState<'bank' | 'card'>('bank');
  
  // Bank fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleSave = () => {
    if (type === 'bank') {
      if (!bankName || !accountNumber || !accountName) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin ngân hàng.');
        return;
      }
      if (!/^\d{9,16}$/.test(accountNumber)) {
        Alert.alert('Số tài khoản không hợp lệ', 'Số tài khoản phải từ 9 đến 16 chữ số.');
        return;
      }
      onSave({
        id: Date.now().toString(), type: 'bank', bankName, accountNumber, accountName, isDefault: false
      });
    } else {
      if (!cardNumber || !cardHolder || !expiryDate) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin thẻ.');
        return;
      }
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (!/^\d{16}$/.test(cleanCard)) {
        Alert.alert('Số thẻ không hợp lệ', 'Số thẻ tín dụng/ghi nợ phải đủ 16 chữ số.');
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        Alert.alert('Ngày hết hạn không hợp lệ', 'Vui lòng nhập theo định dạng MM/YY.');
        return;
      }
      onSave({
        id: Date.now().toString(), type: 'card', cardNumber: cleanCard, cardHolder, expiryDate, isDefault: false
      });
    }
    
    // Reset
    setBankName(''); setAccountNumber(''); setAccountName('');
    setCardNumber(''); setCardHolder(''); setExpiryDate('');
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, '');
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += cleaned[i];
    }
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length >= 2) {
      setExpiryDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiryDate(cleaned);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.header}>
              <Text style={m.title}>Thêm Phương thức thanh toán</Text>
              <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={m.tabs}>
              <TouchableOpacity style={[m.tab, type === 'bank' && m.tabActive]} onPress={() => setType('bank')}>
                <Text style={[m.tabText, type === 'bank' && m.tabTextActive]}>Tài khoản Ngân hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.tab, type === 'card' && m.tabActive]} onPress={() => setType('card')}>
                <Text style={[m.tabText, type === 'card' && m.tabTextActive]}>Thẻ Tín dụng / Ghi nợ</Text>
              </TouchableOpacity>
            </View>

            {type === 'bank' ? (
              <View>
                <Text style={m.label}>Ngân hàng</Text>
                <TouchableOpacity style={m.select} onPress={() => setShowBankPicker(true)}>
                  <Text style={[m.selectText, !bankName && { color: '#bbb' }]}>
                    {bankName || 'Chọn ngân hàng'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#aaa" />
                </TouchableOpacity>

                <Text style={m.label}>Số tài khoản</Text>
                <TextInput
                  style={m.input}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Nhập số tài khoản"
                  keyboardType="number-pad"
                  maxLength={16}
                />

                <Text style={m.label}>Tên chủ tài khoản</Text>
                <TextInput
                  style={m.input}
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="VÍ DỤ: NGUYEN VAN A"
                  autoCapitalize="characters"
                />
              </View>
            ) : (
              <View>
                <Text style={m.label}>Số thẻ</Text>
                <TextInput
                  style={m.input}
                  value={cardNumber}
                  onChangeText={formatCardNumber}
                  placeholder="0000 0000 0000 0000"
                  keyboardType="number-pad"
                  maxLength={19}
                />

                <Text style={m.label}>Tên chủ thẻ</Text>
                <TextInput
                  style={m.input}
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  placeholder="VÍ DỤ: NGUYEN VAN A"
                  autoCapitalize="characters"
                />

                <Text style={m.label}>Ngày hết hạn (MM/YY)</Text>
                <TextInput
                  style={m.input}
                  value={expiryDate}
                  onChangeText={formatExpiry}
                  placeholder="MM/YY"
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            )}

            <TouchableOpacity style={m.saveBtn} onPress={handleSave}>
              <Text style={m.saveBtnText}>Lưu {type === 'bank' ? 'tài khoản' : 'thẻ'}</Text>
            </TouchableOpacity>
          </View>

          {/* Bank picker */}
          {showBankPicker && type === 'bank' && (
            <View style={m.bankPickerOverlay}>
              <View style={m.bankPickerSheet}>
                <View style={m.header}>
                  <Text style={m.title}>Chọn ngân hàng</Text>
                  <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                    <Ionicons name="close" size={22} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {BANKS.map(b => (
                    <TouchableOpacity key={b} style={m.bankItem} onPress={() => { setBankName(b); setShowBankPicker(false); }}>
                      <Text style={[m.bankItemText, bankName === b && { color: colors.primary, fontWeight: '700' }]}>{b}</Text>
                      {bankName === b && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PaymentMethodsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadMethods(); }, []);

  const loadMethods = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setMethods(JSON.parse(stored));
    } catch {}
  };

  const saveMethods = async (list: PaymentMethod[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setMethods(list);
    } catch {}
  };

  const handleAdd = (newMethod: PaymentMethod) => {
    const updated = [...methods, newMethod];
    saveMethods(updated);
    setShowAdd(false);
    Alert.alert('✅ Đã thêm', newMethod.type === 'bank' ? `Tài khoản ${newMethod.bankName} đã được lưu!` : `Thẻ tín dụng đã được lưu!`);
  };

  const handleSetDefault = (id: string) => {
    const updated = methods.map(m => ({ ...m, isDefault: m.id === id }));
    saveMethods(updated);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xóa', 'Bạn có chắc muốn xóa phương thức thanh toán này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => saveMethods(methods.filter(m => m.id !== id)) },
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tài khoản / Thẻ Ngân hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {methods.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="card-outline" size={60} color="#ddd" />
            <Text style={s.emptyText}>Chưa có tài khoản ngân hàng hoặc thẻ nào</Text>
            <Text style={s.emptySubText}>Thêm phương thức thanh toán để mua sắm nhanh hơn</Text>
          </View>
        ) : (
          methods.map(method => (
            <View key={method.id} style={s.card}>
              <View style={s.cardLeft}>
                <View style={[s.bankIcon, method.type === 'card' && { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name={method.type === 'bank' ? 'business' : 'card'} size={24} color={method.type === 'bank' ? colors.primary : '#0EA5E9'} />
                </View>
                <View style={s.cardInfo}>
                  {method.type === 'bank' ? (
                    <>
                      <Text style={s.bankName}>{method.bankName}</Text>
                      <Text style={s.accountNumber}>**** **** {method.accountNumber?.slice(-4)}</Text>
                      <Text style={s.accountHolder}>{method.accountName}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={s.bankName}>Thẻ Tín dụng/Ghi nợ</Text>
                      <Text style={s.accountNumber}>**** **** **** {method.cardNumber?.slice(-4)}</Text>
                      <Text style={s.accountHolder}>{method.cardHolder} - {method.expiryDate}</Text>
                    </>
                  )}
                </View>
              </View>
              <View style={s.cardActions}>
                {method.isDefault ? (
                  <View style={s.defaultBadge}><Text style={s.defaultBadgeText}>Mặc định</Text></View>
                ) : (
                  <TouchableOpacity onPress={() => handleSetDefault(method.id)}>
                    <Text style={s.setDefaultBtn}>Đặt mặc định</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(method.id)} style={s.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={s.addBtnText}>Thêm Phương thức thanh toán</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddPaymentModal visible={showAdd} onClose={() => setShowAdd(false)} onSave={handleAdd} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#333' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#666', fontWeight: '600', textAlign: 'center' },
  emptySubText: { fontSize: 13, color: '#aaa', textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankIcon: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  bankName: { fontSize: 15, fontWeight: '700', color: '#333' },
  accountNumber: { fontSize: 14, color: '#666', marginTop: 2 },
  accountHolder: { fontSize: 12, color: '#999', marginTop: 2, textTransform: 'uppercase' },
  cardActions: { alignItems: 'flex-end', gap: 8 },
  defaultBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  defaultBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  setDefaultBtn: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  deleteBtn: { padding: 4 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 16, borderWidth: 1.5, borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#333' },
  
  tabs: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  tabTextActive: { color: colors.primary },

  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6, marginTop: 14 },
  select: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fafafa',
  },
  selectText: { fontSize: 15, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#333', backgroundColor: '#fafafa',
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  bankPickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff' },
  bankPickerSheet: { flex: 1, padding: 20 },
  bankItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0',
  },
  bankItemText: { fontSize: 15, color: '#333' },
});
