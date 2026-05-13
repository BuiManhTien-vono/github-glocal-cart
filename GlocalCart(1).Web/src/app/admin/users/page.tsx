'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  User, Mail, Shield, ShieldAlert, 
  CheckCircle, XCircle, Search, 
  Loader2, MoreVertical, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/lib/store';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const data = await api.admin.getUsers(page);
      setUsers(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      addNotification('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await api.admin.updateUserStatus(id, newStatus);
      if (res.success) {
        addNotification(`Đã chuyển trạng thái sang ${newStatus}`, 'success');
        fetchUsers();
      }
    } catch (err) {
      addNotification('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleToggleSeller = async (id: number) => {
    try {
      const res = await api.admin.toggleSeller(id);
      if (res.success) {
        addNotification(res.message, 'success');
        fetchUsers();
      }
    } catch (err) {
      addNotification('Lỗi khi duyệt Seller', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search Header */}
      <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-main border border-border rounded-2xl pl-12 pr-6 py-3 outline-none focus:border-primary transition-all font-medium"
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((u, i) => (
            <motion.div 
              key={u.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card p-6 rounded-[32px] border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-2xl uppercase border-2 border-background shadow-sm">
                  {u.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-lg text-foreground">{u.fullName}</h4>
                    {u.role === 'Admin' && <ShieldCheck size={16} className="text-amber-500" />}
                    {u.isSeller && <div className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase tracking-tighter">Seller</div>}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                    <span className={`flex items-center gap-1 font-bold ${u.accountStatus === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                      {u.accountStatus === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />} 
                      {u.accountStatus === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleToggleSeller(u.id)}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    u.isSeller ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                  }`}
                >
                  <Shield size={16} /> {u.isSeller ? 'Thu hồi Seller' : 'Cấp quyền Seller'}
                </button>
                <button 
                  onClick={() => handleToggleStatus(u.id, u.accountStatus)}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    u.accountStatus === 'Active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  {u.accountStatus === 'Active' ? <ShieldAlert size={16} /> : <Shield size={16} />} 
                  {u.accountStatus === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button 
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                page === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
