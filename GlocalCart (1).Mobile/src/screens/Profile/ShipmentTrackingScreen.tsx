import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

export default function ShipmentTrackingScreen({ navigation }: any) {
    const trackingData = [
        { id: '1', title: 'Đang giao hàng', desc: 'Đơn hàng đang được shipper giao đến bạn.', time: '14:30 19-10-2026', isLast: true, isActive: true },
        { id: '2', title: 'Đã xuất kho phân loại', desc: 'Đơn hàng đã rời kho phân loại TP.HCM.', time: '08:15 19-10-2026', isLast: false, isActive: false },
        { id: '3', title: 'Đã đến kho phân loại', desc: 'Đơn hàng đã đến trạm trung chuyển khu vực.', time: '22:10 18-10-2026', isLast: false, isActive: false },
        { id: '4', title: 'Lấy hàng thành công', desc: 'Đơn vị vận chuyển đã lấy hàng từ người bán.', time: '15:00 18-10-2026', isLast: false, isActive: false },
        { id: '5', title: 'Đơn hàng đã tạo', desc: 'Người bán đang chuẩn bị đơn hàng của bạn.', time: '09:00 18-10-2026', isLast: false, isActive: false },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông tin vận chuyển</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.topInfoCard}>
                    <Ionicons name="car" size={40} color={colors.primary} />
                    <View style={{ marginLeft: 16 }}>
                        <Text style={styles.carrier}>Giao Hàng Nhanh</Text>
                        <Text style={styles.trackingNo}>Mã vận đơn: <Text style={{ fontWeight: '700' }}>GHN20260011</Text></Text>
                        <Text style={styles.copyBtn}>SAO CHÉP</Text>
                    </View>
                </View>

                <View style={styles.timelineCard}>
                    {trackingData.map((item, index) => (
                        <View key={item.id} style={styles.timelineRow}>
                            {/* Cột hiển thị dây chuyền */}
                            <View style={styles.timelineLeft}>
                                <View style={[styles.timelineDot, item.isActive && styles.timelineDotActive]} />
                                {index !== trackingData.length - 1 && (
                                    <View style={[styles.timelineLine, item.isActive && styles.timelineLineActive]} />
                                )}
                            </View>

                            {/* Nội dung điểm thời gian */}
                            <View style={styles.timelineContent}>
                                <Text style={[styles.timelineTitle, item.isActive && styles.timelineTitleActive]}>{item.title}</Text>
                                <Text style={styles.timelineDesc}>{item.desc}</Text>
                                <Text style={styles.timelineTime}>{item.time}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm, marginBottom: 8 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    scrollContent: { padding: 12 },

    topInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 16, borderRadius: borderRadius.md, ...shadow.sm, marginBottom: 12 },
    carrier: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    trackingNo: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
    copyBtn: { fontSize: 12, fontWeight: '700', color: colors.secondary },

    timelineCard: { backgroundColor: colors.white, padding: 20, borderRadius: borderRadius.md, ...shadow.sm },
    timelineRow: { flexDirection: 'row' },
    timelineLeft: { alignItems: 'center', width: 30 },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border, zIndex: 2 },
    timelineDotActive: { backgroundColor: colors.success, width: 16, height: 16, borderRadius: 8 },
    timelineLine: { width: 2, flex: 1, backgroundColor: colors.borderLight, marginVertical: -4 },
    timelineLineActive: { backgroundColor: colors.success + '50' },

    timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 24, marginTop: -4 },
    timelineTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
    timelineTitleActive: { color: colors.success, fontWeight: '700' },
    timelineDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 6, lineHeight: 20 },
    timelineTime: { fontSize: 12, color: colors.textMuted },
});
