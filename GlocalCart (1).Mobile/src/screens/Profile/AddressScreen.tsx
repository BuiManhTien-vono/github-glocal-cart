import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl,
  Modal, TextInput, ScrollView, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { Loading } from '../../components/common/Loading';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';

interface Address {
  id: number; fullName: string; phone: string;
  street: string; ward: string; district: string; city: string; isDefault: boolean;
}

export default function AddressScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', street: '', ward: '', district: '', city: '', isDefault: false });

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try { const d = await apiClient.get('/users/addresses') as any; setAddresses(d || []); }
    catch (e: any) { Alert.alert('Lỗi', e.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const resetForm = () => { setForm({ fullName:'',phone:'',street:'',ward:'',district:'',city:'',isDefault:false }); setEditId(null); setShowModal(false); };

  const openEdit = (a: Address) => {
    setForm({ fullName:a.fullName,phone:a.phone,street:a.street,ward:a.ward,district:a.district,city:a.city,isDefault:a.isDefault });
    setEditId(a.id); setShowModal(true);
  };

  const handleSave = async () => {
    if(!form.fullName||!form.phone||!form.street||!form.city){ Alert.alert('Thiếu thông tin','Vui lòng điền đầy đủ.'); return; }
    setSaving(true);
    try {
      if(editId) await apiClient.put(`/users/addresses/${editId}`,form);
      else await apiClient.post('/users/addresses',form);
      resetForm(); fetchAddresses();
      Alert.alert('✅',editId?'Đã cập nhật.':'Đã thêm địa chỉ.');
    } catch(e:any){ Alert.alert('Lỗi',e.message); } finally{ setSaving(false); }
  };

  const handleDelete = (id:number) => {
    Alert.alert('Xóa','Bạn có chắc?',[
      {text:'Hủy',style:'cancel'},
      {text:'Xóa',style:'destructive',onPress:async()=>{
        try{ await apiClient.delete(`/users/addresses/${id}`); fetchAddresses(); }
        catch(e:any){ Alert.alert('Lỗi',e.message); }
      }},
    ]);
  };

  if(loading) return <Loading/>;

  return (
    <View style={s.container}>
      <Header title="Sổ Địa Chỉ" subtitle={`${addresses.length} địa chỉ`} onBack={()=>navigation.goBack()} />
      <FlatList data={addresses} keyExtractor={i=>i.id.toString()}
        contentContainerStyle={{padding:spacing.md,paddingBottom:100}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);fetchAddresses();}} colors={[colors.primary]}/>}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}><Ionicons name="location-outline" size={48} color={colors.textMuted}/></View>
            <Text style={s.emptyTitle}>Chưa có địa chỉ</Text>
            <Text style={s.emptyDesc}>Thêm địa chỉ giao hàng để mua sắm nhanh hơn</Text>
          </View>
        }
        renderItem={({item})=>(
          <View style={s.card}>
            {item.isDefault&&<View style={s.defBadge}><Ionicons name="checkmark-circle" size={12} color="#FFF"/><Text style={s.defText}>Mặc định</Text></View>}
            <View style={s.cardTop}><Ionicons name="location" size={20} color={colors.primary}/>
              <View style={{flex:1}}><Text style={s.name}>{item.fullName}</Text><Text style={s.phone}>{item.phone}</Text></View>
            </View>
            <Text style={s.detail}>{item.street}</Text>
            <Text style={s.detail}>{[item.ward,item.district,item.city].filter(Boolean).join(', ')}</Text>
            <View style={s.actions}>
              <TouchableOpacity style={s.actBtn} onPress={()=>openEdit(item)}><Ionicons name="create-outline" size={16} color={colors.secondary}/><Text style={[s.actText,{color:colors.secondary}]}>Sửa</Text></TouchableOpacity>
              <TouchableOpacity style={s.actBtn} onPress={()=>handleDelete(item.id)}><Ionicons name="trash-outline" size={16} color={colors.danger}/><Text style={[s.actText,{color:colors.danger}]}>Xóa</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={()=>setShowModal(true)} activeOpacity={0.8}><Ionicons name="add" size={28} color="#FFF"/></TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal,{paddingBottom:insets.bottom+20}]}>
            <View style={s.handle}/><Text style={s.modalTitle}>{editId?'Sửa Địa Chỉ':'Thêm Địa Chỉ Mới'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {([['fullName','Họ tên *','person-outline'],['phone','SĐT *','call-outline'],['street','Địa chỉ *','home-outline'],['ward','Phường/Xã','map-outline'],['district','Quận/Huyện','navigate-outline'],['city','Thành phố *','location-outline']] as const).map(([k,l,ic])=>(
                <View key={k} style={s.field}>
                  <Text style={s.label}>{l}</Text>
                  <View style={s.inputWrap}><Ionicons name={ic as any} size={18} color={colors.textMuted} style={{marginRight:10}}/>
                    <TextInput style={s.input} value={(form as any)[k]} onChangeText={v=>setForm({...form,[k]:v})} placeholderTextColor={colors.textMuted}/>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={s.defToggle} onPress={()=>setForm({...form,isDefault:!form.isDefault})}>
                <Ionicons name={form.isDefault?'checkbox':'square-outline'} size={24} color={colors.primary}/><Text style={s.defTogText}>Đặt làm mặc định</Text>
              </TouchableOpacity>
              <View style={s.modalActs}>
                <TouchableOpacity style={s.cancelBtn} onPress={resetForm}><Text style={s.cancelText}>Hủy</Text></TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn,saving&&{opacity:0.7}]} onPress={handleSave} disabled={saving}><Text style={s.saveText}>{saving?'Đang lưu...':'Lưu'}</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background},
  empty:{alignItems:'center',paddingTop:60,gap:8},
  emptyIcon:{width:80,height:80,borderRadius:40,backgroundColor:colors.borderLight,alignItems:'center',justifyContent:'center',marginBottom:8},
  emptyTitle:{fontSize:18,fontWeight:'700',color:colors.text},
  emptyDesc:{fontSize:14,color:colors.textSecondary,textAlign:'center',paddingHorizontal:40},
  card:{backgroundColor:'#FFF',borderRadius:14,padding:16,marginBottom:12,...shadow.sm,borderLeftWidth:4,borderLeftColor:colors.primary},
  defBadge:{position:'absolute',top:0,right:16,flexDirection:'row',alignItems:'center',gap:4,backgroundColor:colors.primary,paddingHorizontal:10,paddingVertical:4,borderBottomLeftRadius:8,borderBottomRightRadius:8},
  defText:{color:'#FFF',fontSize:11,fontWeight:'700'},
  cardTop:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:8},
  name:{fontSize:15,fontWeight:'700',color:colors.text},
  phone:{fontSize:13,color:colors.textSecondary,marginTop:1},
  detail:{fontSize:13,color:colors.textSecondary,lineHeight:20,marginLeft:30},
  actions:{flexDirection:'row',gap:20,marginTop:12,borderTopWidth:1,borderTopColor:colors.borderLight,paddingTop:12},
  actBtn:{flexDirection:'row',alignItems:'center',gap:4},
  actText:{fontSize:13,fontWeight:'600'},
  fab:{position:'absolute',bottom:24,right:20,width:56,height:56,borderRadius:28,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',...shadow.lg},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'},
  modal:{backgroundColor:'#FFF',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,maxHeight:'85%'},
  handle:{width:40,height:4,borderRadius:2,backgroundColor:colors.border,alignSelf:'center',marginBottom:16},
  modalTitle:{fontSize:20,fontWeight:'800',color:colors.text,marginBottom:20},
  field:{marginBottom:14},
  label:{fontSize:12,fontWeight:'600',color:colors.textSecondary,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6},
  inputWrap:{flexDirection:'row',alignItems:'center',backgroundColor:'#F9FAFB',borderRadius:10,borderWidth:1,borderColor:colors.border,paddingHorizontal:14,height:48},
  input:{flex:1,fontSize:15,color:colors.text},
  defToggle:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,marginBottom:16},
  defTogText:{fontSize:15,color:colors.text,fontWeight:'500'},
  modalActs:{flexDirection:'row',gap:12},
  cancelBtn:{flex:1,height:50,borderRadius:12,borderWidth:1.5,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  cancelText:{fontSize:15,fontWeight:'600',color:colors.textSecondary},
  saveBtn:{flex:1,height:50,borderRadius:12,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'},
  saveText:{fontSize:15,fontWeight:'700',color:'#FFF'},
});
