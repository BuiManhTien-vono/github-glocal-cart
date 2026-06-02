import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadow } from "../../theme/colors";
import { fetchPagedItems } from "../../services/api/pagedApi";
import { resolveProductImageUrl } from "../../utils/imageUtils";
import apiClient from "../../services/api/apiClient";

export default function SellerFlashSaleScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const items = await fetchPagedItems<any>("/products/my-products", 100);
      setProducts(
        items.map((item) => ({
          id: String(item.id),
          name: item.name,
          price: Number(item.price || 0),
          image: item.mediaUrl || item.imageUrl || item.images?.[0]?.imageUrl,
          stock: Number(item.availableItemCount ?? item.stock ?? 0),
          isFlashSale: Boolean(item.isFlashSale),
          discount: Number(item.flashSaleDiscount ?? item.discount ?? 0),
        })),
      );
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể tải sản phẩm của shop.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlashSale = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isFlashSale: p.stock > 0 ? !p.isFlashSale : false,
              discount: !p.isFlashSale && p.stock > 0 ? 10 : 0,
            }
          : p,
      ),
    );
    const product = products.find((p) => p.id === id);
    if (product && product.stock <= 0) {
      Alert.alert(
        "Thông báo",
        "Không thể thêm sản phẩm hết hàng vào Flash Sale.",
      );
    }
  };

  const setDiscount = (id: string, val: string) => {
    const num = parseInt(val) || 0;
    const clamped = Math.min(Math.max(num, 0), 90);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, discount: clamped } : p)),
    );
  };

  const flashSaleCount = products.filter((p) => p.isFlashSale).length;

  const saveFlashSaleSettings = async () => {
    const flashItems = products.filter((p) => p.isFlashSale);
    const outOfStockItems = flashItems.filter((p) => p.stock <= 0);

    if (outOfStockItems.length > 0) {
      Alert.alert("Lỗi", "Flash Sale không được chứa sản phẩm hết hàng.");
      return;
    }

    setIsSaving(true);
    try {
      // Gửi request để cập nhật tất cả sản phẩm
      const updatePromises = products.map((p) => {
        // Gửi request cho tất cả sản phẩm (bật hoặc tắt Flash Sale)
        return apiClient.put(`/products/${p.id}`, {
          isFlashSale: p.isFlashSale,
          flashSaleDiscount: p.isFlashSale ? p.discount : 0,
        });
      });

      await Promise.all(updatePromises);

      Alert.alert(
        "Thành công",
        `Đã cập nhật Flash Sale cho ${flashItems.length} sản phẩm.\n\n` +
          flashItems.map((p) => `- ${p.name}: -${p.discount}%`).join("\n"),
        [
          {
            text: "OK",
            onPress: () => {
              // Reload dữ liệu từ server để xác nhận thay đổi
              loadProducts();
            },
          },
        ],
      );
    } catch (error: any) {
      console.error("Save flash sale error:", error);
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể lưu cài đặt Flash Sale. Vui lòng thử lại.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    const flashItems = products.filter((p) => p.isFlashSale);
    if (flashItems.length === 0) {
      Alert.alert(
        "Thông báo",
        "Vui lòng chọn ít nhất một sản phẩm để Flash Sale.",
      );
      return;
    }

    const outOfStockItems = flashItems.filter((p) => p.stock <= 0);
    if (outOfStockItems.length > 0) {
      Alert.alert("Thông báo", "Flash Sale không được chứa sản phẩm hết hàng.");
      return;
    }

    saveFlashSaleSettings();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt Flash Sale</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Ionicons name="flash" size={20} color="#ee4d2d" />
          <Text style={styles.statValue}>{flashSaleCount}</Text>
          <Text style={styles.statLabel}>Đang Flash Sale</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons
            name="cube-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.statValue}>
            {products.length - flashSaleCount}
          </Text>
          <Text style={styles.statLabel}>Giá thường</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {products.map((product) => {
            const salePrice = product.price * (1 - product.discount / 100);
            const imageUri = resolveProductImageUrl(product.image);
            return (
              <View
                key={product.id}
                style={[
                  styles.productCard,
                  product.isFlashSale && styles.productCardActive,
                ]}
              >
                <View style={styles.productTop}>
                  <View style={styles.imgMock}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.productImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons
                        name="image-outline"
                        size={24}
                        color={colors.textMuted}
                      />
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productPrice}>
                      ₫{product.price.toLocaleString("vi-VN")}
                    </Text>
                    <Text
                      style={[
                        styles.stockText,
                        product.stock <= 0 && styles.stockTextDanger,
                      ]}
                    >
                      Kho: {product.stock}
                    </Text>
                  </View>
                  <View style={styles.toggleWrap}>
                    <Switch
                      value={product.isFlashSale}
                      onValueChange={() => toggleFlashSale(product.id)}
                      disabled={product.stock <= 0}
                      trackColor={{ false: "#ddd", true: "#ffbda6" }}
                      thumbColor={product.isFlashSale ? "#ee4d2d" : "#f4f3f4"}
                    />
                  </View>
                </View>

                {product.isFlashSale && (
                  <View style={styles.discountRow}>
                    <View style={styles.flashBadge}>
                      <Ionicons name="flash" size={12} color="#fff" />
                      <Text style={styles.flashBadgeText}>FLASH SALE</Text>
                    </View>
                    <View style={styles.discountInput}>
                      <Text style={styles.discountLabel}>Giảm</Text>
                      <TextInput
                        style={styles.discountField}
                        value={product.discount.toString()}
                        onChangeText={(val) => setDiscount(product.id, val)}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={styles.discountLabel}>%</Text>
                    </View>
                    <Text style={styles.salePrice}>
                      → ₫{salePrice.toLocaleString("vi-VN")}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom Save Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (isLoading || isSaving) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={isLoading || isSaving}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.saveBtnText}>Đang lưu...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>
                Lưu cài đặt ({flashSaleCount} SP)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  content: { flex: 1 },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: 14 },

  // Stats Banner
  statsBanner: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statDivider: { width: 1, backgroundColor: colors.borderLight },

  // Product Card
  productCard: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  productCardActive: { backgroundColor: "#FFF8F5" },
  productTop: { flexDirection: "row", alignItems: "center" },
  imgMock: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  productImage: { width: "100%", height: "100%" },
  productInfo: { flex: 1 },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  stockText: { marginTop: 3, fontSize: 12, color: colors.textSecondary },
  stockTextDanger: { color: colors.danger, fontWeight: "700" },
  toggleWrap: { marginLeft: 8 },

  // Discount Row
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#FFE8DE",
    flexWrap: "wrap",
    gap: 8,
  },
  flashBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ee4d2d",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  flashBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  discountInput: { flexDirection: "row", alignItems: "center", gap: 4 },
  discountLabel: { fontSize: 13, color: colors.textSecondary },
  discountField: {
    width: 44,
    height: 32,
    borderWidth: 1,
    borderColor: "#ee4d2d",
    borderRadius: 4,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#ee4d2d",
    backgroundColor: "#fff",
  },
  salePrice: { fontSize: 14, fontWeight: "700", color: "#ee4d2d" },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadow.md,
  },
  saveBtn: {
    backgroundColor: "#ee4d2d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
