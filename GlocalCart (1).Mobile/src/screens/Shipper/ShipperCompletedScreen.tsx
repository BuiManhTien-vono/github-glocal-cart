import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { ShipmentCard } from "../../components/Shipper/ShipmentCard";
import { Shipment, ShipperStats, shipperService } from "../../services/api/shipperService";
import { onDeliveryRealtime, startDeliveryRealtime } from "../../services/realtime/deliveryRealtime";

const PAGE_SIZE = 20;
const defaultStats: ShipperStats = {
  todayCompleted: 0,
  todayIncome: 0,
  monthCompleted: 0,
  monthIncome: 0,
  activeShipments: 0,
  pendingCodAmount: 0,
  successRate: 100,
  rating: 4.8,
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function ShipperCompletedScreen() {
  const [completedShipments, setCompletedShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<ShipperStats>(defaultStats);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation<any>();

  const loadData = useCallback(async (nextPage = 1, replace = true) => {
    try {
      const [response, statsResponse]: any[] = replace
        ? await Promise.all([
          shipperService.getCompletedShipments(nextPage, PAGE_SIZE),
          shipperService.getStats(),
        ])
        : [await shipperService.getCompletedShipments(nextPage, PAGE_SIZE), null];
      const items: Shipment[] = response?.items || [];
      setCompletedShipments((current) => (replace ? items : [...current, ...items]));
      if (statsResponse) setStats({ ...defaultStats, ...statsResponse });
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE && (response?.totalCount || 0) > nextPage * PAGE_SIZE);
    } catch (e) {
      console.log("Lỗi tải danh sách", e);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    startDeliveryRealtime();
    const offUpdated = onDeliveryRealtime("ShipmentUpdated", () => loadData(1, true));
    return offUpdated;
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setRefreshing(true);
      loadData(1, true);
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const loadMore = () => {
    if (!hasMore || loadingMore || refreshing) return;
    setLoadingMore(true);
    loadData(page + 1, false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đã giao</Text>
        <Text style={styles.headerSubtitle}>Theo dõi hiệu suất giao hàng đã hoàn thành</Text>
      </View>

      <FlatList
        data={completedShipments}
        keyExtractor={(item) => item.shipmentId.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData(1, true);
            }}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <ShipmentCard
            shipment={item}
            onPress={() =>
              navigation.navigate("ShipperShipmentDetail", {
                shipmentId: item.shipmentId,
                shipment: item,
              })
            }
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.25}
        ListHeaderComponent={
          <View style={styles.statsWrap}>
            <View style={styles.statsGroup}>
              <View style={styles.statsGroupHeader}>
                <Text style={styles.statsGroupTitle}>Hôm nay</Text>
                <Text style={styles.statsGroupSubtitle}>Số liệu trong ngày</Text>
              </View>
              <View style={styles.statsGrid}>
                <SummaryCard icon="checkmark-circle" color={colors.success} value={`${stats.todayCompleted}`} label="Đã giao" />
                <SummaryCard icon="wallet" color={colors.primary} value={formatCurrency(stats.todayIncome)} label="Thu nhập" />
              </View>
            </View>

            <View style={styles.statsGroup}>
              <View style={styles.statsGroupHeader}>
                <Text style={styles.statsGroupTitle}>Tháng này</Text>
                <Text style={styles.statsGroupSubtitle}>Tổng từ đầu tháng</Text>
              </View>
              <View style={styles.statsGrid}>
                <SummaryCard icon="layers" color={colors.secondary} value={`${stats.monthCompleted}`} label="Đơn tháng" />
                <SummaryCard icon="trending-up" color={colors.success} value={formatCurrency(stats.monthIncome)} label="Thu nhập" />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bạn chưa hoàn thành đơn hàng nào.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function SummaryCard({ icon, color, value, label }: { icon: any; color: string; value: string; label: string }) {
  return (
    <View style={styles.summaryCard}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  statsWrap: { gap: 12, marginBottom: 14 },
  statsGroup: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statsGroupHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statsGroupTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  statsGroupSubtitle: { fontSize: 12, color: colors.textSecondary },
  statsGrid: { flexDirection: "row", gap: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
    minHeight: 86,
    justifyContent: "center",
  },
  summaryValue: { fontSize: 17, fontWeight: "900", color: colors.text, marginTop: 6 },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  emptyContainer: { flex: 1, padding: 32, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: "center" },
});
