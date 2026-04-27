import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Loading } from '../../components/common/Loading';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';

export default function AdminUsersScreen({ navigation }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'member'|'seller'|'admin'>('all');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const d = await apiClient.get('/admin/users?pageSize=100') as any;
      setUsers(d?.items || d || []);
    } catch(e:any){ Alert.alert('Lỗi',e.message); }
    finally{ setLoading(false); setRefreshing(false); }
  };

  const handleToggleStatus = async (userId:number,currentStatus:string) => {
    const newStatus = currentStatus==='Active'?'Banned':'Active';
    Alert.alert(
      newStatus==='Banned'?'Khóa tài khoản':'Mở khóa tài khoản',
      newStatus==='Banned'?'Người dùng sẽ không thể đăng nhập.':'Người dùng sẽ có thể đăng nhập lại.',
      [{text:'Hủy',style:'cancel'},{text:'Xác nhận',onPress:async()=>{
        try{ await apiClient.patch(`/admin/users/${userId}/status`,{status:newStatus}); fetchUsers();
          Alert.alert('✅',`Đã chuyển sang ${newStatus}.`);
        } catch(e:any){ Alert.alert('Lỗi',e.message); }
      }}]
    );
  };

  const handleToggleSeller = async (userId:number,isSeller:boolean) => {
    Alert.alert(
      isSeller?'Thu hồi Seller':'Duyệt Seller',
      isSeller?'Người dùng sẽ mất quyền bán hàng.':'Người dùng sẽ có quyền bán hàng.',
      [{text:'Hủy',style:'cancel'},{text:'Xác nhận',onPress:async()=>{
        try{ await apiClient.patch(`/admin/users/${userId}/seller`); fetchUsers(); }
        catch(e:any){ Alert.alert('Lỗi',e.message); }
      }}]
    );
  };

  const filteredUsers = users.filter(u=>{
    const matchSearch = !search || u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.userName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter==='all' || (filter==='seller'&&u.isSeller) || (filter==='admin'&&u.role==='Admin') || (filter==='member'&&!u.isSeller&&u.role!=='Admin');
    return matchSearch && matchFilter;
  });

  if(loading) return <Loading/>;

  const filterTabs = [
    {key:'all',label:'Tất cả',count:users.length},
    {key:'member',label:'Member',count:users.filter(u=>!u.isSeller&&u.role!=='Admin').length},
    {key:'seller',label:'Seller',count:users.filter(u=>u.isSeller).length},
    {key:'admin',label:'Admin',count:users.filter(u=>u.role==='Admin').length},
  ];

  return (
    <View style={s.container}>
      <Header title="Quản Lý Người Dùng" subtitle={`${users.length} tài khoản`} onBack={()=>navigation.goBack()}/>

      {/* Search bar */}
      <View style={s.searchBar}>
        <Ionicons name="search" size={20} color={colors.textMuted}/>
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Tìm kiếm người dùng..." placeholderTextColor={colors.textMuted}/>
        {search?<TouchableOpacity onPress={()=>setSearch('')}><Ionicons name="close-circle" size={20} color={colors.textMuted}/></TouchableOpacity>:null}
      </View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {filterTabs.map(t=>(
          <TouchableOpacity key={t.key} style={[s.filterTab,filter===t.key&&s.filterActive]} onPress={()=>setFilter(t.key as any)}>
            <Text style={[s.filterText,filter===t.key&&s.filterTextActive]}>{t.label} ({t.count})</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={filteredUsers} keyExtractor={i=>i.id.toString()}
        contentContainerStyle={{padding:spacing.md}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);fetchUsers();}} colors={[colors.primary]}/>}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="people-outline" size={48} color={colors.textMuted}/><Text style={s.emptyText}>Không tìm thấy</Text></View>}
        renderItem={({item})=>(
          <View style={s.userCard}>
            <View style={s.avatar}><Text style={s.avatarText}>{(item.fullName||item.userName||'?')[0].toUpperCase()}</Text></View>
            <View style={{flex:1}}>
              <Text style={s.userName}>{item.fullName||item.userName}</Text>
              <Text style={s.userEmail}>{item.email}</Text>
              <View style={s.badgeRow}>
                <View style={[s.badge,{backgroundColor:item.accountStatus==='Active'?'#ECFDF5':'#FEF2F2'}]}>
                  <Text style={[s.badgeText,{color:item.accountStatus==='Active'?colors.success:colors.danger}]}>{item.accountStatus}</Text>
                </View>
                {item.isSeller&&<View style={[s.badge,{backgroundColor:'#EBF5FF'}]}><Text style={[s.badgeText,{color:colors.secondary}]}>Seller</Text></View>}
                {item.role==='Admin'&&<View style={[s.badge,{backgroundColor:colors.primaryBg}]}><Text style={[s.badgeText,{color:colors.primary}]}>Admin</Text></View>}
              </View>
            </View>
            <View style={s.btnCol}>
              <TouchableOpacity style={[s.miniBtn,{borderColor:item.accountStatus==='Active'?colors.danger:colors.success}]}
                onPress={()=>handleToggleStatus(item.id,item.accountStatus)}>
                <Ionicons name={item.accountStatus==='Active'?'ban':'checkmark-circle-outline'} size={14} color={item.accountStatus==='Active'?colors.danger:colors.success}/>
                <Text style={[s.miniBtnText,{color:item.accountStatus==='Active'?colors.danger:colors.success}]}>{item.accountStatus==='Active'?'Ban':'Unban'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.miniBtn,{borderColor:colors.secondary}]}
                onPress={()=>handleToggleSeller(item.id,item.isSeller)}>
                <Ionicons name={item.isSeller?'close-circle-outline':'storefront-outline'} size={14} color={colors.secondary}/>
                <Text style={[s.miniBtnText,{color:colors.secondary}]}>{item.isSeller?'Hủy':'Duyệt'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background},
  searchBar:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#FFF',marginHorizontal:spacing.md,marginTop:spacing.sm,paddingHorizontal:14,height:44,borderRadius:12,borderWidth:1,borderColor:colors.border},
  searchInput:{flex:1,fontSize:14,color:colors.text},
  filterRow:{flexDirection:'row',paddingHorizontal:spacing.md,paddingVertical:spacing.sm,gap:8},
  filterTab:{paddingHorizontal:14,paddingVertical:8,borderRadius:borderRadius.round,backgroundColor:'#FFF',borderWidth:1,borderColor:colors.border},
  filterActive:{backgroundColor:colors.primary,borderColor:colors.primary},
  filterText:{fontSize:12,fontWeight:'600',color:colors.textSecondary},
  filterTextActive:{color:'#FFF'},
  empty:{alignItems:'center',paddingTop:60,gap:12},
  emptyText:{fontSize:14,color:colors.textMuted},
  userCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#FFF',borderRadius:14,padding:14,marginBottom:10,...shadow.sm},
  avatar:{width:44,height:44,borderRadius:22,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'},
  avatarText:{color:'#FFF',fontSize:18,fontWeight:'700'},
  userName:{fontSize:14,fontWeight:'700',color:colors.text},
  userEmail:{fontSize:12,color:colors.textSecondary,marginTop:1},
  badgeRow:{flexDirection:'row',gap:4,marginTop:6},
  badge:{paddingHorizontal:8,paddingVertical:2,borderRadius:borderRadius.round},
  badgeText:{fontSize:10,fontWeight:'700'},
  btnCol:{gap:6},
  miniBtn:{flexDirection:'row',alignItems:'center',gap:4,borderWidth:1,borderRadius:8,paddingHorizontal:10,paddingVertical:5},
  miniBtnText:{fontSize:11,fontWeight:'600'},
});
