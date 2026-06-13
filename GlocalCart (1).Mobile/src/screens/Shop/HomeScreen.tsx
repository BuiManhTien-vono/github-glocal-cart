import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../services/api/apiClient";
import { colors } from "../../theme/colors";
import { Loading } from "../../components/common/Loading";

// Import shop sub-components
import { HomeHeader } from "../../components/shop/HomeHeader";
import { FlashSale } from "../../components/shop/FlashSale";
import { DailyDiscover } from "../../components/shop/DailyDiscover";

const isUnavailableProduct = (item: any) => {
  const status = String(
    item?.status || item?.productStatus || "",
  ).toLowerCase();
  return (
    item?.isLocked === true ||
    item?.isActive === false ||
    ["locked", "inactive", "hidden", "deleted"].includes(status)
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = async () => {
    try {
      setErrorMessage("");
      const prodRes = (await apiClient.get("/products")) as any;
      const items = prodRes?.items || prodRes || [];
      setProducts(items.filter((item: any) => !isUnavailableProduct(item)));
    } catch (error) {
      console.warn("Home fetch error:", error);
      setProducts([]);
      setErrorMessage("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.wrapper, { maxWidth: "100%" }]}>
        <HomeHeader />

        {isLoading && !refreshing ? (
          <Loading message="Đang tải dữ liệu..." />
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 176.5 + insets.bottom },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {errorMessage ? (
              <View style={styles.errorState}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={52}
                  color={colors.textMuted}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchData}
                >
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <FlashSale data={products} />
                <DailyDiscover data={products} />
              </>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  wrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  errorState: {
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  errorText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  retryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
