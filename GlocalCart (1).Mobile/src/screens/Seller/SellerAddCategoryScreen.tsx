import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Alert, ActivityIndicator, Image, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';

interface PickedImage {
  uri: string;
  fileName: string;
  mimeType: string;
}

export default function SellerAddCategoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [parentName, setParentName] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [showParentModal, setShowParentModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      const cats = Array.isArray(res) ? res : (res as any)?.data ?? [];
      const flat: any[] = [];
      const flatten = (list: any[], prefix = '') => {
        list.forEach(c => {
          flat.push({ ...c, name: prefix + c.name });
          if (c.subCategories?.length) flatten(c.subCategories, prefix + '  ');
        });
      };
      flatten(cats);
      setCategories(flat);
    } catch {
      setCategories([]);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setImage({ uri: a.uri, fileName: a.fileName || `cat_${Date.now()}.jpg`, mimeType: a.mimeType || 'image/jpeg' });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên danh mục.');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = '';
      if (image) {
        const formData = new FormData();
        formData.append('file', { uri: image.uri, name: image.fileName, type: image.mimeType } as any);
        formData.append('folderName', 'categories');
        const uploadRes = await apiClient.post('/upload', formData, { timeout: 30000 });
        imageUrl = (uploadRes as any)?.url || (uploadRes as any)?.relativeUrl || '';
      }

      const dto: any = {
        name: name.trim(),
        description: description.trim() || null,
        parentCategoryId: parentId || null,
      };
      if (imageUrl) dto.imageUrl = imageUrl;

      await apiClient.post('/categories', dto, { timeout: 30000 });
      Alert.alert('Thành công! ✅', 'Danh mục đã được tạo.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.log('[AddCategory Error]', err);
      Alert.alert('Lỗi', err?.message || 'Không thể tạo danh mục. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm danh mục</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Image picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Ảnh danh mục</Text>
          </View>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.pickedImage} />
            ) : (
              <View style={styles.imagePickerInner}>
                <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                <Text style={styles.imagePickerText}>Chọn ảnh</Text>
              </View>
            )}
          </TouchableOpacity>
          {image && (
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.removeImageText}>Xóa ảnh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Thông tin danh mục</Text>
          </View>

          <Text style={styles.label}>Tên danh mục <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Điện tử, Thời trang..."
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />

          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả ngắn về danh mục..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Danh mục cha (tuỳ chọn)</Text>
          <TouchableOpacity style={styles.categoryPicker} onPress={() => setShowParentModal(true)}>
            <Text style={[styles.categoryPickerText, !parentId && { color: colors.textMuted }]}>
              {parentName || 'Không có (danh mục gốc)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save button */}
      <View style={[styles.submitContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.submitText}>Đang tạo danh mục...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={22} color={colors.white} />
              <Text style={styles.submitText}>Tạo Danh Mục</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Parent category modal */}
      <Modal visible={showParentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục cha</Text>
              <TouchableOpacity onPress={() => setShowParentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: null, name: 'Không có (danh mục gốc)' }, ...categories]}
              keyExtractor={(item, i) => String(item.id ?? `root_${i}`)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.catItem, parentId === item.id && styles.catItemActive]}
                  onPress={() => { setParentId(item.id); setParentName(item.name.trim()); setShowParentModal(false); }}
                >
                  <Text style={[styles.catItemText, parentId === item.id && styles.catItemTextActive]}>{item.name}</Text>
                  {parentId === item.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scrollContent: { padding: 16 },

  section: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 16, marginBottom: 12, ...shadow.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginLeft: 8, flex: 1 },

  imagePicker: { width: 110, height: 110, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderLight, borderStyle: 'dashed', overflow: 'hidden', alignSelf: 'center' },
  imagePickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  imagePickerText: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  pickedImage: { width: '100%', height: '100%' },
  removeImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.danger + '10' },
  removeImageText: { fontSize: 12, color: colors.danger, fontWeight: '600' },

  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  required: { color: colors.danger },
  input: { backgroundColor: colors.background, borderRadius: borderRadius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight },
  textArea: { height: 90, textAlignVertical: 'top' },

  categoryPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: borderRadius.sm, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: colors.borderLight },
  categoryPickerText: { fontSize: 15, color: colors.text, flex: 1 },

  submitContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight, ...shadow.md },
  submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnDisabled: { backgroundColor: colors.disabled },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingTop: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  catItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  catItemActive: { backgroundColor: colors.primaryBg },
  catItemText: { fontSize: 15, color: colors.text },
  catItemTextActive: { color: colors.primary, fontWeight: '600' },
});
