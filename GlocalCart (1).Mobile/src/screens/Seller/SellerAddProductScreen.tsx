import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Image, Alert, ActivityIndicator, Modal, FlatList, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';

const MAX_IMAGES = 5;

interface CategoryItem {
  id: number;
  name: string;
  description?: string;
  subCategories?: CategoryItem[];
}

interface PickedImage {
  uri: string;
  fileName: string;
  mimeType: string;
}

export default function SellerAddProductScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      const cats = Array.isArray(res) ? res : (res as any)?.data ?? [];
      // Flatten categories for easy picker
      const flat: CategoryItem[] = [];
      const flatten = (list: CategoryItem[], prefix = '') => {
        list.forEach(c => {
          flat.push({ ...c, name: prefix + c.name });
          if (c.subCategories?.length) flatten(c.subCategories, prefix + '  ');
        });
      };
      flatten(cats);
      setCategories(flat);
    } catch {
      // Fallback mock categories
      setCategories([
        { id: 1, name: 'Điện tử' },
        { id: 6, name: '  Điện thoại' },
        { id: 7, name: '  Laptop' },
        { id: 8, name: '  Phụ kiện điện tử' },
        { id: 2, name: 'Thời trang' },
        { id: 9, name: '  Áo' },
        { id: 10, name: '  Quần' },
        { id: 3, name: 'Gia dụng' },
        { id: 4, name: 'Sách & Văn phòng phẩm' },
        { id: 5, name: 'Sức khỏe & Làm đẹp' },
      ]);
    }
  };

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Giới hạn', `Tối đa ${MAX_IMAGES} ảnh cho mỗi sản phẩm.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages: PickedImage[] = result.assets.map(a => ({
        uri: a.uri,
        fileName: a.fileName || `img_${Date.now()}.jpg`,
        mimeType: a.mimeType || 'image/jpeg',
      }));
      setImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Vui lòng nhập tên sản phẩm.';
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
      return 'Vui lòng nhập giá hợp lệ.';
    if (!stock.trim() || isNaN(Number(stock)) || Number(stock) < 0)
      return 'Vui lòng nhập số lượng tồn kho.';
    if (!categoryId) return 'Vui lòng chọn danh mục.';
    if (images.length === 0) return 'Vui lòng chọn ít nhất 1 ảnh sản phẩm.';
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Thiếu thông tin', error);
      return;
    }

    setLoading(true);
    try {
      setUploadProgress('Đang đăng sản phẩm...');

      // Gửi 1 request multipart form-data tới POST /products/with-images
      // Backend sẽ nén ảnh sang WebP và lưu trực tiếp vào DB
      const formData = new FormData();
      formData.append('Name', name.trim());
      formData.append('Description', description.trim() || '');
      formData.append('Price', String(Number(price)));
      formData.append('AvailableItemCount', String(Number(stock)));
      formData.append('CategoryId', String(categoryId));

      // Đính kèm file ảnh
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(`Đang xử lý ảnh ${i + 1}/${images.length}...`);
        const img = images[i];
        const fileObj: any = {
          uri: img.uri,
          name: img.fileName,
          type: img.mimeType,
        };
        formData.append('Images', fileObj);
      }

      setUploadProgress('Đang tải lên máy chủ...');
      await apiClient.post('/products/with-images', formData, {
        timeout: 60000, // 60s cho upload ảnh
      });

      Alert.alert('Thành công! 🎉', 'Sản phẩm đã được đăng bán.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.log('[CreateProduct Error]', err);
      Alert.alert('Lỗi', err?.message || 'Không thể tạo sản phẩm. Thử lại sau.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const formatPrice = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    setPrice(num);
  };

  const displayPrice = price
    ? Number(price).toLocaleString('vi-VN') + 'đ'
    : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm Sản Phẩm</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Image Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Ảnh sản phẩm</Text>
            <Text style={styles.sectionBadge}>{images.length}/{MAX_IMAGES}</Text>
          </View>
          <Text style={styles.sectionHint}>Ảnh đầu tiên sẽ là ảnh bìa. Tối đa {MAX_IMAGES} ảnh.</Text>

          <View style={styles.imageGrid}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Bìa</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="camera-outline" size={28} color={colors.primary} />
                <Text style={styles.addImageText}>Thêm ảnh</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Product Info ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
          </View>

          {/* Name */}
          <Text style={styles.label}>Tên sản phẩm <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên sản phẩm (VD: MacBook Pro M2 2023)"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={300}
          />
          <Text style={styles.charCount}>{name.length}/300</Text>

          {/* Description */}
          <Text style={styles.label}>Mô tả sản phẩm</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả chi tiết về sản phẩm, thông số kỹ thuật..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/2000</Text>
        </View>

        {/* ── Price & Stock ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Giá & Kho hàng</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Giá bán <Text style={styles.required}>*</Text></Text>
              <View style={styles.priceInputWrap}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={price}
                  onChangeText={formatPrice}
                  keyboardType="numeric"
                />
                <Text style={styles.currencyLabel}>VNĐ</Text>
              </View>
              {displayPrice ? (
                <Text style={styles.pricePreview}>{displayPrice}</Text>
              ) : null}
            </View>

            <View style={styles.halfCol}>
              <Text style={styles.label}>Tồn kho <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={stock}
                onChangeText={t => setStock(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* ── Category ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Danh mục</Text>
          </View>

          <Text style={styles.label}>Danh mục sản phẩm <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.categoryPicker}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[
              styles.categoryPickerText,
              !categoryId && { color: colors.textMuted },
            ]}>
              {categoryName || 'Chọn danh mục...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Spacer for submit button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Submit Button ── */}
      <View style={[styles.submitContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.submitText}>{uploadProgress || 'Đang xử lý...'}</Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.white} />
              <Text style={styles.submitText}>Đăng Sản Phẩm</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Category Modal ── */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.catItem,
                    categoryId === item.id && styles.catItemActive,
                  ]}
                  onPress={() => {
                    setCategoryId(item.id);
                    setCategoryName(item.name.trim());
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[
                    styles.catItemText,
                    categoryId === item.id && styles.catItemTextActive,
                  ]}>
                    {item.name}
                  </Text>
                  {categoryId === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 12,
    backgroundColor: colors.white, ...shadow.sm,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scrollContent: { padding: 16 },

  // Sections
  section: {
    backgroundColor: colors.white, borderRadius: borderRadius.md,
    padding: 16, marginBottom: 12, ...shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginLeft: 8, flex: 1 },
  sectionBadge: {
    backgroundColor: colors.primary + '15', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 12, fontSize: 12, fontWeight: '600', color: colors.primary,
    overflow: 'hidden',
  },
  sectionHint: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },

  // Images
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageItem: { width: 90, height: 90, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: '100%', borderRadius: 10 },
  mainBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.primary, paddingVertical: 2, alignItems: 'center',
  },
  mainBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  removeBtn: {
    position: 'absolute', top: -2, right: -2, backgroundColor: colors.white,
    borderRadius: 11, width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  addImageBtn: {
    width: 90, height: 90, borderRadius: 10, borderWidth: 1.5,
    borderColor: colors.primary + '40', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryBg,
  },
  addImageText: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 4 },

  // Form
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  required: { color: colors.danger },
  input: {
    backgroundColor: colors.background, borderRadius: borderRadius.sm,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: colors.text, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: -4, marginBottom: 8 },

  // Price
  row: { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencyLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  pricePreview: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 4 },

  // Category picker
  categoryPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.background, borderRadius: borderRadius.sm,
    paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: colors.borderLight,
  },
  categoryPickerText: { fontSize: 15, color: colors.text, flex: 1 },

  // Submit
  submitContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.borderLight, ...shadow.md,
  },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  submitBtnDisabled: { backgroundColor: colors.disabled },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '60%', paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  catItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  catItemActive: { backgroundColor: colors.primaryBg },
  catItemText: { fontSize: 15, color: colors.text },
  catItemTextActive: { color: colors.primary, fontWeight: '600' },
});
