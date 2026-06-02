import React, { useEffect, useMemo, useRef, useState } from "react";
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
import * as Location from "expo-location";
import { colors, spacing, borderRadius, shadow } from "../../theme/colors";
import { MapView, Marker } from "../../components/Map/MapComponent";
import { Shipment, shipperService } from "../../services/api/shipperService";
import { getShipmentBadgeLabel } from "../../utils/orderDisplayStatus";
import {
  onDeliveryRealtime,
  startDeliveryRealtime,
} from "../../services/realtime/deliveryRealtime";
import { formatDistanceMeters } from "../../utils/shippingDistance";
import {
  hasActiveShipmentCountdown,
  tickShipmentCountdown,
} from "../../utils/shipperShipmentTiming";

type FooterAction = { label: string; type: string; disabled?: boolean };
type Coordinate = { latitude: number; longitude: number };

const formatCurrency = (amount?: number) =>
  Number(amount || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const DEFAULT_PICKUP_COORDINATE = {
  latitude: 10.7758,
  longitude: 106.7019,
};

const DEFAULT_DELIVERY_COORDINATE = {
  latitude: 10.7898,
  longitude: 106.6994,
};

const DEFAULT_SHIPPER_COORDINATE = {
  latitude: 10.7828,
  longitude: 106.7006,
};

const DEFAULT_MAP_REGION = {
  latitude: 10.7828,
  longitude: 106.7006,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const midpoint = (a: Coordinate, b: Coordinate): Coordinate => ({
  latitude: (a.latitude + b.latitude) / 2,
  longitude: (a.longitude + b.longitude) / 2,
});

const regionForCoordinates = (coordinates: Coordinate[]) => {
  const latitudes = coordinates.map(coordinate => coordinate.latitude);
  const longitudes = coordinates.map(coordinate => coordinate.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.8, 0.02),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.8, 0.02),
  };
};

const removeDiacritics = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const cleanRouteAddress = (value?: string | null) => {
  let cleaned = String(value || "")
    .split("|")[0]
    .replace(/^\s*[^:,|]+:\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const normalized = removeDiacritics(part);
      return (
        !/^\d{4,6}$/.test(part) &&
        normalized !== "viet nam" &&
        normalized !== "vietnam"
      );
    })
    .join(", ");

  return cleaned;
};

const cleanMapAddress = (value?: string | null) => {
  const cleaned = cleanRouteAddress(value);
  if (!cleaned) return "";
  return `${cleaned}, Vietnam`;
};

const coordinateToQuery = (coordinate: Coordinate) =>
  `${coordinate.latitude},${coordinate.longitude}`;

const coordinateFromValues = (
  latitude?: number | null,
  longitude?: number | null,
): Coordinate | null => {
  if (latitude == null || longitude == null) return null;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }

  return { latitude: lat, longitude: lng };
};

const distanceBetweenMeters = (from: Coordinate, to: Coordinate) => {
  const earthRadiusMeters = 6371008.8;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(haversine)));
};

const coordinateFromShipment = (
  shipment: Shipment | null | undefined,
  type: "pickup" | "delivery",
) =>
  coordinateFromValues(
    type === "pickup" ? shipment?.pickupLatitude : shipment?.deliveryLatitude,
    type === "pickup" ? shipment?.pickupLongitude : shipment?.deliveryLongitude,
  );

const calculateDistanceMeters = (from: Coordinate, to: Coordinate) => {
  return Math.round(distanceBetweenMeters(from, to));
};

const isCoordinateNearRoute = (
  coordinate: Coordinate,
  pickup: Coordinate,
  delivery: Coordinate,
) => {
  const routeDistance = distanceBetweenMeters(pickup, delivery);
  const allowedDistance = Math.max(80000, routeDistance * 1.5);

  return (
    distanceBetweenMeters(coordinate, pickup) <= allowedDistance ||
    distanceBetweenMeters(coordinate, delivery) <= allowedDistance
  );
};

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

