import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  Alert,
  FlatList,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { ShipmentCard } from "../../components/Shipper/ShipmentCard";
import { Shipment, shipperService } from "../../services/api/shipperService";

const POLL_INTERVAL_MS = 15000;
const PAGE_SIZE = 20;

export default function ShipperAvailableScreen() {
  const [unassigned, setUnassigned] = useState<Shipment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const navigation = useNavigation<any>();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOnlineState = useCallback(async () => {
    const saved = await AsyncStorage.getItem("shipper_online");
    if (saved !== null) setIsOnline(saved === "true");
  }, []);

  const updateOnlineState = async (value: boolean) => {
    setIsOnline(value);
    await AsyncStorage.setItem("shipper_online", String(value));
    if (value) loadData(1, true);
    else setUnassigned([]);
  };

  const loadData = useCallback(async (nextPage = 1, replace = true) => {
    if (!isOnline) {
      setRefreshing(false);
      return;
    }

    try {
      const availableRes: any = await shipperService.getAvailableShipments(nextPage, PAGE_SIZE);
      const items: Shipment[] = availableRes?.items || [];
      setUnassigned((current) => (replace ? items : [...current, ...items]));
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE && (availableRes?.totalCount || 0) > nextPage * PAGE_SIZE);
    } catch (e) {
      console.log("Lỗi tải danh sách", e);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadOnlineState();
  }, [loadOnlineState]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setRefreshing(true);
      loadData(1, true);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadData(1, true), POLL_INTERVAL_MS);
    });
    return unsubscribe;
  }, [navigation, loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const handleAcceptShipment = async (shipment: Shipment) => {
    if (submittingId) return;
    setSubmittingId(shipment.shipmentId);
    try {
      await shipperService.acceptShipment(shipment.shipmentId);
      await loadData(1, true);
      Alert.alert("Thành công", "Đã nhận đơn. Đơn đã chuyển sang mục đang giao.");
      navigation.navigate("ShipperTabs", { screen: "Delivering" });
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể nhận đơn.");
    } finally {
      setSubmittingId(null);
    }
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || refreshing) return;
    setLoadingMore(true);
    loadData(page + 1, false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Chờ lấy hàng</Text>
          <Text style={styles.headerSubtitle}>
            {isOnline ? `${unassigned.length} đơn chờ nhận` : "Bạn đang tạm ngưng nhận đơn"}
          </Text>
        </View>
        <View style={styles.onlineBox}>
          <Text style={styles.onlineText}>{isOnline ? "Online" : "Offline"}</Text>
          <Switch
            value={isOnline}
            onValueChange={updateOnlineState}
            trackColor={{ false: colors.disabled, true: colors.primaryLight }}
            thumbColor={isOnline ? colors.primary : colors.white}
          />
        </View>
      </View>

      <FlatList
        data={isOnline ? unassigned : []}
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
        renderItem={({ item }: { item: Shipment }) => (
          <ShipmentCard
            shipment={item}
            onPress={() =>
              navigation.navigate("ShipperShipmentDetail", {
                shipmentId: item.shipmentId,
                shipment: item,
              })
            }
            onAction={() => handleAcceptShipment(item)}
            actionText="Nhận đơn"
            actionColor={colors.primary}
            actionDisabled={submittingId === item.shipmentId}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.25}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isOnline ? "Hiện không có đơn hàng chờ lấy hàng." : "Bật Online để xem đơn mới."}
            </Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  onlineBox: { alignItems: "center" },
  onlineText: { fontSize: 12, fontWeight: "800", color: colors.textSecondary, marginBottom: 2 },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  emptyContainer: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: "center" },
});
