import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { ShipmentCard } from "../../components/Shipper/ShipmentCard";
import {
  CompletedShipmentPeriod,
  Shipment,
  ShipperStats,
  shipperService,
} from "../../services/api/shipperService";
import {
  onDeliveryRealtime,
  startDeliveryRealtime,
} from "../../services/realtime/deliveryRealtime";

const PAGE_SIZE = 20;

const completedTabs: Array<{
  key: CompletedShipmentPeriod;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  {
    key: "today",
    label: "Hôm nay",
    subtitle: "Lịch sử trong ngày",
    icon: "today-outline",
    color: colors.success,
  },
  {
    key: "month",
    label: "Tháng này",
    subtitle: "Từ đầu tháng",
    icon: "calendar-outline",
    color: colors.primary,
  },
  {
    key: "all",
    label: "Tất cả",
    subtitle: "Toàn bộ lịch sử",
    icon: "albums-outline",
    color: colors.secondary,
  },
];

const normalizePeriodParam = (value: unknown): CompletedShipmentPeriod =>
  value === "month" || value === "all" || value === "today" ? value : "today";

const defaultStats: ShipperStats = {
  todayCompleted: 0,
  todayIncome: 0,
  todayFailed: 0,
  monthCompleted: 0,
  monthIncome: 0,
  monthFailed: 0,
  allCompleted: 0,
  allIncome: 0,
  allFailed: 0,
  activeShipments: 0,
  pendingCodAmount: 0,
  successRate: 100,
  rating: 4.8,
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const sumShippingFee = (shipments: Shipment[]) =>
  shipments.reduce((total, shipment) => total + Number(shipment.shippingFee || 0), 0);

export default function ShipperCompletedScreen() {
  const route = useRoute<any>();
  const initialPeriod = normalizePeriodParam(route.params?.period);
  const routePeriodMarker = route.params?.periodRequestAt ?? route.params?.period;
  const appliedRoutePeriodRef = React.useRef(routePeriodMarker);
  const [activePeriod, setActivePeriod] = useState<CompletedShipmentPeriod>(initialPeriod);
  const [completedShipments, setCompletedShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<ShipperStats>(defaultStats);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation<any>();

  const loadData = useCallback(
    async (nextPage = 1, replace = true, period = activePeriod) => {
      try {
        const [response, statsResponse]: any[] = replace
          ? await Promise.all([
            shipperService.getCompletedShipments(nextPage, PAGE_SIZE, period),
            shipperService.getStats(),
          ])
          : [
            await shipperService.getCompletedShipments(nextPage, PAGE_SIZE, period),
            null,
          ];

        const items: Shipment[] = response?.items || [];
        const nextTotalCount =
          typeof response?.totalCount === "number" ? response.totalCount : items.length;

        setCompletedShipments((current) => (replace ? items : [...current, ...items]));
        setTotalCount(nextTotalCount);
        if (statsResponse) setStats({ ...defaultStats, ...statsResponse });
        setPage(nextPage);
        setHasMore(items.length === PAGE_SIZE && nextTotalCount > nextPage * PAGE_SIZE);
      } catch (e) {
        console.log("Lỗi tải danh sách đã giao", e);
      } finally {
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activePeriod],
  );

  React.useEffect(() => {
    startDeliveryRealtime();
    const offUpdated = onDeliveryRealtime("ShipmentUpdated", () => loadData(1, true));
    const offDelivered = onDeliveryRealtime("ShipmentDelivered", () => loadData(1, true));
    return () => {
      offUpdated();
      offDelivered();
    };
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      loadData(1, true);
    }, [loadData]),
  );

  React.useEffect(() => {
    if (routePeriodMarker === appliedRoutePeriodRef.current) return;
    appliedRoutePeriodRef.current = routePeriodMarker;

    const nextPeriod = normalizePeriodParam(route.params?.period);
    if (nextPeriod === activePeriod) return;

    setActivePeriod(nextPeriod);
    setCompletedShipments([]);
    setTotalCount(0);
    setPage(1);
    setHasMore(true);
    setRefreshing(true);
    loadData(1, true, nextPeriod);
  }, [activePeriod, loadData, route.params?.period, routePeriodMarker]);

  const activeTab = useMemo(
    () => completedTabs.find((tab) => tab.key === activePeriod) || completedTabs[0],
    [activePeriod],
  );

  const periodStats = useMemo(() => {
    if (activePeriod === "today") {
      return {
        completed: stats.todayCompleted,
        income: stats.todayIncome,
        failed: stats.todayFailed,
        title: "Lịch sử giao hàng hôm nay",
      };
    }

    if (activePeriod === "month") {
      return {
        completed: stats.monthCompleted,
        income: stats.monthIncome,
        failed: stats.monthFailed,
        title: "Lịch sử giao hàng tháng này",
      };
    }

    const allCompleted =
      typeof stats.allCompleted === "number" ? stats.allCompleted : totalCount;
    const allIncome =
      typeof stats.allIncome === "number" ? stats.allIncome : sumShippingFee(completedShipments);
    const allFailed = typeof stats.allFailed === "number" ? stats.allFailed : 0;

    return {
      completed: allCompleted,
      income: allIncome,
      failed: allFailed,
      title: "Toàn bộ lịch sử giao hàng",
    };
  }, [activePeriod, completedShipments, stats, totalCount]);

  const tabCounts = useMemo<Record<CompletedShipmentPeriod, number>>(
    () => ({
      today: stats.todayCompleted,
      month: stats.monthCompleted,
      all: typeof stats.allCompleted === "number" ? stats.allCompleted : totalCount,
    }),
    [stats, totalCount],
  );

  const handleChangePeriod = (period: CompletedShipmentPeriod) => {
    if (period === activePeriod) return;
    setActivePeriod(period);
    setCompletedShipments([]);
    setTotalCount(0);
    setPage(1);
    setHasMore(true);
    setRefreshing(true);
    loadData(1, true, period);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || refreshing) return;
    setLoadingMore(true);
    loadData(page + 1, false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Đã giao</Text>
            <Text style={styles.headerSubtitle}>Lịch sử giao hàng</Text>
          </View>
        </View>

        <View style={styles.tabStatsPanel}>
          {completedTabs.map((tab) => {
            const isActive = activePeriod === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabStatBox, isActive && styles.tabStatBoxActive]}
                activeOpacity={0.75}
                onPress={() => handleChangePeriod(tab.key)}
              >
                <View style={styles.tabStatValueRow}>
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={isActive ? colors.white : tab.color}
                  />
                  <Text
                    style={[
                      styles.tabStatValue,
                      { color: isActive ? colors.white : tab.color },
                    ]}
                    numberOfLines={1}
                  >
                    {tabCounts[tab.key]}
                  </Text>
                </View>
                <Text
                  style={[styles.tabStatLabel, isActive && styles.tabStatLabelActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
          <View style={styles.headerContent}>
            <View style={styles.statsGroup}>
              <View style={styles.statsGroupHeader}>
                <View>
                  <Text style={styles.statsGroupTitle}>{activeTab.label}</Text>
                  <Text style={styles.statsGroupSubtitle}>{activeTab.subtitle}</Text>
                </View>
                <View style={[styles.scopeIcon, { backgroundColor: `${activeTab.color}18` }]}>
                  <Ionicons name={activeTab.icon} size={22} color={activeTab.color} />
                </View>
              </View>

              <View style={styles.statsGrid}>
                <SummaryCard
                  icon="checkmark-circle"
                  color={colors.success}
                  value={`${periodStats.completed}`}
                  label="Đã giao"
                />
                <SummaryCard
                  icon="wallet"
                  color={colors.primary}
                  value={formatCurrency(periodStats.income)}
                  label="Thu nhập"
                />
                <SummaryCard
                  icon="close-circle"
                  color={colors.danger}
                  value={`${periodStats.failed}`}
                  label="Không thành công"
                />
              </View>
            </View>

            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>{periodStats.title}</Text>
              <Text style={styles.historyCount}>{totalCount} đơn</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có đơn đã giao trong mục này.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabStatsPanel: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabStatBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  tabStatBoxActive: {
    backgroundColor: colors.primary,
  },
  tabStatValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabStatValue: {
    fontSize: 15,
    fontWeight: "900",
  },
  tabStatLabel: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  tabStatLabelActive: {
    color: colors.white,
  },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  headerContent: { gap: 14, marginBottom: 14 },
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  statsGroupTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  statsGroupSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  scopeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
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
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  historyCount: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  loadingMore: { paddingVertical: 16 },
  emptyContainer: { flex: 1, padding: 32, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: "center" },
});
