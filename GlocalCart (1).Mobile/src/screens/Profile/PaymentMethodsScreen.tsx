import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { Loading } from '../../components/common/Loading';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';

export default function PaymentMethodsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [methods, setMethods] = useState<any>({ creditCards: [], bankAccounts: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'cards'|'banks'>('cards');
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({ cardNumber:'',cardHolder:'',expiryDate:'',cvv:'' });
  const [savingCard, setSavingCard] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName:'',accountNumber:'',accountHolder:'' });
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => { fetchMethods(); }, []);

  const fetchMethods = async () => {
    try { const d = await apiClient.get('/users/payment-methods') as any; setMethods(d||{creditCards:[],bankAccounts:[]}); }
    catch(e:any){ Alert.alert('Lỗi',e.message); } finally{ setLoading(false); }
  };

  const handleAddCard = async () => {
    if(!cardForm.cardNumber||!cardForm.cardHolder){ Alert.alert('Thiếu thông tin','Vui lòng điền đầy đủ.'); return; }
    setSavingCard(true);
    try { await apiClient.post('/users/credit-cards',cardForm); setShowCardForm(false); setCardForm({cardNumber:'',cardHolder:'',expiryDate:'',cvv:''}); fetchMethods(); Alert.alert('✅','Đã thêm thẻ.'); }
    catch(e:any){ Alert.alert('Lỗi',e.message); } finally{ setSavingCard(false); }
  };

  const handleAddBank = async () => {
    if(!bankForm.bankName||!bankForm.accountNumber){ Alert.alert('Thiếu thông tin','Vui lòng điền đầy đủ.'); return; }
    setSavingBank(true);
    try { await apiClient.post('/users/bank-accounts',bankForm); setShowBankForm(false); setBankForm({bankName:'',accountNumber:'',accountHolder:''}); fetchMethods(); Alert.alert('✅','Đã thêm tài khoản.'); }
    catch(e:any){ Alert.alert('Lỗi',e.message); } finally{ setSavingBank(false); }
  };

  if(loading) return <Loading/>;

  return (
    <View style={s.container}>
      <Header title="Phương Thức Thanh Toán" onBack={()=>navigation.goBack()}/>
      {/* Tabs */}
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tab,tab==='cards'&&s.tabActive]} onPress={()=>setTab('cards')}>
          <Ionicons name="card" size={18} color={tab==='cards'?colors.primary:colors.textMuted}/>
          <Text style={[s.tabText,tab==='cards'&&s.tabTextActive]}>Thẻ tín dụng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab,tab==='banks'&&s.tabActive]} onPress={()=>setTab('banks')}>
          <Ionicons name="business" size={18} color={tab==='banks'?colors.primary:colors.textMuted}/>
          <Text style={[s.tabText,tab==='banks'&&s.tabTextActive]}>Ngân hàng</Text>
        </TouchableOpacity>
      </View>

      {tab==='cards'?(
        <View style={{flex:1}}>
          <FlatList data={methods.creditCards} keyExtractor={(_:any,i:number)=>i.toString()}
            contentContainerStyle={{padding:spacing.md,paddingBottom:100}}
            ListEmptyComponent={<View style={s.empty}><Ionicons name="card-outline" size={48} color={colors.textMuted}/><Text style={s.emptyText}>Chưa có thẻ tín dụng</Text></View>}
            renderItem={({item}:any)=>(
              <View style={s.cardVisual}>
                <View style={s.cardGradient}>
                  <View style={s.cardBg1}/><View style={s.cardBg2}/>
                  <View style={s.cardTop}><Ionicons name="card" size={24} color="#FFF"/><Text style={s.cardType}>CREDIT</Text></View>
                  <Text style={s.cardNum}>•••• •••• •••• {item.cardNumber?.slice(-4)||'****'}</Text>
                  <View style={s.cardBottom}>
                    <View><Text style={s.cardLabel}>CHỦ THẺ</Text><Text style={s.cardValue}>{item.cardHolder}</Text></View>
                    <View><Text style={s.cardLabel}>HẾT HẠN</Text><Text style={s.cardValue}>{item.expiryDate||'--/--'}</Text></View>
                  </View>
                </View>
              </View>
            )}
          />
          <TouchableOpacity style={s.fab} onPress={()=>setShowCardForm(true)}><Ionicons name="add" size={28} color="#FFF"/></TouchableOpacity>
        </View>
      ):(
        <View style={{flex:1}}>
          <FlatList data={methods.bankAccounts} keyExtractor={(_:any,i:number)=>i.toString()}
            contentContainerStyle={{padding:spacing.md,paddingBottom:100}}
            ListEmptyComponent={<View style={s.empty}><Ionicons name="business-outline" size={48} color={colors.textMuted}/><Text style={s.emptyText}>Chưa có tài khoản ngân hàng</Text></View>}
            renderItem={({item}:any)=>(
              <View style={s.bankCard}>
                <View style={[s.bankIcon,{backgroundColor:'#ECFDF5'}]}><Ionicons name="business" size={24} color={colors.success}/></View>
                <View style={{flex:1}}><Text style={s.bankName}>{item.bankName}</Text><Text style={s.bankDetail}>{item.accountHolder} • {item.accountNumber}</Text></View>
              </View>
            )}
          />
          <TouchableOpacity style={s.fab} onPress={()=>setShowBankForm(true)}><Ionicons name="add" size={28} color="#FFF"/></TouchableOpacity>
        </View>
      )}

      {/* Card Form Modal */}
      <Modal visible={showCardForm} animationType="slide" transparent>
        <View style={s.overlay}><View style={[s.modal,{paddingBottom:insets.bottom+20}]}>
          <View style={s.handle}/><Text style={s.modalTitle}>Thêm Thẻ Tín Dụng</Text>
          <ScrollView>
            {([['cardNumber','Số thẻ','card-outline','number-pad'],['cardHolder','Tên chủ thẻ','person-outline','default'],['expiryDate','Hết hạn (MM/YY)','calendar-outline','default'],['cvv','CVV','lock-closed-outline','number-pad']] as const).map(([k,l,ic,kb])=>(
              <View key={k} style={s.field}><Text style={s.label}>{l}</Text>
                <View style={s.inputWrap}><Ionicons name={ic as any} size={18} color={colors.textMuted} style={{marginRight:10}}/>
                  <TextInput style={s.input} value={(cardForm as any)[k]} onChangeText={v=>setCardForm({...cardForm,[k]:v})} keyboardType={kb as any} secureTextEntry={k==='cvv'} placeholderTextColor={colors.textMuted}/>
                </View>
              </View>
            ))}
            <View style={s.modalActs}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowCardForm(false)}><Text style={s.cancelText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn,savingCard&&{opacity:0.7}]} onPress={handleAddCard} disabled={savingCard}><Text style={s.saveText}>{savingCard?'Đang lưu...':'Thêm Thẻ'}</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View></View>
      </Modal>

      {/* Bank Form Modal */}
      <Modal visible={showBankForm} animationType="slide" transparent>
        <View style={s.overlay}><View style={[s.modal,{paddingBottom:insets.bottom+20}]}>
          <View style={s.handle}/><Text style={s.modalTitle}>Thêm Tài Khoản Ngân Hàng</Text>
          <ScrollView>
            {([['bankName','Tên ngân hàng','business-outline'],['accountNumber','Số tài khoản','keypad-outline'],['accountHolder','Tên chủ TK','person-outline']] as const).map(([k,l,ic])=>(
              <View key={k} style={s.field}><Text style={s.label}>{l}</Text>
                <View style={s.inputWrap}><Ionicons name={ic as any} size={18} color={colors.textMuted} style={{marginRight:10}}/>
                  <TextInput style={s.input} value={(bankForm as any)[k]} onChangeText={v=>setBankForm({...bankForm,[k]:v})} placeholderTextColor={colors.textMuted}/>
                </View>
              </View>
            ))}
            <View style={s.modalActs}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowBankForm(false)}><Text style={s.cancelText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn,savingBank&&{opacity:0.7}]} onPress={handleAddBank} disabled={savingBank}><Text style={s.saveText}>{savingBank?'Đang lưu...':'Thêm'}</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background},
  tabBar:{flexDirection:'row',backgroundColor:'#FFF',borderBottomWidth:1,borderBottomColor:colors.borderLight},
  tab:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:14,borderBottomWidth:2,borderBottomColor:'transparent'},
  tabActive:{borderBottomColor:colors.primary},
  tabText:{fontSize:fontSize.sm,color:colors.textMuted,fontWeight:'500'},
  tabTextActive:{color:colors.primary,fontWeight:'700'},
  empty:{alignItems:'center',paddingTop:60,gap:12},
  emptyText:{color:colors.textMuted,fontSize:fontSize.md},
  // Visual credit card
  cardVisual:{marginBottom:16},
  cardGradient:{backgroundColor:'#1E293B',borderRadius:16,padding:20,overflow:'hidden',minHeight:180},
  cardBg1:{position:'absolute',width:200,height:200,borderRadius:100,backgroundColor:'rgba(255,255,255,0.05)',top:-80,right:-40},
  cardBg2:{position:'absolute',width:150,height:150,borderRadius:75,backgroundColor:'rgba(255,255,255,0.03)',bottom:-50,left:-30},
  cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:24},
  cardType:{color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:'700',letterSpacing:2},
  cardNum:{color:'#FFF',fontSize:22,fontWeight:'700',letterSpacing:3,marginBottom:20},
  cardBottom:{flexDirection:'row',justifyContent:'space-between'},
  cardLabel:{color:'rgba(255,255,255,0.5)',fontSize:10,fontWeight:'600',letterSpacing:1,marginBottom:4},
  cardValue:{color:'#FFF',fontSize:14,fontWeight:'600'},
  // Bank card
  bankCard:{flexDirection:'row',alignItems:'center',gap:14,backgroundColor:'#FFF',borderRadius:14,padding:16,marginBottom:12,...shadow.sm},
  bankIcon:{width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},
  bankName:{fontSize:15,fontWeight:'700',color:colors.text},
  bankDetail:{fontSize:13,color:colors.textSecondary,marginTop:2},
  fab:{position:'absolute',bottom:24,right:20,width:56,height:56,borderRadius:28,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',...shadow.lg},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'},
  modal:{backgroundColor:'#FFF',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,maxHeight:'80%'},
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
