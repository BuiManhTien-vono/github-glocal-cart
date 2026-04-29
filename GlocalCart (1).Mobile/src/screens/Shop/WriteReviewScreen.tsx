import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function WriteReviewScreen({ navigation, route }: any) {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    const productName = route?.params?.productName || 'MacBook Pro M2 2023 - Gray 512GB';

    const handleSubmit = () => {
        if (rating === 0) {
            if (Platform.OS === 'web') window.alert('Vui lòng chọn số sao đánh giá!');
            return;
        }
        if (Platform.OS === 'web') {
            window.alert('✅ Đã gửi đánh giá thành công. Cảm ơn phản hồi của bạn!');
        }
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={styles.content}>
                    <View style={styles.productCard}>
                        <View style={styles.imgMock}><Text style={{ fontSize: 24 }}>💻</Text></View>
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
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.submitBtnText}>Gửi Đánh Giá</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm, zIndex: 10 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: spacing.md },
    productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 12, borderRadius: borderRadius.md, ...shadow.sm, marginBottom: 20 },
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
