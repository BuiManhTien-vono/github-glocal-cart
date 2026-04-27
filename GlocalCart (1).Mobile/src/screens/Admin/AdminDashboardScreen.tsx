import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Loading } from '../../components/common/Loading';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';

export default function AdminDashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const loadData = async () => {
    try { const d = await apiClient.get('/admin/dashboard') as any; setStats(d); }
    catch(e:any){ Alert.alert('Lỗi',e.message); }
    finally{ setLoading(false); setRefreshing(false); }
  };

  if(loading) return <Loading/>;

  const statCards = [
    { icon:'people',label:'Người dùng',value:stats?.totalUsers||0,color:colors.secondary,bg:'#EBF5FF' },
    { icon:'storefront',label:'Người bán',value:stats?.totalSellers||0,color:colors.success,bg:'#ECFDF5' },
    { icon:'cube',label:'Sản phẩm',value:stats?.totalProducts||0,color:'#8B5CF6',bg:'#F5F3FF' },
    { icon:'receipt',label:'Đơn hàng',value:stats?.totalOrders||0,color:colors.primary,bg:colors.primaryBg },
    { icon:'hourglass',label:'Chờ duyệt',value:stats?.pendingOrders||0,color:colors.warning,bg:'#FFFBEB' },
    { icon:'cash',label:'Doanh thu',value:`${((stats?.totalRevenue||0)/1000000).toFixed(1)}M`,color:colors.danger,bg:'#FEF2F2' },
  ];

  const menuItems = [
    { icon:'folder-outline',label:'Quản Lý Danh Mục',desc:'Thêm, sửa, xóa danh mục sản phẩm',screen:'AdminCategories',color:colors.primary,bg:colors.primaryBg },
    { icon:'people-outline',label:'Quản Lý Người Dùng',desc:'Duyệt, khóa tài khoản & quyền Seller',screen:'AdminUsers',color:colors.secondary,bg:'#EBF5FF' },
    { icon:'shield-outline',label:'Quản Lý Sản Phẩm',desc:'Khóa sản phẩm vi phạm của Seller',screen:'AdminProducts',color:'#8B5CF6',bg:'#F5F3FF' },
  ];

  return (
    <View style={s.container}>
      <Header title="Admin Dashboard" subtitle="Quản trị hệ thống GlocalCart" onBack={()=>navigation.goBack()}/>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadData();}} colors={[colors.primary]}/>}
      >
        <Animated.View style={{opacity:fadeAnim}}>
          {/* Welcome */}
          <View style={s.welcomeCard}>
            <View style={s.welcomeLeft}>
              <Text style={s.welcomeTitle}>Xin chào, Admin! 👋</Text>
              <Text style={s.welcomeDesc}>Tổng quan hệ thống hôm nay</Text>
            </View>
            <View style={s.welcomeIcon}><Ionicons name="analytics" size={32} color={colors.primary}/></View>
          </View>

          {/* Stats Grid */}
          <Text style={s.sectionTitle}>📊 Thống Kê</Text>
          <View style={s.grid}>
            {statCards.map((card,i)=>(
              <TouchableOpacity key={i} style={s.statCard} activeOpacity={0.8}>
                <View style={[s.statIcon,{backgroundColor:card.bg}]}><Ionicons name={card.icon as any} size={24} color={card.color}/></View>
                <Text style={s.statValue}>{card.value}</Text>
                <Text style={s.statLabel}>{card.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <Text style={s.sectionTitle}>⚡ Quản Lý Nhanh</Text>
          {menuItems.map((item,i)=>(
            <TouchableOpacity key={i} style={s.menuCard} activeOpacity={0.7} onPress={()=>navigation.navigate(item.screen)}>
              <View style={[s.menuIcon,{backgroundColor:item.bg}]}><Ionicons name={item.icon as any} size={24} color={item.color}/></View>
              <View style={{flex:1}}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted}/>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background},
  scroll:{padding:spacing.md,paddingBottom:40},
  welcomeCard:{flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',borderRadius:16,padding:20,...shadow.sm,marginBottom:20},
  welcomeLeft:{flex:1},
  welcomeTitle:{fontSize:20,fontWeight:'800',color:colors.text,marginBottom:4},
  welcomeDesc:{fontSize:13,color:colors.textSecondary},
  welcomeIcon:{width:56,height:56,borderRadius:16,backgroundColor:colors.primaryBg,alignItems:'center',justifyContent:'center'},
  sectionTitle:{fontSize:16,fontWeight:'700',color:colors.text,marginBottom:12,marginTop:4},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:12,marginBottom:20},
  statCard:{width:'47%' as any,backgroundColor:'#FFF',borderRadius:14,padding:16,...shadow.sm},
  statIcon:{width:44,height:44,borderRadius:12,alignItems:'center',justifyContent:'center',marginBottom:10},
  statValue:{fontSize:24,fontWeight:'800',color:colors.text},
  statLabel:{fontSize:13,color:colors.textSecondary,marginTop:2},
  menuCard:{flexDirection:'row',alignItems:'center',gap:14,backgroundColor:'#FFF',borderRadius:14,padding:16,marginBottom:10,...shadow.sm},
  menuIcon:{width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},
  menuLabel:{fontSize:15,fontWeight:'700',color:colors.text},
  menuDesc:{fontSize:12,color:colors.textSecondary,marginTop:2},
});
