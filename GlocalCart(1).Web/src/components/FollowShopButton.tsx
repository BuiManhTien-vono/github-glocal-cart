'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/lib/store';

interface FollowShopButtonProps {
  sellerId: number;
}

export default function FollowShopButton({ sellerId }: FollowShopButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countRes, statusRes] = await Promise.all([
          api.follows.getCount(sellerId),
          isAuthenticated ? api.follows.getStatus(sellerId) : Promise.resolve({ isFollowing: false })
        ]);
        
        setFollowerCount(countRes.count || 0);
        setIsFollowing(statusRes.isFollowing || false);
      } catch (error) {
        console.error('Error fetching follow status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sellerId, isAuthenticated]);

  const handleFollow = async () => {
    console.log('Follow Action:', { userId: user?.id, sellerId, isAuthenticated });
    if (!isAuthenticated) {
      addNotification('Vui lòng đăng nhập để theo dõi shop', 'error');
      return;
    }

    if (user?.id === sellerId) {
      addNotification('Bạn không thể tự theo dõi chính mình', 'error');
      return;
    }

    setActionLoading(true);
    try {
      if (isFollowing) {
        await api.follows.unfollow(sellerId);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        addNotification('Đã bỏ theo dõi shop', 'success');
      } else {
        await api.follows.follow(sellerId);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        addNotification('Đã theo dõi shop thành công', 'success');
      }
    } catch (error: any) {
      addNotification(error.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <button disabled className="w-full py-3 bg-muted text-muted-foreground rounded-2xl font-black text-sm flex items-center justify-center gap-2 border border-border">
        <Loader2 size={16} className="animate-spin" />
        ĐANG TẢI...
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={actionLoading}
      className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
        isFollowing 
          ? 'bg-muted text-muted-foreground hover:bg-danger/10 hover:text-danger border border-border' 
          : 'bg-foreground text-background hover:bg-primary hover:text-white'
      }`}
    >
      {actionLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus size={16} />
          BỎ THEO DÕI
        </>
      ) : (
        <>
          <UserPlus size={16} />
          THEO DÕI SHOP
        </>
      )}
    </button>
  );
}
