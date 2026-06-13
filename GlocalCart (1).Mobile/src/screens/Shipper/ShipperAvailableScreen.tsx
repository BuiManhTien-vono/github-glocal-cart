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
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { ShipmentCard } from "../../components/Shipper/ShipmentCard";
import { Shipment, shipperService } from "../../services/api/shipperService";
import {
  onDeliveryRealtime,
  startDeliveryRealtime,
} from "../../services/realtime/deliveryRealtime";
const PAGE_SIZE = 20;

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);

const syncShipperLocation = async () => {
  try {
    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      const requested = await withTimeout(
        Location.requestForegroundPermissionsAsync(),
        6000,
      );
      permission = requested || permission;
    }

    if (!permission.granted) return false;

    const current = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      6000,
    );
    const fallback = current
      ? null
      : await withTimeout(
          Location.getLastKnownPositionAsync({
            maxAge: 120000,
            requiredAccuracy: 1000,
          }),
          1000,
        );
    const position = current || fallback;
    const latitude = Number(position?.coords?.latitude);
    const longitude = Number(position?.coords?.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      return false;
    }

    await shipperService.updateLocation({ latitude, longitude });
    return true;
  } catch (error) {
    console.log("sync shipper location error:", error);
    return false;
  }
};

export default function ShipperAvailableScreen() {
  const [unassigned, setUnassigned] = useState<Shipment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const navigation = useNavigation<any>();

  const loadOnlineState = useCallback(async () => {
    const saved = await AsyncStorage.getItem("shipper_online");
    if (saved !== null) setIsOnline(saved === "true");
  }, []);

  const updateOnlineState = async (value: boolean) => {
    if (!value) {
      setIsOnline(false);
      await AsyncStorage.setItem("shipper_online", "false");
      setUnassigned([]);
      return;
    }

    const locationSynced = await syncShipperLocation();
    if (!locationSynced) {
      setIsOnline(false);
      await AsyncStorage.setItem("shipper_online", "false");
      setUnassigned([]);
      Alert.alert(
        "Không thể bật Online",
        "Vui lòng cấp quyền vị trí và đảm bảo app lấy được vị trí hiện tại.",
      );
      return;
    }

    setIsOnline(true);
    await AsyncStorage.setItem("shipper_online", "true");
    loadData(1, true);
  };

  const loadData = useCallback(
    async (nextPage = 1, replace = true) => {
      if (!isOnline) {
        setRefreshing(false);
        return;
      }

      try {
        const locationSynced = await syncShipperLocation();
        if (!locationSynced) {
          setIsOnline(false);
          await AsyncStorage.setItem("shipper_online", "false");
          setUnassigned([]);
          Alert.alert(
            "Đã chuyển Offline",
            "Không thể cập nhật vị trí shipper. Vui lòng kiểm tra quyền vị trí rồi bật Online lại.",
          );
          return;
        }

        const availableRes: any = await shipperService.getAvailableShipments(
          nextPage,
          PAGE_SIZE,
        );
        const items: Shipment[] = availableRes?.items || [];
        setUnassigned((current) => (replace ? items : [...current, ...items]));
        setPage(nextPage);
        setHasMore(
          items.length === PAGE_SIZE &&
            (availableRes?.totalCount || 0) > nextPage * PAGE_SIZE,
        );
      } catch (e) {
        console.log("Lỗi tải danh sách", e);
      } finally {
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [isOnline],
  );

  useEffect(() => {
    loadOnlineState();
  }, [loadOnlineState]);

  useEffect(() => {
    startDeliveryRealtime();
    const reload = () => loadData(1, true);
    const offAvailable = onDeliveryRealtime("ShipmentAvailable", reload);
    const offUpdated = onDeliveryRealtime("ShipmentUpdated", reload);
    return () => {
      offAvailable();
      offUpdated();
    };
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setRefreshing(true);
      loadData(1, true);
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const handleAcceptShipment = async (shipment: Shipment) => {
    if (submittingId) return;
    setSubmittingId(shipment.shipmentId);
    try {
      await shipperService.acceptShipment(shipment.shipmentId);
      await loadData(1, true);
      Alert.alert(
        "Thành công",
        "Đã nhận đơn. Đơn đã chuyển sang mục đang giao.",
      );
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
            {isOnline
              ? `${unassigned.length} đơn chờ nhận`
              : "Bạn đang tạm ngưng nhận đơn"}
          </Text>
        </View>
        <View style={styles.onlineBox}>
          <Text style={styles.onlineText}>
            {isOnline ? "Online" : "Offline"}
          </Text>
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
              {isOnline
                ? "Hiện không có đơn hàng chờ lấy hàng."
                : "Bật Online để xem đơn mới."}
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
  onlineText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  emptyContainer: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: "center" },
});
