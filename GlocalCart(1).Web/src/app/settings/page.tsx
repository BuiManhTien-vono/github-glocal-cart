'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { KeyRound, MapPin, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/lib/store';

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await api.users.getAddresses();
        setAddresses(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification('Mật khẩu mới không khớp!', 'error');
      return;
    }
    
    setSavingPassword(true);
    try {
      await api.users.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      addNotification('Đổi mật khẩu thành công!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      addNotification(error.message || 'Đổi mật khẩu thất bại', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Users/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('glocal_token')}` }
      });
      setAddresses(addresses.filter(a => a.id !== id));
      addNotification('Đã xóa địa chỉ', 'success');
    } catch (error) {
      addNotification('Xóa địa chỉ thất bại', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="bg-bg-main min-h-screen pb-20 pt-10">
      <div className="container-fluid px-[5%] max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-8">CÀI ĐẶT</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Change Password Section */}
          <div className="bg-card p-8 rounded-3xl border border-border shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <h3 className="text-xl font-bold text-foreground">Đổi mật khẩu</h3>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full bg-bg-main border border-border rounded-xl px-4 py-3 outline-none focus:border-primary font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full bg-bg-main border border-border rounded-xl px-4 py-3 outline-none focus:border-primary font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full bg-bg-main border border-border rounded-xl px-4 py-3 outline-none focus:border-primary font-medium"
                  required
                />
              </div>
              
              <div className="mt-2">
                <button 
                  type="submit" 
                  disabled={savingPassword}
                  className="w-full px-8 py-3 bg-foreground text-background rounded-xl font-black flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors disabled:opacity-70"
                >
                  {savingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {savingPassword ? 'ĐANG LƯU...' : 'CẬP NHẬT MẬT KHẨU'}
                </button>
              </div>
            </form>
          </div>

          {/* Address Book Section */}
          <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Sổ địa chỉ</h3>
              </div>
              <button 
                onClick={() => router.push('/checkout')} 
                className="text-primary hover:bg-primary/10 p-2 rounded-xl transition-colors"
                title="Thêm địa chỉ khi thanh toán"
              >
                <Plus size={20} />
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-10">
                <MapPin size={48} className="mx-auto text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground font-medium">Chưa có địa chỉ nào được lưu.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {addresses.map(addr => (
                  <div key={addr.id} className="p-4 bg-bg-main border border-border rounded-2xl relative group">
                    {addr.isDefault && (
                      <span className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-md">
                        MẶC ĐỊNH
                      </span>
                    )}
                    <h4 className="font-bold text-foreground mb-1">{addr.fullName || 'Người nhận'}</h4>
                    <p className="text-sm font-medium text-muted-foreground">{addr.phoneNumber || 'Chưa có SĐT'}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {addr.streetAddress}, {addr.city}, {addr.state}
                    </p>
                    
                    {!addr.isDefault && (
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="absolute bottom-4 right-4 text-danger opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-danger/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
