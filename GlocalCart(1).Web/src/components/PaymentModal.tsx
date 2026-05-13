'use client';

import { X, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentModalProps {
  qrUrl: string;
  amount: number;
  onClose: () => void;
}

export default function PaymentModal({ qrUrl, amount, onClose }: PaymentModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[340px] bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center text-center overflow-hidden"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>

          <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mb-4 mt-2">
            <CheckCircle2 size={24} />
          </div>

          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Đơn Hàng Đã Tạo!</h2>
          <p className="text-sm text-zinc-500 font-medium mb-5">
            Vui lòng quét mã QR dưới đây bằng ứng dụng ngân hàng.
          </p>

          <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-inner mb-5 relative w-full aspect-square max-w-[180px]">
            {qrUrl ? (
              <Image 
                src={qrUrl} 
                alt="VietQR Code" 
                fill
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-zinc-500 font-medium">
                Đang tải mã...
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 mb-6">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Số tiền thanh toán</span>
            <span className="text-2xl font-black text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
            </span>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-xl font-black text-base shadow-xl hover:bg-primary hover:text-white transition-all active:scale-95"
          >
            ĐÃ THANH TOÁN XONG
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
