import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import apiClient from '../../services/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { resolveProductImageUrl } from '../../utils/imageUtils';

export default function WriteReviewScreen({ navigation, route }: any) {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const insets = useSafeAreaInsets();

    const productId = route?.params?.productId;
    const orderId = route?.params?.orderId;
    const productName = route?.params?.productName || 'Sản phẩm';
    const productImageRaw = route?.params?.productImage;
    const productImage = productImageRaw ? resolveProductImageUrl(productImageRaw) : null;

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá!');
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post(`/products/${productId}/reviews`, {
                rating,
                review: review,
                orderId: orderId
            });

            // Mark as reviewed locally
            if (orderId && productId) {
                const key = `@reviewed_${orderId}_${productId}`;
                await AsyncStorage.setItem(key, 'true');
            }

            Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá sản phẩm!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    <View style={styles.productCard}>
                        {productImage ? (
                            <Image source={{ uri: productImage }} style={styles.prodImg} />
                        ) : (
                            <View style={styles.imgMock}><Ionicons name="cube-outline" size={24} color={colors.textMuted} /></View>
                        )}
                        <Text style={styles.productTitle} numberOfLines={2}>{productName}</Text>
                    </View>

                    <View style={styles.ratingSection}>
                        <Text style={styles.ratingLabel}>Chất lượng sản phẩm tuyệt vời?</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Ionicons
                                        name={star <= rating ? "star" : "star-outline"}
                                        size={44}
                                        color={star <= rating ? colors.warning : colors.disabled}
                                        style={{ marginHorizontal: 6 }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.ratingHint}>
                            {rating === 1 ? 'Tệ' : rating === 2 ? 'Không hài lòng' : rating === 3 ? 'Bình thường' : rating === 4 ? 'Hài lòng' : rating === 5 ? 'Tuyệt vời' : 'Vui lòng chọn sao'}
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            textAlignVertical="top"
                            value={review}
                            onChangeText={setReview}
                        />
                        <View style={styles.addMediaBtn}>
                            <Ionicons name="camera-outline" size={24} color={colors.primary} />
                            <Text style={styles.addMediaText}>Thêm Hình/Video</Text>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <View style={styles.bottomBar}>
                <TouchableOpacity 
                    style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitBtnText}>{isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm, zIndex: 10 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: spacing.md },
    productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 12, borderRadius: borderRadius.md, ...shadow.sm, marginBottom: 20 },
    prodImg: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
    imgMock: { width: 48, height: 48, backgroundColor: colors.borderLight, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    productTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },

    ratingSection: { alignItems: 'center', marginBottom: 24, paddingVertical: 16, backgroundColor: colors.white, borderRadius: borderRadius.md, ...shadow.sm },
    ratingLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    starsRow: { flexDirection: 'row', justifyContent: 'center' },
    ratingHint: { fontSize: 14, color: colors.warning, fontWeight: '600', marginTop: 12 },

    inputContainer: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 12, ...shadow.sm },
    textInput: { height: 120, fontSize: 15, color: colors.text, lineHeight: 22 },
    addMediaBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary, borderRadius: borderRadius.sm, marginTop: 12 },
    addMediaText: { color: colors.primary, fontWeight: '600', fontSize: 14, marginLeft: 6 },

    bottomBar: { padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight },
    submitBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.md, alignItems: 'center' },
    submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' }
});
