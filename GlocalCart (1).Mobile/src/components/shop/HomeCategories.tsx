import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { FontAwesome5 } from '@expo/vector-icons';

export const HomeCategories = ({ data }: { data: any[] }) => {
  const navigation = useNavigation<any>();

  if (!data || data.length === 0) return null;

  const getCategoryIcon = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('điện tử') || n.includes('máy tính') || n.includes('công nghệ') || n.includes('desktop')) return 'desktop'; // fa-display equivalent
    if (n.includes('điện thoại') || n.includes('phụ kiện')) return 'mobile-alt';
    if (n.includes('thời trang') || n.includes('quần áo')) return 'tshirt';
    if (n.includes('gia dụng') || n.includes('nhà cửa')) return 'blender';
    if (n.includes('sách') || n.includes('văn phòng')) return 'book';
    if (n.includes('mỹ phẩm') || n.includes('làm đẹp')) return 'spa';
    if (n.includes('mẹ & bé') || n.includes('đồ chơi')) return 'baby-carriage';
    if (n.includes('thể thao') || n.includes('dã ngoại')) return 'basketball-ball';
    if (n.includes('thực phẩm') || n.includes('đồ uống')) return 'hamburger';
    return 'box'; // fallback icon
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DANH MỤC</Text>
      </View>
      
      <View style={styles.grid}>
        {data.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.itemContainer}
            onPress={() => navigation.navigate('Category', { categoryId: item.id, categoryName: item.name })}
          >
            <View style={styles.imageBox}>
              <FontAwesome5 name={getCategoryIcon(item.name)} size={28} color={colors.primary} />
            </View>
            <Text style={styles.itemText} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginBottom: 8,
    width: '100%',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  itemContainer: {
    width: '20%', // 5 items per row
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.borderLight,
    // Add subtle grid borders
    borderRightWidth: 0.2,
    borderBottomWidth: 0.2,
  },
  imageBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
