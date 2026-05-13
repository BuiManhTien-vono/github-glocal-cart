'use client';

import { useEffect } from 'react';
import { useRecentlyViewedStore, RecentlyViewedProduct } from '@/lib/store';

export default function RecentlyViewedTracker({ product }: { product: RecentlyViewedProduct }) {
  const addProduct = useRecentlyViewedStore((state) => state.addProduct);

  useEffect(() => {
    addProduct(product);
  }, [product, addProduct]);

  return null;
}
