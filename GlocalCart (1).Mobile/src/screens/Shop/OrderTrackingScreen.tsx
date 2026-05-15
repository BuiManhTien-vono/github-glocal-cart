import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface OrderStep {
  status: string;
  time: string;
  description?: string;
  isDone: boolean;
  isCurrent: boolean;
}

const MOCK_STEPS: OrderStep[] = [
  { status: 'Đặt hàng thành công', time: '08:00 15-05-26', description: 'Đơn hàng của bạn đã được đặt.', isDone: true, isCurrent: false },
  { status: 'Đã xác nhận', time: '08:30 15-05-26', description: 'Người bán đã xác nhận đơn hàng.', isDone: true, isCurrent: false },
  { status: 'Đang chuẩn bị hàng', time: '10:00 15-05-26', description: 'Người bán đang đóng gói sản phẩm.', isDone: true, isCurrent: false },
  { status: 'Đang giao hàng', time: '14:00 15-05-26', description: 'Đơn hàng đang trên đường giao đến bạn.', isDone: false, isCurrent: true },
  { status: 'Giao thành công', time: '', description: '', isDone: false, isCurrent: false },
];

export default function OrderTrackingScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { notification, orderUpdate } = route?.params || {};

  const title = notification?.title || orderUpdate?.title || 'Cập nhật đơn hàng';
  const orderId = notification?.orderId || 'ORD-26041618Q1RX22';
  const steps = orderUpdate?.history
    ? buildStepsFromHistory(orderUpdate.history, orderUpdate.title)
    : MOCK_STEPS;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Order ID */}
        <View style={s.orderIdCard}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
          <Text style={s.orderId}>Mã đơn: {orderId}</Text>
        </View>

        {/* Status banner */}
        <View style={s.statusBanner}>
          <Ionicons name="cube-outline" size={24} color={colors.primary} />
          <Text style={s.statusText}>{title}</Text>
        </View>

        {/* Timeline */}
        <View style={s.timeline}>
          <Text style={s.timelineTitle}>Lịch sử vận chuyển</Text>

          {steps.map((step, idx) => (
            <View key={idx} style={s.stepRow}>
              {/* Line + dot */}
              <View style={s.lineCol}>
                {idx > 0 && (
                  <View style={[s.lineTop, step.isDone || step.isCurrent ? s.lineActive : s.lineInactive]} />
                )}
                <View style={[s.dot, step.isCurrent ? s.dotCurrent : step.isDone ? s.dotDone : s.dotPending]}>
                  {(step.isDone || step.isCurrent) && (
                    <Ionicons
                      name={step.isDone ? 'checkmark' : 'ellipse'}
                      size={step.isDone ? 10 : 8}
                      color="#fff"
                    />
                  )}
                </View>
                {idx < steps.length - 1 && (
                  <View style={[s.lineBottom, step.isDone ? s.lineActive : s.lineInactive]} />
                )}
              </View>

              {/* Content */}
              <View style={s.stepContent}>
                <Text style={[s.stepStatus, (step.isDone || step.isCurrent) && s.stepStatusActive]}>
                  {step.status}
                </Text>
                {step.description ? (
                  <Text style={s.stepDesc}>{step.description}</Text>
                ) : null}
                {step.time ? (
                  <Text style={s.stepTime}>{step.time}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function buildStepsFromHistory(history: any[], currentTitle: string): OrderStep[] {
  const steps: OrderStep[] = history.map((h: any, idx: number) => ({
    status: h.title,
    time: h.time || '',
    description: h.body || '',
    isDone: idx > 0,
    isCurrent: idx === 0,
  }));
  return steps;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 12 },

  orderIdCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16,
    padding: 14, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  orderId: { fontSize: 14, color: '#333', fontWeight: '600' },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF5F5', marginTop: 10, marginHorizontal: 16,
    padding: 16, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  statusText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.primary },

  timeline: {
    backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16,
    borderRadius: 10, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 20 },

  stepRow: { flexDirection: 'row', minHeight: 60 },
  lineCol: { width: 30, alignItems: 'center' },
  lineTop: { width: 2, flex: 1, maxHeight: 10, marginBottom: 0 },
  lineBottom: { width: 2, flex: 1, marginTop: 0 },
  lineActive: { backgroundColor: colors.primary },
  lineInactive: { backgroundColor: '#ddd' },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  dotDone: { backgroundColor: colors.primary },
  dotCurrent: { backgroundColor: colors.primary, width: 22, height: 22, borderRadius: 11 },
  dotPending: { backgroundColor: '#ddd', borderWidth: 1.5, borderColor: '#bbb' },

  stepContent: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
  stepStatus: { fontSize: 14, fontWeight: '600', color: '#999' },
  stepStatusActive: { color: '#333' },
  stepDesc: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 19 },
  stepTime: { fontSize: 12, color: '#aaa', marginTop: 4 },
});
