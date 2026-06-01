import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';
import { paymentApi } from '../../services/api/paymentApi';

const POLL_INTERVAL = 5000; // 5 seconds
const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes

export default function PaymentWaitingScreen({ navigation, route }: any) {
    const { orderId } = route.params;
    const insets = useSafeAreaInsets();
    
    // Status: 'pending' (loading), 'success' (green tick), 'failed' (red X)
    const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        startPolling();
        return stopPolling;
    }, [orderId]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (status === 'pending') {
                e.preventDefault();
            }
        });

        return unsubscribe;
    }, [navigation, status]);

    useEffect(() => {
        if (status !== 'success') return;
        const timer = setTimeout(handleTrackOrder, 800);
        return () => clearTimeout(timer);
    }, [status]);

    const startPolling = () => {
        // Stop any existing intervals/timeouts
        stopPolling();

        // Check immediately
        checkPaymentStatus();

        // Set up interval for polling
        intervalRef.current = setInterval(checkPaymentStatus, POLL_INTERVAL);

        // Set up timeout for failure
        timeoutRef.current = setTimeout(() => {
            stopPolling();
            setStatus('failed');
        }, TIMEOUT_DURATION);
    };

    const stopPolling = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const checkPaymentStatus = async () => {
        try {
            const data = await paymentApi.getStatus(orderId);
            
            if (data.isPaid || data.status === 'Completed') {
                stopPolling();
                setStatus('success');
            } else if (data.status === 'Failed' || data.status === 'Canceled') {
                stopPolling();
                setStatus('failed');
            }
        } catch (error) {
            console.log('Error checking payment status:', error);
            // We don't fail immediately on network error, keep polling until timeout
        }
    };

    const handleRetry = () => {
        navigation.replace('VietQR', { orderId });
    };

    const handleTrackOrder = () => {
        navigation.navigate('MainTabs', {
            screen: 'Profile',
            params: {
                screen: 'OrderDetail',
                params: { orderId: orderId, fromPayment: true }
            }
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                {status === 'pending' && (
                    <>
                        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
                        <Text style={styles.title}>Đang chờ xác nhận thanh toán</Text>
                        <Text style={styles.subtitle}>
                            Hệ thống đang kiểm tra giao dịch của bạn. Vui lòng không thoát khỏi màn hình này.
                        </Text>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <Ionicons name="checkmark-circle" size={100} color={colors.success} style={styles.icon} />
                        <Text style={[styles.title, { color: colors.success }]}>Thanh toán thành công</Text>
                        <Text style={styles.subtitle}>
                            Đơn hàng của bạn đã được thanh toán và đang chờ người bán xử lý.
                        </Text>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <Ionicons name="close-circle" size={100} color={colors.danger} style={styles.icon} />
                        <Text style={[styles.title, { color: colors.danger }]}>Thanh toán thất bại</Text>
                        <Text style={styles.subtitle}>
                            Không nhận được xác nhận thanh toán hoặc giao dịch đã quá hạn.
                        </Text>
                    </>
                )}
            </View>

            {status === 'success' && (
                <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleTrackOrder}>
                        <Text style={styles.primaryBtnText}>Theo dõi đơn hàng</Text>
                    </TouchableOpacity>
                </View>
            )}

            {status === 'failed' && (
                <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry}>
                        <Text style={styles.primaryBtnText}>Quay lại trang thanh toán</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    spinner: { transform: [{ scale: 1.5 }], marginBottom: 32 },
    icon: { marginBottom: 24 },
    title: { 
        fontSize: 22, 
        fontWeight: '700', 
        color: colors.text, 
        marginBottom: 16,
        textAlign: 'center'
    },
    subtitle: { 
        fontSize: 15, 
        color: colors.textSecondary, 
        textAlign: 'center',
        lineHeight: 22 
    },
    bottomBar: { 
        backgroundColor: colors.white, 
        padding: 16, 
        borderTopWidth: 1, 
        borderTopColor: colors.borderLight 
    },
    primaryBtn: { 
        backgroundColor: colors.primary, 
        borderRadius: 8, 
        alignItems: 'center', 
        paddingVertical: 16 
    },
    primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
