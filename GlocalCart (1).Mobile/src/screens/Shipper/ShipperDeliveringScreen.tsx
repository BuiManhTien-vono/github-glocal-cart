import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  Alert,
} from "react-native";
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

function getCountdownLabel(shipment: Shipment) {
  if (
    shipment.shipmentStatus === "Accepted" &&
    shipment.pickupCountdownSeconds
  ) {
    return `Có thể xác nhận lấy hàng sau ${shipment.pickupCountdownSeconds}s`;
  }
  if (
    shipment.shipmentStatus === "Shipped" &&
    shipment.arrivalCountdownSeconds
  ) {
    return `Có thể xác nhận đến nơi sau ${shipment.arrivalCountdownSeconds}s`;
  }
  return undefined;
}

function getShipperActions(shipment: Shipment) {
  if (shipment.shipmentStatus === "Accepted") {
    return {
      actionText: shipment.canConfirmPickup ? "Đã lấy hàng" : "Chờ lấy hàng",
      onAction: "pickup" as const,
      disabled: !shipment.canConfirmPickup,
    };
  }

  if (shipment.shipmentStatus === "Shipped") {
    return {
      actionText: shipment.canConfirmArrival ? "Đã đến nơi" : "Đang di chuyển",
      onAction: "arrival" as const,
      disabled: !shipment.canConfirmArrival,
    };
  }

  if (shipment.shipmentStatus === "Arrived") {
    if (shipment.awaitingCash) {
      return { actionText: "Đã nhận tiền", onAction: "cash" as const };
    }
    if (shipment.awaitingTransferConfirm) {
      return {
        actionText: "Đã nhận chuyển khoản",
        onAction: "transfer" as const,
      };
    }
    if (
      shipment.paymentStatus === "Completed" &&
      shipment.buyerConfirmedReceipt
    ) {
      return { actionText: "Hoàn thành đơn", onAction: "deliver" as const };
    }
    return {
      actionText: "Nhắc thanh toán",
      onAction: "requestPayment" as const,
    };
  }

  if (shipment.shipmentStatus === "OnHold") {
    return {
      actionText: "Đang xử lý sự cố",
      onAction: "noop" as const,
      disabled: true,
    };
  }

  return {};
}

export default function ShipperDeliveringScreen() {
  const [deliveringShipments, setDeliveringShipments] = useState<Shipment[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const navigation = useNavigation<any>();

  const loadData = useCallback(async (nextPage = 1, replace = true) => {
    try {
      const response: any = await shipperService.getMyShipments(
        nextPage,
        PAGE_SIZE,
      );
      const items: Shipment[] = response?.items || [];
      setDeliveringShipments((current) =>
        replace ? items : [...current, ...items],
      );
      setPage(nextPage);
      setHasMore(
        items.length === PAGE_SIZE &&
          (response?.totalCount || 0) > nextPage * PAGE_SIZE,
      );
    } catch (e) {
      console.log("Lỗi tải danh sách", e);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    startDeliveryRealtime();
    const offUpdated = onDeliveryRealtime("ShipmentUpdated", () =>
      loadData(1, true),
    );
    return offUpdated;
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setRefreshing(true);
      loadData(1, true);
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const runAction = async (shipment: Shipment, type: string) => {
    if (submittingId || type === "noop") return;
    setSubmittingId(shipment.shipmentId);
    try {
      let message = "";
      switch (type) {
        case "pickup":
          await shipperService.confirmPickup(shipment.shipmentId);
          message = "Đã lấy hàng. Đơn chuyển sang đang giao.";
          break;
        case "arrival":
          await shipperService.confirmArrival(shipment.shipmentId);
          message =
            "Đã đến nơi. Người mua sẽ nhận thông báo xác nhận nhận hàng.";
          break;
        case "cash":
          await shipperService.confirmCashReceived(shipment.shipmentId);
          message = "Đã xác nhận nhận tiền mặt. Đơn hoàn tất.";
          break;
        case "transfer":
          await shipperService.confirmTransferReceived(shipment.shipmentId);
          message = "Đã xác nhận nhận chuyển khoản. Đơn hoàn tất.";
          break;
        case "requestPayment":
          await shipperService.requestPayment(shipment.shipmentId);
          message = "Đã gửi nhắc thanh toán/xác nhận nhận hàng cho người mua.";
          break;
        case "deliver":
          await shipperService.deliverShipment(shipment.shipmentId, {
            note: "Giao hàng thành công",
            proofNote: "Shipper xác nhận đã giao trực tiếp cho người nhận.",
          });
          message = "Đã hoàn thành đơn hàng.";
          break;
      }
      await loadData(1, true);
      Alert.alert("Thành công", message);
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Thao tác thất bại");
    } finally {
      setSubmittingId(null);
    }
  };

  const reportFailure = (shipment: Shipment) => {
    const submit = async (reason: string) => {
      if (submittingId) return;
      setSubmittingId(shipment.shipmentId);
      try {
        await shipperService.reportDeliveryFailed(shipment.shipmentId, {
          failureReason: reason,
          note: "Shipper báo từ màn đang giao",
        });
        await loadData(1, true);
        Alert.alert("Đã ghi nhận", "Đơn đã chuyển sang trạng thái cần xử lý.");
      } catch (e: any) {
        Alert.alert("Lỗi", e.message || "Không thể báo giao thất bại");
      } finally {
        setSubmittingId(null);
      }
    };

    Alert.alert("Báo giao thất bại", "Chọn lý do không giao được đơn này.", [
      {
        text: "Khách không nghe máy",
        onPress: () => submit("Khách không nghe máy"),
      },
      { text: "Sai địa chỉ", onPress: () => submit("Sai địa chỉ") },
      {
        text: "Khách từ chối nhận",
        style: "destructive",
        onPress: () => submit("Khách từ chối nhận"),
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || refreshing) return;
    setLoadingMore(true);
    loadData(page + 1, false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đang giao</Text>
        <Text style={styles.headerSubtitle}>
          Đang xử lý {deliveringShipments.length} đơn
        </Text>
      </View>

      <FlatList
        data={deliveringShipments}
        keyExtractor={(item) => item.shipmentId.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const actions = getShipperActions(item);
          return (
            <ShipmentCard
              shipment={item}
              countdownLabel={getCountdownLabel(item)}
              onPress={() =>
                navigation.navigate("ShipperShipmentDetail", {
                  shipmentId: item.shipmentId,
                  shipment: item,
                })
              }
              onAction={
                actions.onAction
                  ? () => runAction(item, actions.onAction!)
                  : undefined
              }
              actionText={actions.actionText}
              actionColor={colors.success}
              actionDisabled={
                actions.disabled || submittingId === item.shipmentId
              }
              onSecondaryAction={
                item.shipmentStatus === "Shipped" ||
                item.shipmentStatus === "Arrived"
                  ? () => reportFailure(item)
                  : undefined
              }
              secondaryActionText="Giao thất bại"
              secondaryActionColor={colors.danger}
            />
          );
        }}
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.25}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Hiện không có đơn đang xử lý.</Text>
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
  emptyContainer: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: "center" },
});
