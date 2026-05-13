'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { api, getFileUrl } from '@/lib/api';
import { 
  User, Mail, Phone, Calendar, Save, Loader2, Package, ShoppingBag, 
  CreditCard, Heart, BarChart3, ChevronRight, Wallet, Truck, 
  CheckCircle, Star, MapPin, Lock, Store, HelpCircle, Bell, Info,
  LayoutDashboard, Settings, LogOut, ShieldCheck, FolderTree, Users,
  Search, ShieldAlert, Eye, Camera, MessageCircle, Diamond, Shield,
  Plus, Edit, Trash, Key, KeyRound, RefreshCw, CheckCircle2, Clock,
  ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'overview' | 'profile' | 'security' | 'orders' | 'coins' | 'admin-dashboard' | 'admin-users' | 'admin-orders' | 'admin-products' | 'admin-categories';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { wishlist } = useWishlist();
  const router = useRouter();
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [orderFilter, setOrderFilter] = useState<string>('All');
  
  const [hoveredSidebar, setHoveredSidebar] = useState<string | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<number | null>(null);
  const [hoveredUtility, setHoveredUtility] = useState<number | null>(null);

  const [adminData, setAdminData] = useState<any>(null);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [coinHistory, setCoinHistory] = useState<any[]>([]);
  const [coinHistoryLoading, setCoinHistoryLoading] = useState(false);
  
  const [formData, setFormData] = useState({ fullName: '', phoneNumber: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace('#', '');
      const [tab, filter] = fullHash.split('?filter=') as [TabType, string | undefined];
      
      const validTabs: TabType[] = ['overview', 'profile', 'security', 'orders', 'coins', 'admin-dashboard', 'admin-users', 'admin-orders', 'admin-products', 'admin-categories'];
      if (validTabs.includes(tab)) {
        setActiveTab(tab);
        if (filter) setOrderFilter(filter);
        else if (tab === 'orders' && !filter) setOrderFilter('All');
        setCurrentPage(1); 
      }
    };

    if (window.location.hash) {
      handleHashChange();
    } else {
      window.history.replaceState(null, '', '#overview');
      setActiveTab('overview');
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (tab: TabType, filter?: string) => {
    if (filter) {
      window.location.hash = `${tab}?filter=${filter}`;
    } else {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) return;
      try {
        const profileData = await api.users.getProfile();
        setProfile(profileData);
        setFormData({ 
          fullName: profileData.fullName || '', 
          phoneNumber: profileData.phoneNumber || '' 
        });
        
        const ordersData = await api.orders.getMyOrders();
        setStats({
          totalOrders: ordersData.totalCount || ordersData.items?.length || 0,
          wishlistCount: wishlist.length,
          cartCount: cartCount,
        });
      } catch (error) {
        addNotification('Không thể tải thông tin hồ sơ', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated, wishlist.length, cartCount]);

  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      const fetchUserOrders = async () => {
        setOrdersLoading(true);
        try {
          const res = await api.orders.getMyOrders(currentPage);
          setUserOrders(res.items || res);
          if (res.totalCount) setTotalPages(Math.ceil(res.totalCount / 10));
        } catch (error) {
          addNotification('Không thể tải danh sách đơn hàng', 'error');
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchUserOrders();
    }
    
    if ((activeTab === 'overview' || activeTab === 'coins') && isAuthenticated) {
      const fetchCoinHistory = async () => {
        setCoinHistoryLoading(true);
        try {
          const res = await api.users.getCoinHistory();
          setCoinHistory(res);
        } catch (error) {
          console.error('Failed to fetch coin history', error);
        } finally {
          setCoinHistoryLoading(false);
        }
      };
      fetchCoinHistory();
    }
  }, [activeTab, isAuthenticated, currentPage]);

  useEffect(() => {
    if (!profile || profile.role !== 'Admin' || !activeTab.startsWith('admin-')) return;
    const fetchAdminContent = async () => {
      setAdminLoading(true);
      try {
        if (activeTab === 'admin-dashboard') {
          const data = await api.admin.getDashboard();
          setAdminData(data);
        } else if (activeTab === 'admin-users') {
          const data = await api.admin.getUsers(currentPage);
          setAdminList(data.items || []);
          if (data.totalCount) setTotalPages(Math.ceil(data.totalCount / 10));
        } else if (activeTab === 'admin-orders') {
          const data = await api.admin.getOrders(currentPage);
          setAdminList(data.items || []);
          if (data.totalCount) setTotalPages(Math.ceil(data.totalCount / 10));
        } else if (activeTab === 'admin-products') {
          const data = await api.products.getAll();
          setAdminList(Array.isArray(data) ? data : []);
          setTotalPages(1); 
        } else if (activeTab === 'admin-categories') {
          const data = await api.categories.getAll();
          setAdminList(Array.isArray(data) ? data : []);
          setTotalPages(1);
        }
      } catch (err) {
        addNotification('Lỗi tải dữ liệu quản trị', 'error');
      } finally {
        setAdminLoading(false);
      }
    };
    fetchAdminContent();
  }, [activeTab, profile, currentPage]);

  const handleActivateSeller = async () => {
    if (window.confirm('Bạn muốn trở thành Người bán?')) {
      try {
        await api.users.activateSeller();
        updateUser({ ...user!, isSeller: true, role: 'Seller' });
        setProfile({ ...profile, role: 'Seller' });
        addNotification('🎉 Chúc mừng! Bạn đã là Người bán.', 'success');
      } catch (err: any) {
        addNotification('Lỗi: ' + err.message, 'error');
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.users.updateProfile(formData);
      addNotification('Cập nhật hồ sơ thành công!', 'success');
      const data = await api.users.getProfile();
      setProfile(data);
      updateUser({ ...user!, fullName: formData.fullName, phone: formData.phoneNumber });
    } catch (error: any) {
      addNotification(error.message || 'Lỗi cập nhật', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.users.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      addNotification('Đổi mật khẩu thành công!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      addNotification(error.message || 'Lỗi đổi mật khẩu', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-[80vh] flex items-center justify-center bg-bg-main"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;
  }

  if (!profile) return null;

  const sidebarMainItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
    { id: 'coins', label: 'Glocal Coins', icon: Diamond },
    { id: 'security', label: 'Bảo mật', icon: ShieldCheck },
  ];

  const adminSidebarItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: BarChart3, color: 'bg-red-500' },
    { id: 'admin-users', label: 'Người dùng', icon: Users, color: 'bg-blue-500' },
    { id: 'admin-orders', label: 'Đơn hàng', icon: ShoppingBag, color: 'bg-amber-600' },
    { id: 'admin-products', label: 'Sản phẩm', icon: Package, color: 'bg-emerald-500' },
    { id: 'admin-categories', label: 'Danh mục', icon: FolderTree, color: 'bg-slate-700' },
  ];

  const orderStatuses = [
    { label: 'Chờ xác nhận', status: 'Pending', icon: Wallet, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Đang giao', status: 'Shipped', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Đã giao', status: 'Complete', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Đánh giá', status: 'Complete', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' }
  ];

  const utilities = [
    { icon: MapPin, label: 'Sổ Địa Chỉ', color: 'text-red-500', bg: 'bg-red-500/10' },
    { icon: CreditCard, label: 'Thanh Toán', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Lock, label: 'Đổi Mật Khẩu', color: 'text-amber-500', bg: 'bg-amber-500/10', tab: 'security' },
    { icon: Heart, label: 'Yêu Thích', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { icon: Store, label: profile.role === 'Seller' ? 'Cửa Hàng' : 'Bán Hàng', color: 'text-emerald-500', bg: 'bg-emerald-500/10', action: profile.role !== 'Seller' ? handleActivateSeller : undefined },
    { icon: HelpCircle, label: 'Hỗ Trợ', color: 'text-purple-500', bg: 'bg-purple-500/10' }
  ];

  const getOrderStatusInfo = (status: string) => {
    switch (status) {
      case 'Pending': return { label: 'Chờ xác nhận', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Clock };
      case 'Processing': return { label: 'Đang xử lý', color: 'text-primary', bg: 'bg-primary/10', icon: RefreshCw };
      case 'Shipped': return { label: 'Đang giao hàng', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Truck };
      case 'Complete': return { label: 'Đã hoàn tất', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 };
      case 'Delivered': return { label: 'Đã giao hàng', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 };
      case 'Cancelled': return { label: 'Đã hủy', color: 'text-red-500', bg: 'bg-red-500/10', icon: ShieldAlert };
      default: return { label: status, color: 'text-muted-foreground', bg: 'bg-bg-main', icon: Package };
    }
  };

  const filteredOrders = userOrders.filter(order => {
    if (orderFilter === 'All') return true;
    return order.status === orderFilter;
  });

  const Pagination = () => (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button 
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        className="p-3 bg-card border border-border rounded-xl disabled:opacity-30 hover:bg-muted transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="font-black text-sm">TRANG {currentPage}</span>
      <button 
        disabled={currentPage >= totalPages}
        onClick={() => setCurrentPage(prev => prev + 1)}
        className="p-3 bg-card border border-border rounded-xl disabled:opacity-30 hover:bg-muted transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );

  return (
    <div className="bg-bg-main min-h-screen pt-6 pb-12">
      <div className="container-fluid px-[4%] max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDEBAR - STICKY */}
          <aside className="w-full lg:w-[320px] flex flex-col gap-6 sticky top-28">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full" />
              <div className="relative">
                <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-4xl font-black border-4 border-background shadow-lg">
                  {profile.fullName?.charAt(0) || 'U'}
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-background border-2 border-border rounded-full flex items-center justify-center text-muted-foreground shadow-sm"><Camera size={14} /></div>
              </div>
              <h2 className="text-xl font-black text-foreground mt-4 truncate w-full">{profile.fullName}</h2>
              <div className="flex flex-col gap-2 mt-4 items-center w-full">
                <div className="px-4 py-1.5 bg-primary text-white font-bold text-[10px] rounded-full uppercase tracking-wider shadow-sm">
                  {profile.role === 'Admin' ? '👑 Admin' : profile.role === 'Seller' ? '🏪 Seller' : '🛒 Member'}
                </div>
                <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs bg-amber-500/10 px-3 py-1 rounded-full cursor-pointer hover:bg-amber-500/20 transition-all" onClick={() => changeTab('coins')}>
                  <Diamond size={12} /> {profile.coins?.toLocaleString() || 0} xu
                </div>
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden p-2">
              <nav className="flex flex-col gap-1 relative">
                {sidebarMainItems.map(item => (
                  <motion.button 
                    key={item.id}
                    onMouseEnter={() => setHoveredSidebar(item.id)}
                    onMouseLeave={() => setHoveredSidebar(null)}
                    onClick={() => changeTab(item.id as TabType)}
                    className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all duration-300 z-10 ${activeTab === item.id ? 'text-white' : 'text-muted-foreground hover:text-primary'}`}
                  >
                    {activeTab === item.id && (
                      <motion.div 
                        layoutId="active-pill" 
                        className="absolute inset-0 bg-primary rounded-2xl -z-10 shadow-lg shadow-primary/30" 
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} 
                      />
                    )}
                    {hoveredSidebar === item.id && activeTab !== item.id && (
                      <motion.div layoutId="sidebar-hover" className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl -z-10" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />
                    )}
                    <item.icon size={20} className={activeTab === item.id || hoveredSidebar === item.id ? 'scale-110 transition-transform' : ''} /> {item.label}
                  </motion.button>
                ))}

                {profile.role === 'Admin' && (
                  <>
                    <div className="h-px bg-border my-2 mx-4"></div>
                    <p className="px-5 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Quản trị</p>
                    {adminSidebarItems.map(item => (
                      <motion.button 
                        key={item.id}
                        onMouseEnter={() => setHoveredSidebar(item.id)}
                        onMouseLeave={() => setHoveredSidebar(null)}
                        onClick={() => changeTab(item.id as TabType)}
                        className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all duration-300 z-10 ${activeTab === item.id ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {activeTab === item.id && (
                          <motion.div 
                            layoutId="active-pill-admin" 
                            className={`absolute inset-0 ${item.color} rounded-2xl -z-10 shadow-lg shadow-black/10`} 
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} 
                          />
                        )}
                        {hoveredSidebar === item.id && activeTab !== item.id && (
                          <motion.div 
                            layoutId="sidebar-hover" 
                            className={`absolute inset-0 ${item.color.replace('bg-', 'bg-')}/10 rounded-2xl -z-10`} 
                            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} 
                          />
                        )}
                        <item.icon size={20} className={activeTab === item.id || hoveredSidebar === item.id ? 'scale-110 transition-transform' : ''} /> {item.label}
                      </motion.button>
                    ))}
                  </>
                )}
                <div className="h-px bg-border my-2 mx-4"></div>
                <button onClick={() => logout()} className="flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm text-red-500 hover:bg-red-500/10 transition-all"><LogOut size={20} /> Đăng xuất</button>
              </nav>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 min-w-0 min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                {/* ... existing tab content ... */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div className="bg-card rounded-[32px] border border-border shadow-sm p-8">
                      <div className="flex items-center justify-between mb-8"><h3 className="text-xl font-black flex items-center gap-2"><ShoppingBag className="text-primary" /> Đơn Mua</h3><button onClick={() => changeTab('orders')} className="text-xs font-black text-primary hover:underline flex items-center gap-1">Lịch sử đơn hàng <ChevronRight size={14}/></button></div>
                      <div className="grid grid-cols-4 gap-4 relative">
                        {orderStatuses.map((item, i) => (
                          <div 
                            key={i} 
                            onMouseEnter={() => setHoveredStatus(i)}
                            onMouseLeave={() => setHoveredStatus(null)}
                            className="relative flex flex-col items-center gap-3 p-6 rounded-[32px] transition-all cursor-pointer z-10" 
                            onClick={() => changeTab('orders', item.status)}
                          >
                            {hoveredStatus === i && (
                              <motion.div layoutId="status-hover" className="absolute inset-0 bg-muted/40 dark:bg-muted/20 rounded-[32px] -z-10" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />
                            )}
                            <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-full flex items-center justify-center transition-all ${hoveredStatus === i ? 'scale-110 shadow-lg' : ''}`}><item.icon size={28} /></div>
                            <span className="text-[13px] font-black text-foreground text-center leading-tight">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-card rounded-[32px] border border-border shadow-sm p-8">
                      <h3 className="text-xl font-black mb-8">Lịch sử tích xu</h3>
                      {coinHistoryLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-500" /></div> : coinHistory.length === 0 ? (
                        <p className="text-center text-muted-foreground font-bold py-10">Bạn chưa có giao dịch xu nào.</p>
                      ) : (
                        <div className="space-y-4">
                          {coinHistory.slice(0, 5).map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-amber-200 transition-all">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {tx.amount > 0 ? '+' : ''}
                                </div>
                                <div>
                                  <p className="font-black text-sm">{tx.description}</p>
                                  <p className="text-[10px] text-muted-foreground font-bold">{new Date(tx.transactionDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                              </div>
                              <div className={`font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} xu
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="bg-card rounded-[32px] border border-border shadow-sm p-8">
                      <h3 className="text-xl font-black mb-8">Tiện Ích Hệ Thống</h3>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-6 relative">
                        {utilities.map((item, i) => (
                          <div 
                            key={i} 
                            onMouseEnter={() => setHoveredUtility(i)}
                            onMouseLeave={() => setHoveredUtility(null)}
                            onClick={item.action || (item.tab ? () => changeTab(item.tab as TabType) : () => addNotification(`Chức năng ${item.label} đang được cập nhật`, 'info'))} 
                            className="relative flex flex-col items-center gap-4 p-6 rounded-[32px] transition-all cursor-pointer z-10"
                          >
                            {hoveredUtility === i && (
                              <motion.div layoutId="utility-hover" className="absolute inset-0 bg-muted/40 dark:bg-muted/20 rounded-[32px] -z-10" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />
                            )}
                            <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center transition-all ${hoveredUtility === i ? 'scale-110 shadow-lg rotate-3' : ''}`}><item.icon size={28} /></div>
                            <span className="text-[13px] font-black text-foreground text-center">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <ShoppingBag size={28} className="text-primary" />
                        <h3 className="text-2xl font-black">Đơn hàng của tôi</h3>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['All', 'Pending', 'Shipped', 'Complete'].map(status => (
                          <button 
                            key={status}
                            onClick={() => { setOrderFilter(status); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${orderFilter === status ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'}`}
                          >
                            {status === 'All' ? 'TẤT CẢ' : status === 'Pending' ? 'CHỜ XÁC NHẬN' : status === 'Shipped' ? 'ĐANG GIAO' : 'ĐÃ HOÀN TẤT'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {ordersLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div> : filteredOrders.length === 0 ? (
                      <div className="bg-card p-12 rounded-[32px] border border-border shadow-sm flex flex-col items-center text-center">
                        <Package size={64} className="text-muted-foreground opacity-30 mb-4" />
                        <h4 className="text-xl font-black">Không có đơn hàng nào</h4>
                        <p className="text-muted-foreground font-bold mt-2">Trạng thái này hiện đang trống.</p>
                        <button onClick={() => setOrderFilter('All')} className="mt-6 px-8 py-3 bg-primary text-white rounded-2xl font-black hover:scale-105 transition-transform">XEM TẤT CẢ</button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-6">
                          {filteredOrders.map(order => {
                            const statusInfo = getOrderStatusInfo(order.status);
                            const StatusIcon = statusInfo.icon;
                            return (
                              <div key={order.id} className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden hover:border-primary/50 transition-all group">
                                <div className="p-6 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div>
                                    <div className="text-sm font-black text-muted-foreground mb-1">Đơn hàng <span className="text-foreground uppercase">#{order.orderNumber}</span></div>
                                    <div className="text-xs text-muted-foreground font-bold">Ngày đặt: {new Date(order.orderDate).toLocaleDateString('vi-VN')}</div>
                                  </div>
                                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs ${statusInfo.bg} ${statusInfo.color}`}><StatusIcon size={16} /> {statusInfo.label}</div>
                                </div>
                                <div className="p-6 space-y-4">
                                  {order.items.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-4">
                                      <div className="relative w-20 h-20 bg-muted rounded-2xl overflow-hidden shrink-0 border border-border">
                                        {item.productImage ? (
                                          <img 
                                            src={getFileUrl(item.productImage)} 
                                            alt={item.productName} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image';
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <Package size={24} />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0"><h4 className="font-black text-foreground truncate">{item.productName}</h4><p className="text-xs font-bold text-muted-foreground mt-1">Cung cấp bởi: <span className="text-primary">{item.sellerName}</span></p><div className="text-sm font-black text-muted-foreground mt-2">x{item.quantity}</div></div>
                                      <div className="text-right shrink-0"><div className="font-black text-primary">{item.subtotal?.toLocaleString()}đ</div></div>
                                    </div>
                                  ))}
                                </div>
                                <div className="p-6 border-t border-border bg-muted/10 flex flex-col items-end gap-2">
                                  {order.coinsUsed > 0 && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                                      <Diamond size={12}/> Đã dùng: -{order.coinsUsed.toLocaleString()} xu
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center w-full">
                                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Tổng tiền:</div>
                                    <div className="text-2xl font-black text-foreground">{order.totalAmount?.toLocaleString()}đ</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {totalPages > 1 && <Pagination />}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="bg-card p-10 rounded-3xl border border-border shadow-sm">
                    <div className="mb-10 pb-6 border-b border-border flex items-center justify-between">
                      <h3 className="text-2xl font-black flex items-center gap-3"><User size={28} className="text-primary" /> Hồ sơ cá nhân</h3>
                      <p className="text-xs font-bold text-muted-foreground">ID: {profile.id}</p>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><User size={14}/> Họ và tên</label>
                          <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-bg-main border-2 border-border rounded-2xl px-6 py-4 outline-none focus:border-primary font-black text-foreground transition-colors" placeholder="Nhập họ tên của bạn" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Phone size={14}/> Số điện thoại</label>
                          <input type="text" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-bg-main border-2 border-border rounded-2xl px-6 py-4 outline-none focus:border-primary font-black text-foreground transition-colors" placeholder="Nhập số điện thoại" />
                        </div>
                      </div>
                      <div className="pt-4">
                        <button type="submit" disabled={saving} className="px-12 py-5 bg-primary text-white rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30">
                          {saving ? <Loader2 className="animate-spin" /> : <Save />} {saving ? 'ĐANG CẬP NHẬT...' : 'LƯU THAY ĐỔI'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="bg-card p-10 rounded-3xl border border-border shadow-sm">
                    <div className="mb-10 pb-6 border-b border-border">
                      <h3 className="text-2xl font-black flex items-center gap-3"><Lock size={28} className="text-amber-500" /> Bảo mật & Tài khoản</h3>
                      <p className="text-sm font-bold text-muted-foreground mt-2">Quản lý mật khẩu và các tùy chọn bảo mật của bạn.</p>
                    </div>
                    <form onSubmit={handleChangePassword} className="space-y-8 max-w-md">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mật khẩu hiện tại</label>
                          <div className="relative"><Key className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /><input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full bg-bg-main border-2 border-border rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-primary font-black transition-colors" /></div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mật khẩu mới</label>
                          <div className="relative"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /><input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full bg-bg-main border-2 border-border rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-primary font-black transition-colors" /></div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Xác nhận mật khẩu mới</label>
                          <div className="relative"><Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /><input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full bg-bg-main border-2 border-border rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-primary font-black transition-colors" /></div>
                        </div>
                      </div>
                      <button type="submit" disabled={saving} className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-amber-500/20">
                        {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck />} {saving ? 'ĐANG XỬ LÝ...' : 'ĐỔI MẬT KHẨU'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'coins' && (
                  <div className="space-y-8">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-10 rounded-[40px] text-white shadow-2xl shadow-amber-500/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-10"><Diamond size={200} /></div>
                      <div className="relative z-10">
                        <p className="text-sm font-black uppercase tracking-[4px] opacity-80 mb-2">Số dư hiện tại</p>
                        <h3 className="text-7xl font-black mb-6">{profile.coins?.toLocaleString() || 0} <span className="text-3xl opacity-80">xu</span></h3>
                        <div className="flex gap-4">
                          <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-sm">1 xu = 1đ</div>
                          <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2"><CheckCircle2 size={16}/> Đang hoạt động</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card p-10 rounded-[40px] border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-10">
                        <h3 className="text-2xl font-black flex items-center gap-3"><RefreshCw size={28} className="text-amber-500" /> Lịch sử giao dịch</h3>
                        <button onClick={() => api.users.getCoinHistory().then(setCoinHistory)} className="p-3 bg-muted rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"><RefreshCw size={20}/></button>
                      </div>
                      
                      {coinHistoryLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500 w-12 h-12" /></div>
                      ) : coinHistory.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                          <Diamond size={64} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                          <p className="text-xl font-black text-muted-foreground">Chưa có giao dịch nào</p>
                          <p className="text-sm font-bold text-muted-foreground/60 mt-2">Bắt đầu mua sắm để tích lũy Glocal Coins ngay!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {coinHistory.map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between p-6 bg-muted/20 rounded-[32px] border border-transparent hover:border-amber-200 transition-all group">
                              <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all group-hover:scale-110 ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {tx.amount > 0 ? '+' : '-'}
                                </div>
                                <div>
                                  <p className="font-black text-lg">{tx.description}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-muted-foreground font-bold flex items-center gap-1"><Clock size={12}/> {new Date(tx.transactionDate).toLocaleString('vi-VN')}</p>
                                    {tx.orderId && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">Mã đơn: #{tx.orderId}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className={`text-xl font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} xu
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'admin-products' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black flex items-center gap-2 text-emerald-500"><Package /> Quản lý Sản phẩm</h3>
                    {adminLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {adminList.map(p => (
                            <div key={p.id} className="bg-card rounded-[32px] border border-border overflow-hidden group hover:border-primary/50 transition-all shadow-sm">
                              <div className="h-40 bg-muted relative">
                                <img 
                                  src={getFileUrl(p.images?.[0]?.imageUrl)} 
                                  alt={p.name} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image';
                                  }}
                                />
                              </div>
                              <div className="p-6"><h4 className="font-black text-sm truncate">{p.name}</h4><p className="text-primary font-black mt-2">{p.price?.toLocaleString()}đ</p><div className="mt-4 flex gap-2"><button className="flex-1 py-2 bg-muted rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all">KHÓA SP</button><button className="p-2 bg-muted rounded-xl"><Eye size={16}/></button></div></div>
                            </div>
                          ))}
                        </div>
                        {totalPages > 1 && <Pagination />}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'admin-categories' && (
                  <div className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-border flex items-center justify-between"><h3 className="text-2xl font-black flex items-center gap-3 text-slate-700"><FolderTree /> Quản lý Danh mục</h3><button className="flex items-center gap-2 px-6 py-2 bg-slate-700 text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform"><Plus size={18}/> THÊM MỚI</button></div>
                    {adminLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : (
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {adminList.map(c => (
                          <div key={c.id} className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-transparent hover:border-slate-300 transition-all group">
                            <div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-700/10 text-slate-700 rounded-xl flex items-center justify-center font-black">{c.name?.charAt(0)}</div><span className="font-black">{c.name}</span></div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg"><Edit size={16}/></button><button className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash size={16}/></button></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'admin-orders' && (
                  <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                      <h3 className="font-black text-lg flex items-center gap-2"><ShoppingBag className="text-amber-600" /> Quản lý Đơn hàng Hệ thống</h3>
                    </div>
                    {adminLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                                <th className="px-6 py-4">Mã đơn</th>
                                <th className="px-6 py-4">Khách hàng</th>
                                <th className="px-6 py-4">Ngày đặt</th>
                                <th className="px-6 py-4">Tổng tiền</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {adminList.map(o => {
                                const statusInfo = getOrderStatusInfo(o.status);
                                return (
                                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4"><span className="font-black text-sm">#{o.orderNumber}</span></td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-black">{o.buyerName}</span>
                                        <span className="text-[10px] text-muted-foreground">{o.buyerEmail}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{new Date(o.orderDate).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 font-black text-primary text-sm">
                                      {o.totalAmount?.toLocaleString()}đ
                                      {o.coinsUsed > 0 && (
                                        <div className="text-[10px] text-amber-500 font-bold">- {o.coinsUsed.toLocaleString()} xu</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusInfo.bg} ${statusInfo.color}`}>
                                        {statusInfo.label}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      {o.status !== 'Complete' && o.status !== 'Delivered' && o.status !== 'Cancelled' && (
                                        <button 
                                          onClick={async () => {
                                            if (window.confirm(`Xác nhận hoàn tất đơn hàng #${o.orderNumber}?`)) {
                                              try {
                                                await api.admin.updateOrderStatus(o.id, 'Complete');
                                                addNotification('Đã đánh dấu đơn hàng là hoàn tất', 'success');
                                                // Refresh list
                                                const data = await api.admin.getOrders(currentPage);
                                                setAdminList(data.items || []);
                                              } catch (err: any) {
                                                addNotification(err.message, 'error');
                                              }
                                            }
                                          }}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                                        >
                                          <CheckCircle2 size={14}/> HOÀN TẤT
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {totalPages > 1 && <Pagination />}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'admin-users' && (
                  <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between"><h3 className="font-black text-lg flex items-center gap-2"><Users className="text-blue-500" /> Quản lý Thành viên</h3></div>
                    {adminLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : (
                      <>
                        <div className="overflow-x-auto"><table className="w-full text-left"><tbody className="divide-y divide-border">
                          {adminList.map(u => (
                            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4 flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black">{u.fullName?.charAt(0) || 'U'}</div><div><p className="text-sm font-black">{u.fullName}</p><p className="text-[10px] text-muted-foreground">{u.email}</p></div></td>
                              <td className="px-6 py-4"><span className="px-3 py-1 bg-muted rounded-full text-[10px] font-black uppercase">{u.role}</span></td>
                            </tr>
                          ))}
                        </tbody></table></div>
                        {totalPages > 1 && <Pagination />}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'admin-dashboard' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-black flex items-center gap-3"><BarChart3 size={28} className="text-red-500" /> Thống kê tổng quan</h3>
                    {adminLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div> : adminData && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { label: 'Người dùng', value: adminData.totalUsers, icon: Users, color: 'text-blue-500' },
                          { label: 'Sản phẩm', value: adminData.totalProducts, icon: Package, color: 'text-purple-500' },
                          { label: 'Doanh thu', value: `${(adminData.totalRevenue / 1000000).toFixed(1)}M`, icon: BarChart3, color: 'text-rose-500' }
                        ].map((card, i) => (
                          <div key={i} className="bg-card p-10 rounded-[40px] border border-border flex flex-col items-center text-center shadow-sm">
                            <div className={`w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 ${card.color}`}><card.icon size={32} /></div>
                            <h4 className="text-4xl font-black">{card.value}</h4>
                            <p className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground mt-1">{card.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
