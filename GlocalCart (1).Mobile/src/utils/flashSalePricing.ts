const toNumber = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clampPercent = (value: number) => Math.min(Math.max(Math.round(value), 0), 90);

const firstPositive = (...values: any[]) => {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed > 0) return parsed;
  }
  return 0;
};

export const getFlashSaleDiscountPercent = (item: any) => {
  const explicitPercent = firstPositive(
    item?.flashSaleDiscount,
    item?.flashSaleDiscountPercent,
    item?.discountPercent,
    item?.discountPercentage,
    item?.discount,
    item?.promotionPercent,
    item?.salePercent,
    item?.flashSale?.discountPercent,
    item?.flashSale?.discountPercentage,
    item?.flashSale?.discount,
  );

  if (explicitPercent > 0) return clampPercent(explicitPercent);

  const originalPrice = firstPositive(
    item?.originalPrice,
    item?.listPrice,
    item?.marketPrice,
    item?.compareAtPrice,
  );
  const currentPrice = firstPositive(
    item?.salePrice,
    item?.discountedPrice,
    item?.flashSalePrice,
    item?.promotionPrice,
    item?.finalPrice,
    item?.price,
  );

  if (originalPrice > 0 && currentPrice > 0 && currentPrice < originalPrice) {
    return clampPercent(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  return 0;
};

export const getFlashSalePricing = (item: any) => {
  const discountPercent = getFlashSaleDiscountPercent(item);
  const directSalePrice = firstPositive(
    item?.salePrice,
    item?.discountedPrice,
    item?.flashSalePrice,
    item?.promotionPrice,
    item?.finalPrice,
  );
  const rawPrice = firstPositive(item?.price, item?.currentPrice, item?.priceSnapshot);
  const originalPrice = firstPositive(
    item?.originalPrice,
    item?.listPrice,
    item?.marketPrice,
    item?.compareAtPrice,
  );

  if (discountPercent > 0) {
    const basePrice = originalPrice || rawPrice;
    const salePrice = directSalePrice || Math.round(basePrice * (1 - discountPercent / 100));
    return {
      hasDiscount: basePrice > 0 && salePrice > 0 && salePrice < basePrice,
      discountPercent,
      originalPrice: basePrice,
      salePrice,
    };
  }

  if (originalPrice > 0 && rawPrice > 0 && rawPrice < originalPrice) {
    return {
      hasDiscount: true,
      discountPercent: clampPercent(((originalPrice - rawPrice) / originalPrice) * 100),
      originalPrice,
      salePrice: rawPrice,
    };
  }

  return {
    hasDiscount: false,
    discountPercent: 0,
    originalPrice: rawPrice,
    salePrice: rawPrice,
  };
};

export const getFlashSaleSoldPercentage = (item: any) => {
  const explicitPercent = firstPositive(
    item?.soldPercentage,
    item?.soldPercent,
    item?.flashSaleSoldPercentage,
    item?.flashSale?.soldPercentage,
  );
  if (explicitPercent > 0) return Math.min(Math.round(explicitPercent), 100);

  const sold = firstPositive(item?.soldCount, item?.sales, item?.sold);
  const total = firstPositive(item?.flashSaleStock, item?.flashSaleQuantity, item?.saleStock);
  if (sold > 0 && total > 0) return Math.min(Math.round((sold / total) * 100), 100);

  return 0;
};
