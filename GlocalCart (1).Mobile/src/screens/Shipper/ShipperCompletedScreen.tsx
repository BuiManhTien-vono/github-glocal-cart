import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { ShipmentCard } from "../../components/Shipper/ShipmentCard";
import { Shipment, shipperService } from "../../services/api/shipperService";

const PAGE_SIZE = 20;

export default function ShipperCompletedScreen() {
  const [completedShipments, setCompletedShipments] = useState<Shipment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation<any>();

  const loadData = useCallback(async (nextPage = 1, replace = true) => {
    try {
      const response: any = await shipperService.getCompletedShipments(nextPage, PAGE_SIZE);
      const items: Shipment[] = response?.items || [];
      setCompletedShipments((current) => (replace ? items : [...current, ...items]));
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
        <Text style={styles.headerSubtitle}>Tổng cộng {completedShipments.length} đơn hàng</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bạn chưa hoàn thành đơn hàng nào.</Text>
          </View>
        }
      />
    </SafeAreaView>
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
  emptyContainer: { flex: 1, padding: 32, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: "center" },
});
