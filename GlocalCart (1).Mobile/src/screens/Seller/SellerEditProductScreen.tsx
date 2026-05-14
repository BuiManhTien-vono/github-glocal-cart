import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Image, Alert, ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import { resolveProductImageUrl } from '../../utils/imageUtils';

const MAX_IMAGES = 5;

interface CategoryItem {
  id: number;
  name: string;
  description?: string;
  subCategories?: CategoryItem[];
}

interface PickedImage {
  uri: string; // URL dùng để hiển thị (absolute)
  originalUrl?: string; // URL gốc từ server (thường là relative)
  fileName: string;
  mimeType: string;
  isExisting?: boolean;
}

export default function SellerEditProductScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { productId, product: initialProduct } = route.params || {};

  // Form state
  const [name, setName] = useState(initialProduct?.name || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [price, setPrice] = useState(initialProduct?.price ? String(initialProduct.price) : '');
  const [stock, setStock] = useState(
    initialProduct?.availableItemCount != null ? String(initialProduct.availableItemCount)
      : initialProduct?.stock != null ? String(initialProduct.stock) : ''
  );
  const [categoryId, setCategoryId] = useState<number | null>(initialProduct?.categoryId || null);
  const [categoryName, setCategoryName] = useState(initialProduct?.categoryName || '');
  const [images, setImages] = useState<PickedImage[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    loadCategories();
    if (productId || initialProduct?.id) {
        fetchProductData(productId || initialProduct.id);
    }
  }, []);

  const fetchProductData = async (id: number) => {
    setLoadingProduct(true);
    try {
        const res = await apiClient.get(`/products/${id}`) as any;
        if (res) {
            setName(res.name || '');
            setDescription(res.description || '');
            setPrice(res.price != null ? String(res.price) : '');
            setStock(res.availableItemCount != null ? String(res.availableItemCount) : '');
            setCategoryId(res.categoryId || null);
            setCategoryName(res.categoryName || '');
            
            // Sync images - Check all possible image fields from API
            const existingImages: PickedImage[] = [];
            
            // 1. Check imageUrls (string array)
            if (res.imageUrls && Array.isArray(res.imageUrls)) {
                res.imageUrls.forEach((url: string, i: number) => {
                    if (url && !url.includes('placeholder')) {
                        const resolved = resolveProductImageUrl(url);
                        if (resolved) {
                            existingImages.push({
                                uri: resolved,
                                originalUrl: url,
                                fileName: `existing_url_${i}.webp`,
                                mimeType: 'image/webp',
                                isExisting: true,
                            });
                        }
                    }
                });
            }
            
            if (res.images && Array.isArray(res.images)) {
                res.images.forEach((img: any, i: number) => {
                    const url = img.imageUrl || img.url;
                    if (url && !url.includes('placeholder')) {
                        const resolved = resolveProductImageUrl(url);
                        if (resolved && !existingImages.find(ei => ei.originalUrl === url)) {
                            existingImages.push({
                                uri: resolved,
                                originalUrl: url,
                                fileName: `existing_img_${img.id || i}.webp`,
                                mimeType: 'image/webp',
                                isExisting: true,
                            });
                        }
                    }
                });
            }

            if (existingImages.length === 0 && res.mediaUrl && !res.mediaUrl.includes('placeholder')) {
                const resolved = resolveProductImageUrl(res.mediaUrl);
                if (resolved) {
                    existingImages.push({
                        uri: resolved,
                        originalUrl: res.mediaUrl,
                        fileName: 'existing_main.webp',
                        mimeType: 'image/webp',
                        isExisting: true,
                    });
                }
            }
            setImages(existingImages);
        }
    } catch (err) {
        console.warn('Fetch product error:', err);
        Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm từ máy chủ.');
    } finally {
        setLoadingProduct(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      const cats = Array.isArray(res) ? res : (res as any)?.data ?? [];
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
      // Fallback categories if API fails
      setCategories([{ id: 1, name: 'Điện tử' }, { id: 2, name: 'Thời trang' }]);
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
      quality: 0.7,
    });
    if (!result.canceled && result.assets) {
      const newImages: PickedImage[] = result.assets.map(a => ({
        uri: a.uri,
        fileName: a.fileName || `img_${Date.now()}.jpg`,
        mimeType: a.mimeType || 'image/jpeg',
        isExisting: false,
      }));
      setImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingleImage = async (img: PickedImage): Promise<string> => {
    const formData = new FormData();
    // React Native fetch FormData cần uri chuẩn trên iOS và Android
    const formattedUri = Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri;
    const fileObj: any = { uri: formattedUri, name: img.fileName || 'upload.webp', type: img.mimeType || 'image/jpeg' };
    
    formData.append('file', fileObj);
    formData.append('folderName', 'products');
    
    const token = await require('../../utils/secureStore').getSecureItem('auth_token');
    const response = await fetch(`${apiClient.defaults.baseURL}/upload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
        const errText = await response.text();
        console.error('[Upload Error]', response.status, errText);
        throw new Error(`Upload failed (${response.status}): ${errText}`);
    }
    
    const res = await response.json();
    return res?.data?.relativeUrl || res?.data?.url || res?.relativeUrl || res?.url || '';
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Vui lòng nhập tên sản phẩm.';
    if (!price.trim() || isNaN(Number(price))) return 'Vui lòng nhập giá hợp lệ.';
    if (!stock.trim() || isNaN(Number(stock))) return 'Vui lòng nhập số lượng tồn kho.';
    if (!categoryId) return 'Vui lòng chọn danh mục.';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { Alert.alert('Thiếu thông tin', error); return; }

    setLoading(true);
    try {
      const newImages = images.filter(img => !img.isExisting);
      const existingPaths = images.filter(img => img.isExisting).map(img => img.originalUrl || img.uri);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < newImages.length; i++) {
        setUploadProgress(`Đang tải ảnh ${i + 1}/${newImages.length}...`);
        const url = await uploadSingleImage(newImages[i]);
        if (url) uploadedUrls.push(url);
      }

      const allImageUrls = [...existingPaths, ...uploadedUrls];
      setUploadProgress('Đang lưu vào hệ thống...');

      const dto: any = {
        Name: name.trim(),
        Description: description.trim() || "",
        Price: Number(price),
        AvailableItemCount: Number(stock),
        CategoryId: categoryId,
        MediaUrl: allImageUrls.length > 0 ? allImageUrls[0] : "",
        ImageUrls: allImageUrls.length > 0 ? allImageUrls : [],
      };

      const id = productId || initialProduct?.id;
      await apiClient.put(`/products/${id}`, dto);
      
      Alert.alert('Thành công', 'Sản phẩm đã được lưu vào database.', [
        { text: 'Xong', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('[UpdateProduct Error]', err);
      Alert.alert('Lỗi', 'Không thể lưu thay đổi. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  if (loadingProduct) {
    return (
        <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textSecondary }}>Đang tải dữ liệu sản phẩm...</Text>
        </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa sản phẩm</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Image Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Ảnh sản phẩm</Text>
              <Text style={styles.sectionBadge}>{images.length}/{MAX_IMAGES}</Text>
            </View>
            <View style={styles.imageGrid}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
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
            {images.length === 0 && (
                <View style={styles.emptyInfo}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
                    <Text style={styles.emptyText}>Sản phẩm sẽ hiển thị với ảnh mặc định (placeholder).</Text>
                </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.section}>
            <Text style={styles.label}>Tên sản phẩm *</Text>
            <TextInput style={styles.input} placeholder="Tên sản phẩm..." value={name} onChangeText={setName} />
            
            <Text style={styles.label}>Mô tả</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Nhập mô tả hoặc để trống để xóa..." 
                value={description} 
                onChangeText={setDescription} 
                multiline
            />
          </View>

          {/* Price & Stock */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Giá bán *</Text>
                <TextInput style={styles.input} placeholder="0" value={price} onChangeText={setPrice} keyboardType="numeric" />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Tồn kho *</Text>
                <TextInput style={styles.input} placeholder="0" value={stock} onChangeText={setStock} keyboardType="numeric" />
              </View>
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Danh mục *</Text>
            <TouchableOpacity style={styles.categoryPicker} onPress={() => setShowCategoryModal(true)}>
              <Text style={[styles.categoryPickerText, !categoryId && { color: colors.textMuted }]}>
                {categoryName || 'Chọn danh mục...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.submitContainer}>
          <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Lưu Database</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}><Ionicons name="close" size={24} /></TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.catItem}
                  onPress={() => { setCategoryId(item.id); setCategoryName(item.name.trim()); setShowCategoryModal(false); }}
                >
                  <Text>{item.name}</Text>
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
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16 },
  section: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 16, marginBottom: 12, ...shadow.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8, flex: 1 },
  sectionBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 11, color: colors.primary },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageItem: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: -2, right: -2 },
  addImageBtn: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addImageText: { fontSize: 10, color: colors.primary, marginTop: 4 },
  emptyInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  emptyText: { fontSize: 12, color: colors.warning, fontStyle: 'italic' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: colors.background, borderRadius: borderRadius.sm, padding: 12, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },
  categoryPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: borderRadius.sm, padding: 14, borderWidth: 1, borderColor: colors.borderLight },
  categoryPickerText: { fontSize: 15 },
  submitContainer: { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight },
  submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  catItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
});