const fetchRoadDistanceMeters = async (from: Coordinate, to: Coordinate) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
      `?overview=false`;
    const response = await fetch(url, { signal: controller.signal });
    const result = await response.json();
    const meters = Number(result?.routes?.[0]?.distance);

    return Number.isFinite(meters) ? Math.round(meters) : null;
  } catch (error) {
    console.log("fetch road distance error:", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const fallbackCoordinateForAddress = (address: string, fallback: Coordinate) => {
  const normalized = removeDiacritics(address);
  if (normalized.includes("ho chi minh") || normalized.includes("hcm")) {
    return { latitude: 10.7769, longitude: 106.7009 };
  }
  if (normalized.includes("ha noi")) return { latitude: 21.0278, longitude: 105.8342 };
  if (normalized.includes("da nang")) return { latitude: 16.0471, longitude: 108.2068 };
  return fallback;
};

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
  const mapRef = useRef<any>(null);
  const [shipment, setShipment] = useState<Shipment | null>(
    route.params?.shipment || null,
  );
  const [loading, setLoading] = useState(!route.params?.shipment);
  const [submitting, setSubmitting] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_MAP_REGION);
  const [pickupCoordinate, setPickupCoordinate] = useState<Coordinate>(DEFAULT_PICKUP_COORDINATE);
  const [deliveryCoordinate, setDeliveryCoordinate] = useState<Coordinate>(DEFAULT_DELIVERY_COORDINATE);
  const [shipperCoordinate, setShipperCoordinate] = useState<Coordinate>(DEFAULT_SHIPPER_COORDINATE);
  const [hasLiveShipperCoordinate, setHasLiveShipperCoordinate] = useState(false);
  const [routeDistanceMeters, setRouteDistanceMeters] = useState<number | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapNotice, setMapNotice] = useState("Đang định vị tuyến giao hàng...");

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
    const refreshIfCurrentShipment = (payload: any) => {
      if (!payload.shipmentId || payload.shipmentId === shipmentId) {
        refresh();
      }
    };

    const offUpdated = onDeliveryRealtime("ShipmentUpdated", refreshIfCurrentShipment);
    const offOrder = onDeliveryRealtime("OrderUpdated", refreshIfCurrentShipment);
    const offPayment = onDeliveryRealtime("PaymentUpdated", refreshIfCurrentShipment);
    return () => {
      offUpdated();
      offOrder();
      offPayment();
    };
  }, [shipmentId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setShipment((current) => {
        if (!current || !hasActiveShipmentCountdown(current)) return current;
        return tickShipmentCountdown(current);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const footerAction = useMemo(() => getFooterAction(shipment), [shipment]);

  const handleCall = () => {
    if (shipment?.buyerPhone) Linking.openURL(`tel:${shipment.buyerPhone}`);
  };

  const handleOpenMap = () => {
    if (!shipment?.deliveryAddress && !shipment?.pickupAddress) return;
    const pickup = coordinateFromShipment(shipment, "pickup") || pickupCoordinate;
    const delivery =
      coordinateFromShipment(shipment, "delivery") || deliveryCoordinate;
    const origin = cleanMapAddress(shipment?.pickupAddress) || coordinateToQuery(pickup);
    const destination =
      cleanMapAddress(shipment?.deliveryAddress) || coordinateToQuery(delivery);
    const query = [
      "api=1",
      `origin=${encodeURIComponent(origin)}`,
      `destination=${encodeURIComponent(destination)}`,
      "travelmode=driving",
    ]
      .filter(Boolean)
      .join("&");
    const url = `https://www.google.com/maps/dir/?${query}`;
    Linking.openURL(url);
  };

  useEffect(() => {
    const pickupAddress = cleanMapAddress(shipment?.pickupAddress);
    const deliveryAddress = cleanMapAddress(shipment?.deliveryAddress);
    const pickupFromApi = coordinateFromShipment(shipment, "pickup");
    const deliveryFromApi = coordinateFromShipment(shipment, "delivery");

    if (!pickupFromApi && !deliveryFromApi && !pickupAddress && !deliveryAddress) {
      setPickupCoordinate(DEFAULT_PICKUP_COORDINATE);
      setDeliveryCoordinate(DEFAULT_DELIVERY_COORDINATE);
      setShipperCoordinate(DEFAULT_SHIPPER_COORDINATE);
      setHasLiveShipperCoordinate(false);
      setRouteDistanceMeters(null);
      setMapRegion(DEFAULT_MAP_REGION);
      setMapNotice("Chưa có địa chỉ lấy hàng và giao hàng.");
      return;
    }

    let active = true;
    const pickup =
      pickupFromApi ||
      fallbackCoordinateForAddress(pickupAddress, DEFAULT_PICKUP_COORDINATE);
    const delivery =
      deliveryFromApi ||
      fallbackCoordinateForAddress(deliveryAddress, DEFAULT_DELIVERY_COORDINATE);
    const estimatedShipper = midpoint(pickup, delivery);

    const fitRoute = (shipperPosition: Coordinate) => {
      const markers = [pickup, delivery, shipperPosition];
      setMapRegion(regionForCoordinates(markers));
      setTimeout(() => {
        mapRef.current?.fitToCoordinates?.(markers, {
          edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
          animated: true,
        });
      }, 200);
    };

    setPickupCoordinate(pickup);
    setDeliveryCoordinate(delivery);
    setShipperCoordinate(estimatedShipper);
    setHasLiveShipperCoordinate(false);
    setRouteDistanceMeters(
      typeof shipment?.distanceMeters === "number" && shipment.distanceMeters > 0
        ? Math.round(shipment.distanceMeters)
        : calculateDistanceMeters(pickup, delivery),
    );
    setMapNotice("");
    setMapLoading(false);
    fitRoute(estimatedShipper);

    fetchRoadDistanceMeters(pickup, delivery).then((distance) => {
      if (active && distance != null) setRouteDistanceMeters(distance);
    });

    const updateShipperLocation = async () => {
      setMapLoading(true);
      setMapNotice("Đang cập nhật GPS shipper...");
      let locationNotice = "";

      const applyLiveShipperCoordinate = (coordinate: Coordinate) => {
        const isFarFromRoute = !isCoordinateNearRoute(coordinate, pickup, delivery);
        locationNotice = isFarFromRoute
          ? "GPS shipper đang cách xa tuyến giao; bản đồ đang hiển thị cả vị trí thật của shipper và điểm lấy/giao."
          : "";

        setShipperCoordinate(coordinate);
        setHasLiveShipperCoordinate(true);
        setMapNotice(locationNotice);
        fitRoute(coordinate);
      };

      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          const requested = await withTimeout(
            Location.requestForegroundPermissionsAsync(),
            6000,
          );
          permission = requested || permission;
        }

        if (!permission.granted) return;

        const lastKnown = await withTimeout(
          Location.getLastKnownPositionAsync({
            maxAge: 120000,
            requiredAccuracy: 1000,
          }),
          1000,
        );
        const lastKnownCoordinate = coordinateFromValues(
          lastKnown?.coords?.latitude,
          lastKnown?.coords?.longitude,
        );

        if (active && lastKnownCoordinate) {
          applyLiveShipperCoordinate(lastKnownCoordinate);
        }

        const current = await withTimeout(
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          5000,
        );
        const currentCoordinate = coordinateFromValues(
          current?.coords?.latitude,
          current?.coords?.longitude,
        );

        if (active && currentCoordinate) {
          applyLiveShipperCoordinate(currentCoordinate);
        }
      } catch (error) {
        console.log("update shipper location error:", error);
      } finally {
        if (active) {
          setMapLoading(false);
          setMapNotice(locationNotice);
        }
      }
    };

    updateShipperLocation();
    return () => {
      active = false;
    };
  }, [
    shipment?.pickupAddress,
    shipment?.deliveryAddress,
    shipment?.pickupLatitude,
    shipment?.pickupLongitude,
    shipment?.deliveryLatitude,
    shipment?.deliveryLongitude,
    shipment?.distanceMeters,
    shipment?.distanceKm,
  ]);

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
  const pickupDisplayAddress =
    cleanRouteAddress(shipment.pickupAddress) || "Địa chỉ shop";
  const deliveryDisplayAddress =
    cleanRouteAddress(shipment.deliveryAddress) || "Địa chỉ người mua";
  const displayDistanceMeters =
    routeDistanceMeters ??
    (typeof shipment.distanceMeters === "number" && shipment.distanceMeters > 0
      ? shipment.distanceMeters
      : typeof shipment.distanceKm === "number" && shipment.distanceKm > 0
        ? Math.round(shipment.distanceKm * 1000)
        : null);

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
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker
              coordinate={pickupCoordinate}
              title="Shop lấy hàng"
              description={pickupDisplayAddress}
              pinColor={colors.primary}
            />
            <Marker
              coordinate={deliveryCoordinate}
              title="Điểm giao hàng"
              description={deliveryDisplayAddress}
              pinColor={colors.success}
            />
            <Marker
              coordinate={shipperCoordinate}
              title="Vị trí shipper"
              description={
                hasLiveShipperCoordinate
                  ? "Vị trí hiện tại của shipper"
                  : "Vị trí ước tính gần tuyến giao"
              }
              pinColor={colors.secondary}
            />
          </MapView>
          {!!mapNotice && (
            <View style={styles.mapNotice}>
              {mapLoading && <ActivityIndicator size="small" color={colors.primary} />}
              <Text style={styles.mapNoticeText}>{mapNotice}</Text>
            </View>
          )}
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
            label="Khoảng cách tuyến"
            value={
              formatDistanceMeters(displayDistanceMeters)
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tuyến giao</Text>
          <RouteRow
            icon="storefront-outline"
            title="Lấy hàng"
            value={pickupDisplayAddress}
          />
          <RouteRow
            icon="location-outline"
            title="Giao hàng"
            value={deliveryDisplayAddress}
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
  mapNotice: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mapNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
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
