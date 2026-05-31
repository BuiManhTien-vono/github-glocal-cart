import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Loading } from '../../components/common/Loading';
import apiClient from '../../services/api/apiClient';
import { fetchPagedItems } from '../../services/api/pagedApi';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';
import { resolveProductImage } from '../../utils/imageUtils';

export default function AdminProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'active'|'locked'>('all');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      let items = await fetchPagedItems('/admin/products', 100);
      if (items.length === 0) items = await fetchPagedItems('/products/my-products', 100);
      if (items.length === 0) items = await fetchPagedItems('/products', 100);
      setProducts(items);
    } catch(e:any){ Alert.alert('Lỗi',e.message); }
    finally{ setLoading(false); setRefreshing(false); }
  };

  const handleToggleLock = async (productId:number, isLocked:boolean, name:string) => {
    Alert.alert(
      isLocked ? 'Mở khóa sản phẩm' : 'Khóa sản phẩm',
      isLocked ? `Cho phép "${name}" được hiển thị trở lại.` : `Sản phẩm "${name}" sẽ bị ẩn khỏi cửa hàng.`,
      [{text:'Hủy',style:'cancel'},{text:'Xác nhận',style:isLocked?'default':'destructive',onPress:async()=>{
        try {
          await apiClient.patch(`/admin/products/${productId}/lock`);
          fetchProducts();
          Alert.alert('✅', isLocked ? 'Đã mở khóa.' : 'Đã khóa sản phẩm.');
        } catch(e:any){ Alert.alert('Lỗi',e.message); }
      }}]
    );
  };

  const filteredProducts = products.filter(p=>{
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter==='all' || (filter==='locked'&&p.isLocked) || (filter==='active'&&!p.isLocked);
    return matchSearch && matchFilter;
  });

  if(loading) return <Loading/>;

  const filterTabs = [
    {key:'all',label:'Tất cả',count:products.length},
    {key:'active',label:'Đang bán',count:products.filter(p=>!p.isLocked).length},
    {key:'locked',label:'Đã khóa',count:products.filter(p=>p.isLocked).length},
  ];

  return (
    <View style={s.container}>
      <Header title="Quản Lý Sản Phẩm" subtitle={`${products.length} sản phẩm`} onBack={()=>navigation.goBack()}/>

      {/* Search */}
      <View style={s.searchBar}>
        <Ionicons name="search" size={20} color={colors.textMuted}/>
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Tìm kiếm sản phẩm..." placeholderTextColor={colors.textMuted}/>
        {search?<TouchableOpacity onPress={()=>setSearch('')}><Ionicons name="close-circle" size={20} color={colors.textMuted}/></TouchableOpacity>:null}
      </View>

      {/* Filter */}
      <View style={s.filterRow}>
        {filterTabs.map(t=>(
          <TouchableOpacity key={t.key} style={[s.filterTab,filter===t.key&&s.filterActive]} onPress={()=>setFilter(t.key as any)}>
            <Text style={[s.filterText,filter===t.key&&s.filterTextActive]}>{t.label} ({t.count})</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={filteredProducts} keyExtractor={i=>i.id.toString()}
        contentContainerStyle={{padding:spacing.md}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);fetchProducts();}} colors={[colors.primary]}/>}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="cube-outline" size={48} color={colors.textMuted}/><Text style={s.emptyText}>Không tìm thấy sản phẩm</Text></View>}
        renderItem={({item})=>(
          <View style={[s.productCard, item.isLocked && s.productLocked]}>
            {/* Product image placeholder */}
            <View style={s.productImg}>
              {item.images && item.images.length > 0 ? (
                <Image source={{uri: resolveProductImage(item) || 'https://via.placeholder.com/100'}} style={s.productImgInner} resizeMode="cover"/>
              ) : (
                <Ionicons name="image-outline" size={28} color={colors.textMuted}/>
              )}
              {item.isLocked && (
                <View style={s.lockOverlay}><Ionicons name="lock-closed" size={20} color="#FFF"/></View>
              )}
            </View>

            <View style={{flex:1}}>
              <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.productPrice}>₫{(item.price||0).toLocaleString()}</Text>
              <View style={s.productMeta}>
                <Text style={s.metaText}>Kho: {item.availableItemCount||0}</Text>
                <Text style={s.metaText}>•</Text>
                <Text style={s.metaText}>Seller ID: {item.sellerId}</Text>
              </View>
              <View style={s.badgeRow}>
                <View style={[s.badge,{backgroundColor:item.isLocked?'#FEF2F2':'#ECFDF5'}]}>
                  <Ionicons name={item.isLocked?'lock-closed':'checkmark-circle'} size={12} color={item.isLocked?colors.danger:colors.success}/>
                  <Text style={[s.badgeText,{color:item.isLocked?colors.danger:colors.success}]}>{item.isLocked?'Đã khóa':'Đang bán'}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[s.lockBtn,{backgroundColor:item.isLocked?'#ECFDF5':'#FEF2F2'}]}
              onPress={()=>handleToggleLock(item.id,item.isLocked,item.name)}
            >
              <Ionicons name={item.isLocked?'lock-open-outline':'lock-closed-outline'} size={20} color={item.isLocked?colors.success:colors.danger}/>
            </TouchableOpacity>
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
  productCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#FFF',borderRadius:14,padding:12,marginBottom:10,...shadow.sm},
  productLocked:{opacity:0.8,borderWidth:1,borderColor:colors.danger+'30'},
  productImg:{width:72,height:72,borderRadius:10,backgroundColor:colors.borderLight,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  productImgInner:{width:'100%',height:'100%'},
  lockOverlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.5)',alignItems:'center',justifyContent:'center',borderRadius:10},
  productName:{fontSize:14,fontWeight:'600',color:colors.text,lineHeight:20},
  productPrice:{fontSize:15,fontWeight:'800',color:colors.primary,marginTop:4},
  productMeta:{flexDirection:'row',alignItems:'center',gap:4,marginTop:4},
  metaText:{fontSize:11,color:colors.textMuted},
  badgeRow:{flexDirection:'row',gap:4,marginTop:6},
  badge:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:8,paddingVertical:3,borderRadius:borderRadius.round},
  badgeText:{fontSize:10,fontWeight:'700'},
  lockBtn:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'},
});
