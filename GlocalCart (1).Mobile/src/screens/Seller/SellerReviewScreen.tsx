import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

const MOCK_REVIEWS = [
    { id: '1', buyer: 'Nguyễn Văn A', rating: 5, product: 'MacBook Pro M2', comment: 'Sản phẩm tuyệt vời, đúng mô tả, giao hàng nhanh!', date: '19/10/2026', avatar: 'https://ui-avatars.com/api/?name=A&background=FF6B35&color=fff&size=40' },
    { id: '2', buyer: 'Trần Thị B', rating: 4, product: 'Chuột Logitech MX', comment: 'Hàng chính hãng, đóng gói cênt thận. Giao hàng hơi chậm.', date: '18/10/2026', avatar: 'https://ui-avatars.com/api/?name=B&background=3B82F6&color=fff&size=40' },
    { id: '3', buyer: 'Lê Văn C', rating: 5, product: 'iPad Air M1', comment: 'Shop uy tín, sản phẩm chất lượng, tư vấn nhiệt tình!', date: '17/10/2026', avatar: 'https://ui-avatars.com/api/?name=C&background=10B981&color=fff&size=40' },
    { id: '4', buyer: 'Phạm Thị D', rating: 3, product: 'Bàn phím Keychron', comment: 'Sản phẩm ổn nhưng giao hàng hơi lâu so với dự kiến.', date: '16/10/2026', avatar: 'https://ui-avatars.com/api/?name=D&background=8B5CF6&color=fff&size=40' },
    { id: '5', buyer: 'Hoàng Văn E', rating: 5, product: 'Tai nghe Sony WH', comment: 'Chất lượng âm thanh cực tốt! Sẽ mua lại lần sau.', date: '15/10/2026', avatar: 'https://ui-avatars.com/api/?name=E&background=F59E0B&color=fff&size=40' },
];

const TABS = ['Tất cả', '5 sao', '4 sao', '3 sao', '1-2 sao'];

export default function SellerReviewScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('Tất cả');

    const avgRating = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);
    const ratingDist = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: MOCK_REVIEWS.filter(r => r.rating === star).length,
    }));

    const filtered = activeTab === 'Tất cả'
        ? MOCK_REVIEWS
        : activeTab === '1-2 sao'
            ? MOCK_REVIEWS.filter(r => r.rating <= 2)
            : MOCK_REVIEWS.filter(r => r.rating === parseInt(activeTab));

    const renderReview = ({ item }: any) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewTop}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.buyerName}>{item.buyer}</Text>
                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={13} color="#FFD700" />
                        ))}
                        <Text style={styles.reviewDate}>{item.date}</Text>
                    </View>
                </View>
            </View>
            <Text style={styles.productLabel}>Sản phẩm: {item.product}</Text>
            <Text style={styles.reviewComment}>{item.comment}</Text>
            <TouchableOpacity style={styles.replyBtn}>
                <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
                <Text style={styles.replyText}>Phản hồi</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đánh giá Shop</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryLeft}>
                    <Text style={styles.avgScore}>{avgRating}</Text>
                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Ionicons key={s} name={s <= Math.round(parseFloat(avgRating)) ? 'star' : 'star-outline'} size={18} color="#FFD700" />
                        ))}
                    </View>
                    <Text style={styles.totalReviews}>{MOCK_REVIEWS.length} đánh giá</Text>
                </View>
                <View style={styles.summaryRight}>
                    {ratingDist.map(({ star, count }) => (
                        <View key={star} style={styles.barRow}>
                            <Text style={styles.barLabel}>{star}★</Text>
                            <View style={styles.barBg}>
                                <View style={[styles.barFill, { width: `${(count / MOCK_REVIEWS.length) * 100}%` as any }]} />
                            </View>
                            <Text style={styles.barCount}>{count}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Filter tabs */}
            <View style={styles.tabsWrap}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filtered}
                renderItem={renderReview}
                keyExtractor={i => i.id}
                contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', padding: 40 }}>
                        <Ionicons name="star-outline" size={56} color={colors.border} />
                        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Chưa có đánh giá nào.</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

    summaryCard: { flexDirection: 'row', backgroundColor: colors.white, margin: 12, borderRadius: 14, padding: 16, gap: 16, ...shadow.sm },
    summaryLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
    avgScore: { fontSize: 40, fontWeight: '900', color: colors.text, lineHeight: 44 },
    totalReviews: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
    summaryRight: { flex: 1, justifyContent: 'center', gap: 5 },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    barLabel: { fontSize: 11, color: colors.textSecondary, width: 22, textAlign: 'right' },
    barBg: { flex: 1, height: 6, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
    barCount: { fontSize: 11, color: colors.textSecondary, width: 16 },

    stars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },

    tabsWrap: { flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexWrap: 'wrap' },
    tabChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderLight },
    tabChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
    tabChipTextActive: { color: '#fff', fontWeight: '700' },

    reviewCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 14, marginBottom: 10, ...shadow.sm },
    reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    avatar: { width: 38, height: 38, borderRadius: 19 },
    buyerName: { fontSize: 14, fontWeight: '700', color: colors.text },
    reviewDate: { fontSize: 11, color: colors.textMuted, marginLeft: 8 },
    productLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontStyle: 'italic' },
    reviewComment: { fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 10 },
    replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: colors.primaryBg },
    replyText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});
