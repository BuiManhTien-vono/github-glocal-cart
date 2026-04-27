import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { Loading } from '../../components/common/Loading';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';

export default function AdminCategoriesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try { const d = await apiClient.get('/categories') as any; setCategories(d||[]); }
    catch(e:any){ Alert.alert('Lỗi',e.message); }
    finally{ setLoading(false); }
  };

  const resetForm = () => { setCatName(''); setCatDesc(''); setEditId(null); setShowForm(false); };

  const openEdit = (cat: any) => { setCatName(cat.name); setCatDesc(cat.description||''); setEditId(cat.id); setShowForm(true); };

  const handleSave = async () => {
    if(!catName.trim()){ Alert.alert('Lỗi','Tên danh mục không được trống.'); return; }
    setSaving(true);
    try {
      if(editId) await apiClient.put(`/admin/categories/${editId}`,{name:catName,description:catDesc});
      else await apiClient.post('/admin/categories',{name:catName,description:catDesc});
      resetForm(); fetchCategories();
      Alert.alert('✅',editId?'Đã cập nhật.':'Đã thêm danh mục.');
    } catch(e:any){ Alert.alert('Lỗi',e.message); }
    finally{ setSaving(false); }
  };

  const handleDelete = (id:number,name:string) => {
    Alert.alert('Xóa danh mục',`Bạn có chắc muốn xóa "${name}"?`,[
      {text:'Hủy',style:'cancel'},
      {text:'Xóa',style:'destructive',onPress:async()=>{
        try{ await apiClient.delete(`/admin/categories/${id}`); fetchCategories(); }
        catch(e:any){ Alert.alert('Lỗi',e.message); }
      }},
    ]);
  };

  if(loading) return <Loading/>;

  return (
    <View style={s.container}>
      <Header title="Quản Lý Danh Mục" subtitle={`${categories.length} danh mục`} onBack={()=>navigation.goBack()}/>
      <FlatList data={categories} keyExtractor={i=>i.id.toString()}
        contentContainerStyle={{padding:spacing.md,paddingBottom:100}}
        ListEmptyComponent={
          <View style={s.empty}><Ionicons name="folder-open-outline" size={48} color={colors.textMuted}/>
            <Text style={s.emptyTitle}>Chưa có danh mục</Text>
          </View>
        }
        renderItem={({item})=>(
          <View style={s.card}>
            <View style={s.cardLeft}>
              <View style={s.catIcon}><Ionicons name="folder" size={20} color={colors.primary}/></View>
              <View style={{flex:1}}>
                <Text style={s.catName}>{item.name}</Text>
                {item.description?<Text style={s.catDesc}>{item.description}</Text>:null}
              </View>
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity style={s.actionBtn} onPress={()=>openEdit(item)}>
                <Ionicons name="create-outline" size={18} color={colors.secondary}/>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={()=>handleDelete(item.id,item.name)}>
                <Ionicons name="trash-outline" size={18} color={colors.danger}/>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={()=>{resetForm();setShowForm(true);}} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#FFF"/>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={s.overlay}><View style={[s.modal,{paddingBottom:insets.bottom+20}]}>
          <View style={s.handle}/>
          <Text style={s.modalTitle}>{editId?'Sửa Danh Mục':'Thêm Danh Mục'}</Text>
          <View style={s.field}><Text style={s.label}>Tên danh mục *</Text>
            <View style={s.inputWrap}><Ionicons name="folder-outline" size={18} color={colors.textMuted} style={{marginRight:10}}/>
              <TextInput style={s.input} value={catName} onChangeText={setCatName} placeholder="VD: Điện thoại" placeholderTextColor={colors.textMuted}/>
            </View>
          </View>
          <View style={s.field}><Text style={s.label}>Mô tả</Text>
            <View style={[s.inputWrap,{height:80,alignItems:'flex-start',paddingTop:12}]}>
              <TextInput style={[s.input,{height:60}]} value={catDesc} onChangeText={setCatDesc} placeholder="Mô tả ngắn..." multiline placeholderTextColor={colors.textMuted}/>
            </View>
          </View>
          <View style={s.modalActs}>
            <TouchableOpacity style={s.cancelBtn} onPress={resetForm}><Text style={s.cancelText}>Hủy</Text></TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn,saving&&{opacity:0.7}]} onPress={handleSave} disabled={saving}><Text style={s.saveText}>{saving?'Đang lưu...':(editId?'Cập Nhật':'Thêm')}</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background},
  empty:{alignItems:'center',paddingTop:60,gap:12},
  emptyTitle:{fontSize:16,fontWeight:'600',color:colors.textMuted},
  card:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#FFF',borderRadius:14,padding:16,marginBottom:10,...shadow.sm},
  cardLeft:{flexDirection:'row',alignItems:'center',gap:12,flex:1},
  catIcon:{width:40,height:40,borderRadius:10,backgroundColor:colors.primaryBg,alignItems:'center',justifyContent:'center'},
  catName:{fontSize:15,fontWeight:'700',color:colors.text},
  catDesc:{fontSize:12,color:colors.textSecondary,marginTop:2},
  cardActions:{flexDirection:'row',gap:8},
  actionBtn:{width:36,height:36,borderRadius:10,backgroundColor:colors.borderLight,alignItems:'center',justifyContent:'center'},
  fab:{position:'absolute',bottom:24,right:20,width:56,height:56,borderRadius:28,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',...shadow.lg},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'},
  modal:{backgroundColor:'#FFF',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24},
  handle:{width:40,height:4,borderRadius:2,backgroundColor:colors.border,alignSelf:'center',marginBottom:16},
  modalTitle:{fontSize:20,fontWeight:'800',color:colors.text,marginBottom:20},
  field:{marginBottom:14},
  label:{fontSize:12,fontWeight:'600',color:colors.textSecondary,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6},
  inputWrap:{flexDirection:'row',alignItems:'center',backgroundColor:'#F9FAFB',borderRadius:10,borderWidth:1,borderColor:colors.border,paddingHorizontal:14,height:48},
  input:{flex:1,fontSize:15,color:colors.text},
  modalActs:{flexDirection:'row',gap:12,marginTop:8},
  cancelBtn:{flex:1,height:50,borderRadius:12,borderWidth:1.5,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  cancelText:{fontSize:15,fontWeight:'600',color:colors.textSecondary},
  saveBtn:{flex:1,height:50,borderRadius:12,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'},
  saveText:{fontSize:15,fontWeight:'700',color:'#FFF'},
});
