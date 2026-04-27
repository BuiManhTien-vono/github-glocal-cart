import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import apiClient from '../../services/api/apiClient';
import { colors, spacing, fontSize, borderRadius, shadow } from '../../theme/colors';

export default function ChangePasswordScreen({ navigation }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const getStrength = (pwd: string) => {
    if(!pwd) return { level:0, label:'', color:colors.border };
    let s=0;
    if(pwd.length>=6)s++; if(pwd.length>=8)s++; if(/[A-Z]/.test(pwd))s++; if(/[0-9]/.test(pwd))s++; if(/[^A-Za-z0-9]/.test(pwd))s++;
    if(s<=1) return {level:1,label:'Yếu',color:colors.danger};
    if(s<=3) return {level:2,label:'Trung bình',color:colors.warning};
    return {level:3,label:'Mạnh',color:colors.success};
  };
  const strength = getStrength(newPassword);

  const handleChange = async () => {
    const errs: Record<string,string>={};
    if(!currentPassword) errs.currentPassword='Bắt buộc';
    if(!newPassword) errs.newPassword='Bắt buộc';
    else if(newPassword.length<6) errs.newPassword='Tối thiểu 6 ký tự';
    if(newPassword!==confirmPassword) errs.confirmPassword='Không khớp';
    setErrors(errs);
    if(Object.keys(errs).length>0) return;
    setLoading(true);
    try {
      await apiClient.put('/users/change-password',{currentPassword,newPassword});
      Alert.alert('✅ Thành công','Mật khẩu đã được thay đổi.',[{text:'OK',onPress:()=>navigation.goBack()}]);
    } catch(err:any){ Alert.alert('Lỗi',err.message); }
    finally{ setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Header title="Đổi Mật Khẩu" onBack={()=>navigation.goBack()}/>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <View style={s.iconWrap}><Ionicons name="shield-checkmark" size={32} color={colors.primary}/></View>
          <Text style={s.desc}>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</Text>

          {/* Current password */}
          <View style={s.field}>
            <Text style={s.label}>Mật khẩu hiện tại</Text>
            <View style={[s.inputWrap,errors.currentPassword&&s.inputErr]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={{marginRight:10}}/>
              <TextInput style={s.input} value={currentPassword} onChangeText={v=>{setCurrentPassword(v);setErrors({...errors,currentPassword:''});}}
                secureTextEntry={!showCurrent} placeholderTextColor={colors.textMuted} placeholder="Nhập mật khẩu hiện tại"/>
              <TouchableOpacity onPress={()=>setShowCurrent(!showCurrent)}><Ionicons name={showCurrent?'eye-off-outline':'eye-outline'} size={20} color={colors.textMuted}/></TouchableOpacity>
            </View>
            {errors.currentPassword?<Text style={s.errText}>{errors.currentPassword}</Text>:null}
          </View>

          {/* New password */}
          <View style={s.field}>
            <Text style={s.label}>Mật khẩu mới</Text>
            <View style={[s.inputWrap,errors.newPassword&&s.inputErr]}>
              <Ionicons name="key-outline" size={18} color={colors.textMuted} style={{marginRight:10}}/>
              <TextInput style={s.input} value={newPassword} onChangeText={v=>{setNewPassword(v);setErrors({...errors,newPassword:''});}}
                secureTextEntry={!showNew} placeholderTextColor={colors.textMuted} placeholder="Tối thiểu 6 ký tự"/>
              <TouchableOpacity onPress={()=>setShowNew(!showNew)}><Ionicons name={showNew?'eye-off-outline':'eye-outline'} size={20} color={colors.textMuted}/></TouchableOpacity>
            </View>
            {errors.newPassword?<Text style={s.errText}>{errors.newPassword}</Text>:null}
            {newPassword.length>0&&(
              <View style={s.strengthRow}>
                <View style={s.strengthBar}><View style={[s.strengthFill,{width:`${(strength.level/3)*100}%`,backgroundColor:strength.color}]}/></View>
                <Text style={[s.strengthLabel,{color:strength.color}]}>{strength.label}</Text>
              </View>
            )}
          </View>

          {/* Confirm password */}
          <View style={s.field}>
            <Text style={s.label}>Xác nhận mật khẩu mới</Text>
            <View style={[s.inputWrap,errors.confirmPassword&&s.inputErr]}>
              <Ionicons name="lock-open-outline" size={18} color={colors.textMuted} style={{marginRight:10}}/>
              <TextInput style={s.input} value={confirmPassword} onChangeText={v=>{setConfirmPassword(v);setErrors({...errors,confirmPassword:''});}}
                secureTextEntry placeholderTextColor={colors.textMuted} placeholder="Nhập lại mật khẩu mới"/>
            </View>
            {errors.confirmPassword?<Text style={s.errText}>{errors.confirmPassword}</Text>:null}
          </View>

          <TouchableOpacity style={[s.saveBtn,loading&&{opacity:0.7}]} onPress={handleChange} disabled={loading} activeOpacity={0.85}>
            <Text style={s.saveBtnText}>{loading?'Đang xử lý...':'CẬP NHẬT MẬT KHẨU'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background},
  scroll:{padding:spacing.md},
  card:{backgroundColor:'#FFF',borderRadius:16,padding:24,...shadow.md},
  iconWrap:{width:64,height:64,borderRadius:32,backgroundColor:colors.primaryBg,alignItems:'center',justifyContent:'center',alignSelf:'center',marginBottom:12},
  desc:{textAlign:'center',color:colors.textSecondary,fontSize:13,marginBottom:24,lineHeight:20},
  field:{marginBottom:16},
  label:{fontSize:12,fontWeight:'600',color:colors.textSecondary,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6},
  inputWrap:{flexDirection:'row',alignItems:'center',backgroundColor:'#F9FAFB',borderRadius:10,borderWidth:1,borderColor:colors.border,paddingHorizontal:14,height:50},
  inputErr:{borderColor:colors.danger,backgroundColor:'#FEF2F2'},
  input:{flex:1,fontSize:15,color:colors.text},
  errText:{color:colors.danger,fontSize:12,marginTop:4,marginLeft:4},
  strengthRow:{flexDirection:'row',alignItems:'center',gap:10,marginTop:8},
  strengthBar:{flex:1,height:4,backgroundColor:colors.borderLight,borderRadius:2,overflow:'hidden'},
  strengthFill:{height:'100%',borderRadius:2},
  strengthLabel:{fontSize:11,fontWeight:'700'},
  saveBtn:{backgroundColor:colors.primary,height:54,borderRadius:14,alignItems:'center',justifyContent:'center',marginTop:8,...shadow.md},
  saveBtnText:{color:'#FFF',fontSize:16,fontWeight:'800',letterSpacing:1},
});
