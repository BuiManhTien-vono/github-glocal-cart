import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadow } from "../../theme/colors";
import { MapView, Marker } from "../../components/Map/MapComponent";
import { Shipment, shipperService } from "../../services/api/shipperService";
import { getShipmentBadgeLabel } from "../../utils/orderDisplayStatus";
import {
  onDeliveryRealtime,
  startDeliveryRealtime,
} from "../../services/realtime/deliveryRealtime";

type FooterAction = { label: string; type: string; disabled?: boolean };

const formatCurrency = (amount?: number) =>
  Number(amount || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

function getFooterAction(shipment?: Shipment | null): FooterAction | null {
  if (!shipment || shipment.shipmentStatus === "Delivered") return null;
  if (!shipment.shipperId) return { label: "Nhận đơn", type: "accept" };

  if (shipment.shipmentStatus === "Accepted") {
    return {
      label: shipment.canConfirmPickup
        ? "Đã lấy hàng"
        : "Chờ tới thời điểm lấy hàng",
      type: "pickup",
      disabled: !shipment.canConfirmPickup,
    };
  }

  if (shipment.shipmentStatus === "Shipped") {
    return {
      label: shipment.canConfirmArrival ? "Đã đến nơi" : "Đang di chuyển",
      type: "arrival",
      disabled: !shipment.canConfirmArrival,
    };
  }

  if (shipment.shipmentStatus === "Arrived") {
    if (shipment.awaitingCash) return { label: "Đã nhận tiền", type: "cash" };
    if (shipment.awaitingTransferConfirm)
      return { label: "Đã nhận chuyển khoản", type: "transfer" };
    if (
      shipment.paymentStatus === "Completed" &&
      shipment.buyerConfirmedReceipt
    ) {
      return { label: "Hoàn thành đơn", type: "deliver" };
    }
    return { label: "Nhắc người mua xác nhận", type: "requestPayment" };
  }

  if (shipment.shipmentStatus === "OnHold") {
    return { label: "Đơn đang chờ xử lý", type: "wait", disabled: true };
  }

  return null;
}

export default function ShipperShipmentDetailScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [shipment, setShipment] = useState<Shipment | null>(
    route.params?.shipment || null,
  );
  const [loading, setLoading] = useState(!route.params?.shipment);
  const [submitting, setSubmitting] = useState(false);

  const shipmentId =
    route.params?.shipmentId || route.params?.shipment?.shipmentId;

  const refresh = async () => {
    if (!shipmentId) return;
    try {
      const data: any = await shipperService.getShipmentDetail(shipmentId);
      if (data) setShipment(data);
    } catch (error) {
      console.log("refresh shipment error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [shipmentId]);

  useEffect(() => {
    startDeliveryRealtime();
    const offUpdated = onDeliveryRealtime("ShipmentUpdated", (payload) => {
      if (!payload.shipmentId || payload.shipmentId === shipmentId) {
        refresh();
      }
    });
    return offUpdated;
  }, [shipmentId]);

  const footerAction = useMemo(() => getFooterAction(shipment), [shipment]);

  const handleCall = () => {
    if (shipment?.buyerPhone) Linking.openURL(`tel:${shipment.buyerPhone}`);
  };

  const handleOpenMap = () => {
    if (!shipment?.deliveryAddress) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shipment.deliveryAddress)}`;
    Linking.openURL(url);
  };

  const performAction = async () => {
    if (!shipment || !footerAction || footerAction.disabled || submitting)
      return;

    setSubmitting(true);
    try {
      switch (footerAction.type) {
        case "accept":
          await shipperService.acceptShipment(shipment.shipmentId);
          Alert.alert("Thành công", "Đã nhận đơn. Vui lòng tới shop lấy hàng.");
          navigation.navigate("ShipperTabs", { screen: "Delivering" });
          break;
        case "pickup":
          await shipperService.confirmPickup(shipment.shipmentId);
          Alert.alert("Thành công", "Đã xác nhận lấy hàng.");
          break;
        case "arrival":
          await shipperService.confirmArrival(shipment.shipmentId);
          Alert.alert("Thành công", "Đã xác nhận đến nơi giao.");
          break;
        case "cash":
          await shipperService.confirmCashReceived(shipment.shipmentId);
          Alert.alert("Thành công", "Đã xác nhận nhận tiền mặt.");
          break;
        case "transfer":
          await shipperService.confirmTransferReceived(shipment.shipmentId);
          Alert.alert("Thành công", "Đã xác nhận nhận chuyển khoản.");
          break;
        case "requestPayment":
          await shipperService.requestPayment(shipment.shipmentId);
          Alert.alert(
            "Đã gửi nhắc",
            "Người mua sẽ nhận thông báo xác nhận nhận hàng/thanh toán.",
          );
          break;
        case "deliver":
          await shipperService.deliverShipment(shipment.shipmentId, {
            note: "Giao hàng thành công",
            proofNote: "Shipper xác nhận đã giao trực tiếp cho người nhận.",
          });
          Alert.alert("Thành công", "Đơn hàng đã hoàn tất.");
          navigation.goBack();
          break;
      }
      await refresh();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const reportFailure = () => {
    if (!shipment || submitting) return;
    const submit = async (reason: string) => {
      setSubmitting(true);
      try {
        await shipperService.reportDeliveryFailed(shipment.shipmentId, {
          failureReason: reason,
          note: "Báo từ màn chi tiết vận đơn",
        });
        await refresh();
        Alert.alert("Đã ghi nhận", "Đơn đã chuyển sang trạng thái cần xử lý.");
      } catch (error: any) {
        Alert.alert("Lỗi", error?.message || "Không thể báo giao thất bại.");
      } finally {
        setSubmitting(false);
      }
    };

    Alert.alert("Giao thất bại", "Chọn lý do để lưu vào lịch sử vận đơn.", [
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

  const confirmAction = () => {
    if (!footerAction || footerAction.disabled) return;
    Alert.alert(
      "Xác nhận thao tác",
      `Bạn muốn thực hiện: ${footerAction.label}?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đồng ý", onPress: performAction },
      ],
    );
  };

  if (loading || !shipment) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải vận đơn...</Text>
      </SafeAreaView>
    );
  }

  const isCOD =
    shipment.paymentMethod === "CashOnDelivery" ||
    shipment.paymentMethod === "CreditCard" ||
    shipment.paymentStatus !== "Completed";
  const mockLocation = {
    latitude: 16.0544,
    longitude: 108.2022,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết vận đơn</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleOpenMap}>
          <Ionicons name="navigate" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapContainer}>
          <MapView style={styles.map} initialRegion={mockLocation}>
            <Marker
              coordinate={mockLocation}
              title="Điểm giao hàng"
              description={shipment.deliveryAddress}
            />
          </MapView>
          <TouchableOpacity style={styles.openMapBtn} onPress={handleOpenMap}>
            <Ionicons name="map" size={18} color={colors.white} />
            <Text style={styles.openMapText}>Mở bản đồ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <InfoRow label="Mã đơn hàng" value={`#${shipment.orderNumber}`} />
          <InfoRow
            label="Mã vận đơn"
            value={shipment.trackingNumber || "Chưa có"}
          />
          <InfoRow
            label="Trạng thái"
            value={getShipmentBadgeLabel(shipment.shipmentStatus)}
          />
          <InfoRow
            label="Khoảng cách ước tính"
            value={`${shipment.distanceKm?.toFixed?.(1) || "--"} km`}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tuyến giao</Text>
          <RouteRow
            icon="storefront-outline"
            title="Lấy hàng"
            value={shipment.pickupAddress || "Điểm lấy hàng tại shop"}
          />
          <RouteRow
            icon="location-outline"
            title="Giao hàng"
            value={shipment.deliveryAddress}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Người nhận</Text>
          <View style={styles.personRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>
                {shipment.buyerName || "Người nhận"}
              </Text>
              <Text style={styles.personPhone}>
                {shipment.buyerPhone || "Chưa có số điện thoại"}
              </Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          {(shipment.orderItems || []).map((item, index) => (
            <View key={`${item.productId}_${index}`} style={styles.itemRow}>
              <View style={styles.productIcon}>
                <Ionicons
                  name="cube-outline"
                  size={22}
                  color={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={styles.productMeta}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.unitPrice * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <InfoRow
            label="Phương thức"
            value={isCOD ? "Thu hộ COD" : "Đã thanh toán"}
          />
          <InfoRow
            label="Tổng tiền"
            value={formatCurrency(shipment.totalAmount)}
            highlight
          />
          <InfoRow
            label="Phí vận chuyển"
            value={formatCurrency(shipment.shippingFee)}
          />
        </View>

        {(shipment.shipmentStatus === "Shipped" ||
          shipment.shipmentStatus === "Arrived") && (
          <TouchableOpacity
            style={styles.failBtn}
            onPress={reportFailure}
            disabled={submitting}
          >
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <Text style={styles.failBtnText}>Báo giao thất bại</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {footerAction && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              footerAction.disabled && styles.footerBtnDisabled,
            ]}
            disabled={footerAction.disabled || submitting}
            onPress={confirmAction}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.footerBtnText}>{footerAction.label}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.valueBold, highlight && styles.amount]}>
        {value}
      </Text>
    </View>
  );
}

function RouteRow({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) {
  return (
    <View style={styles.routeRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.routeTitle}>{title}</Text>
        <Text style={styles.addressText}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  scrollContent: { paddingBottom: 120 },
  mapContainer: { height: 220, backgroundColor: colors.borderLight },
  map: { flex: 1 },
  openMapBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  openMapText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  section: {
    backgroundColor: colors.white,
    marginTop: 10,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: { color: colors.textSecondary, fontSize: 13 },
  valueBold: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right",
  },
  personRow: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  personName: { color: colors.text, fontWeight: "800", fontSize: 15 },
  personPhone: { color: colors.textSecondary, marginTop: 2 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  routeRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  routeTitle: { color: colors.textSecondary, fontSize: 12, marginBottom: 2 },
  addressText: { flex: 1, color: colors.text, lineHeight: 20 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  productIcon: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  productName: { color: colors.text, fontWeight: "600", fontSize: 13 },
  productMeta: { color: colors.textSecondary, marginTop: 3, fontSize: 12 },
  itemPrice: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  amount: { color: colors.primary, fontWeight: "900", fontSize: 15 },
  failBtn: {
    margin: 16,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  failBtnText: { color: colors.danger, fontWeight: "800" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    padding: spacing.md,
    ...shadow.lg,
  },
  footerBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnDisabled: { backgroundColor: colors.disabled },
  footerBtnText: { color: colors.white, fontWeight: "800", fontSize: 15 },
});
