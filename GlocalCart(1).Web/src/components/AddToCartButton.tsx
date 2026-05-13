'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNotificationStore, useBellStore } from '@/lib/store';

interface AddToCartButtonProps {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addBellNotification = useBellStore((state) => state.addNotification);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image
    });
    addNotification(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
    addBellNotification({
      type: 'order',
      title: 'Giỏ hàng đã cập nhật',
      message: `Bạn vừa thêm "${product.name}" vào giỏ hàng thành công.`
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <button 
        onClick={handleAddToCart}
        className="w-full py-6 bg-card border-2 border-foreground rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-bg-main transition-all group text-foreground"
      >
        <ShoppingCart size={24} className="group-hover:rotate-12 transition-transform" />
        THÊM VÀO GIỎ HÀNG
      </button>
      <button className="w-full py-6 bg-foreground text-background rounded-2xl font-black text-lg shadow-xl shadow-black/20 hover:bg-primary hover:text-white hover:shadow-primary/30 transition-all active:scale-95">
        MUA NGAY
      </button>
    </div>
  );
}
