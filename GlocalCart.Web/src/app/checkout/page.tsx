'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { CreditCard, MapPin, Loader2, QrCode, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';
import { useNotificationStore, useBellStore } from '@/lib/store';
import PaymentModal from '@/components/PaymentModal';

export default function CheckoutPage() {
  const { isAuthenticated, isLoading: authLoading, user, refreshUser } = useAuth();
  const { items, totalAmount, totalItems, setIsCartOpen, clearCart } = useCart();
  const router = useRouter();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<number>(0); // 0: CreditCard(COD), 1: ElectronicBankTransfer
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [coinsToUse, setCoinsToUse] = useState(0);

  // Add Address State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    streetAddress: '',
    zipcode: '00000',
    country: 'Vietnam'
  });

  const [provincesData, setProvincesData] = useState<any[]>([]);
  const [selectedProvCode, setSelectedProvCode] = useState('');
  const [selectedDistCode, setSelectedDistCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  useEffect(() => {
    fetch('/api/provinces')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error("Failed to load provinces", data.error);
        } else {
          setProvincesData(data);
        }
      })
      .catch(err => console.error("Failed to load provinces", err));
  }, []);

  const activeProvince = provincesData.find(p => p.code.toString() === selectedProvCode);
  const activeDistrict = activeProvince?.districts?.find((d:any) => d.code.toString() === selectedDistCode);

  // For QR Modal
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (isAuthenticated) refreshUser();
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchAddresses = async () => {
        try {
          const res = await api.users.getAddresses();
          setAddresses(res);
          if (res.length > 0) {
            setSelectedAddressId(res[0].id);
          }
        } catch (error) {
          console.error('Failed to fetch addresses', error);
        } finally {
          setIsLoadingAddresses(false);
        }
      };
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProvince || !activeDistrict || !selectedWardCode) {
      addNotification('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã', 'error');
      return;
    }
    const activeWard = activeDistrict.wards.find((w:any) => w.code.toString() === selectedWardCode);

    try {
      const payload = {
        ...newAddress,
        city: activeProvince.name,
        state: `${activeDistrict.name}, ${activeWard?.name || ''}`
      };
      const res = await api.users.createAddress(payload);
      setAddresses([...addresses, res]);
      setSelectedAddressId(res.id);
      setShowAddAddress(false);
      setNewAddress({ streetAddress: '', zipcode: '00000', country: 'Vietnam' });
      setSelectedProvCode('');
      setSelectedDistCode('');
      setSelectedWardCode('');
      addNotification('Thêm địa chỉ thành công', 'success');
    } catch (error: any) {
      addNotification(error.message || 'Lỗi khi thêm địa chỉ', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      addNotification('Vui lòng chọn địa chỉ giao hàng', 'error');
      return;
    }
    if (items.length === 0) {
      addNotification('Giỏ hàng trống', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        shippingAddressId: selectedAddressId,
        paymentMethod: paymentMethod,
        note: 'Đơn hàng từ Web GlocalCart',
        coinsToUse: coinsToUse,
        items: items.map(i => ({ productId: i.id, quantity: i.quantity }))
      };

      const orderRes = await api.orders.create(orderData);
      
      if (paymentMethod === 1) { // QR Transfer
        const qrRes = await api.payments.initiate(orderRes.id);
        setQrUrl(qrRes.vietQrUrl);
        setShowQR(true);
        // Add bell notification
        useBellStore.getState().addNotification({
          type: 'order',
          title: 'Đang chờ thanh toán QR',
          message: `Đơn hàng #${orderRes.id} đang chờ bạn quét mã QR để hoàn tất.`
        });
      } else {
        clearCart();
        addNotification('Đặt hàng thành công!', 'success');
        // Add bell notification
        useBellStore.getState().addNotification({
          type: 'order',
          title: 'Đặt hàng thành công',
          message: `Đơn hàng #${orderRes.id} của bạn đã được tiếp nhận và đang chờ xử lý.`
        });
        router.push('/');
      }
    } catch (error: any) {
      addNotification(error.message || 'Lỗi khi đặt hàng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return <div className="min-h-screen bg-bg-main flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  const shippingFee = 30000;
  const grandTotal = totalAmount + shippingFee - coinsToUse;
  const coinsEarned = Math.floor(totalAmount / 100);

  return (
    <div className="bg-bg-main min-h-screen pb-20">
      <div className="container-fluid px-[5%] py-6">
        <BackButton />
      </div>

      <div className="px-[5%] max-w-6xl mx-auto">
        <h1 className="text-4xl font-black tracking-tighter text-foreground mb-10">THANH TOÁN</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div className="flex flex-col gap-6">
            {/* Address Selection */}
            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <MapPin size={20} />
                </div>
                <h2 className="text-xl font-black text-foreground">Địa chỉ giao hàng</h2>
              </div>
              
              {isLoadingAddresses ? (
                <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {addresses.length === 0 && !showAddAddress && (
                    <p className="text-muted-foreground font-medium mb-2">Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ mới.</p>
                  )}
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex flex-col gap-1 p-4 border rounded-xl cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <div className="flex items-center gap-2">
                        <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="accent-primary" />
                        <span className="font-bold text-foreground">{addr.streetAddress}</span>
                      </div>
                      <span className="text-sm text-muted-foreground ml-5">{addr.city}, {addr.state}, {addr.country}</span>
                    </label>
                  ))}

                  {!showAddAddress ? (
                    <button 
                      onClick={() => setShowAddAddress(true)}
                      className="mt-2 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground font-bold hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Plus size={20} /> Thêm địa chỉ mới
                    </button>
                  ) : (
                    <form onSubmit={handleAddAddress} className="mt-4 p-5 border border-border rounded-xl bg-background flex flex-col gap-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-foreground">Thêm Địa Chỉ Mới</h3>
                        <button type="button" onClick={() => setShowAddAddress(false)} className="text-muted-foreground hover:text-danger"><X size={20}/></button>
                      </div>
                      <input 
                        type="text" required placeholder="Địa chỉ cụ thể (Số nhà, đường...)" 
                        value={newAddress.streetAddress} onChange={e => setNewAddress({...newAddress, streetAddress: e.target.value})}
                        className="w-full bg-bg-main border border-border rounded-lg px-4 py-3 outline-none focus:border-primary"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select 
                          required
                          value={selectedProvCode} 
                          onChange={e => {
                            setSelectedProvCode(e.target.value);
                            setSelectedDistCode('');
                            setSelectedWardCode('');
                          }}
                          className="w-full bg-bg-main border border-border rounded-lg px-4 py-3 outline-none focus:border-primary"
                        >
                          <option value="">Tỉnh/Thành phố</option>
                          {provincesData.map((p:any) => (
                            <option key={p.code} value={p.code}>{p.name}</option>
                          ))}
                        </select>

                        <select 
                          required
                          value={selectedDistCode} 
                          onChange={e => {
                            setSelectedDistCode(e.target.value);
                            setSelectedWardCode('');
                          }}
                          disabled={!selectedProvCode}
                          className="w-full bg-bg-main border border-border rounded-lg px-4 py-3 outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="">Quận/Huyện</option>
                          {activeProvince?.districts?.map((d:any) => (
                            <option key={d.code} value={d.code}>{d.name}</option>
                          ))}
                        </select>

                        <select 
                          required
                          value={selectedWardCode} 
                          onChange={e => setSelectedWardCode(e.target.value)}
                          disabled={!selectedDistCode}
                          className="w-full bg-bg-main border border-border rounded-lg px-4 py-3 outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="">Phường/Xã</option>
                          {activeDistrict?.wards?.map((w:any) => (
                            <option key={w.code} value={w.code}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors mt-2">
                        LƯU ĐỊA CHỈ
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-xl font-black text-foreground">Phương thức thanh toán</h2>
              </div>
              <div className="flex flex-col gap-3">
                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 0 ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 0} onChange={() => setPaymentMethod(0)} className="accent-primary" />
                  <span className="font-bold text-foreground flex items-center gap-2"><CreditCard size={18}/> Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 1 ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 1} onChange={() => setPaymentMethod(1)} className="accent-primary" />
                  <span className="font-bold text-foreground flex items-center gap-2"><QrCode size={18}/> Chuyển khoản QR VietQR</span>
                </label>
              </div>
            </div>

            {/* Coins Selection */}
            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <Plus size={20} />
                </div>
                <h2 className="text-xl font-black text-foreground">Sử dụng Glocal Coins</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-black">C</div>
                    <div>
                      <p className="font-black text-sm text-foreground">Bạn đang có <span className="text-amber-500 text-lg">{user?.coins?.toLocaleString() || 0}</span> xu</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">1 xu = 1đ | Giảm tối đa 100%</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (coinsToUse > 0) {
                        setCoinsToUse(0);
                      } else {
                        const amount = Math.min(user?.coins || 0, totalAmount);
                        setCoinsToUse(amount);
                        addNotification(`Đã áp dụng giảm giá ${amount.toLocaleString()}đ`, 'success');
                      }
                    }}
                    className={`px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-lg ${coinsToUse > 0 ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20 hover:scale-105 active:scale-95'}`}
                  >
                    {coinsToUse > 0 ? 'ĐANG ÁP DỤNG' : 'DÙNG NGAY'}
                  </button>
                </div>
                {coinsToUse > 0 && (
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 px-4">
                    <Plus size={14} className="rotate-45" /> Giảm giá {coinsToUse.toLocaleString()}đ từ xu của bạn
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border shadow-sm h-fit sticky top-28">
            <h2 className="text-xl font-black text-foreground mb-6">Tóm tắt đơn hàng</h2>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center text-muted-foreground font-medium">
                <span>Tạm tính ({totalItems} sản phẩm)</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground font-medium">
                <span>Phí giao hàng</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)}</span>
              </div>
              {coinsToUse > 0 && (
                <div className="flex justify-between items-center text-amber-500 font-bold">
                  <span>Giảm giá từ xu</span>
                  <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coinsToUse)}</span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-black text-foreground">Tổng cộng</span>
                <span className="text-3xl font-black text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal)}</span>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl mb-8 flex items-center gap-3 border border-primary/10">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Plus size={16}/></div>
              <p className="text-xs font-bold text-primary">Bạn sẽ tích thêm <span className="font-black">+{coinsEarned.toLocaleString()} xu</span> sau khi hoàn tất đơn hàng này.</p>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting || items.length === 0}
              className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-lg flex justify-center items-center gap-2 shadow-xl hover:bg-primary hover:text-white transition-all disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'ĐẶT HÀNG NGAY'}
            </button>
          </div>
        </div>
      </div>

      {showQR && (
        <PaymentModal 
          qrUrl={qrUrl} 
          amount={grandTotal}
          onClose={() => {
            setShowQR(false);
            clearCart();
            router.push('/');
          }} 
        />
      )}
    </div>
  );
}
