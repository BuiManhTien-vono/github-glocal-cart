'use client';

import { useNotificationStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            layout
            className="pointer-events-auto"
          >
            <div className={`
              flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border
              ${n.type === 'success' ? 'bg-white border-success/20 text-foreground' : ''}
              ${n.type === 'error' ? 'bg-white border-danger/20 text-foreground' : ''}
              glass-panel min-w-[320px]
            `}>
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${n.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}
              `}>
                {n.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-black tracking-tight">{n.message}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Vừa xong</p>
              </div>

              <button 
                onClick={() => removeNotification(n.id)}
                className="p-2 hover:bg-bg-main rounded-lg transition-colors text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
