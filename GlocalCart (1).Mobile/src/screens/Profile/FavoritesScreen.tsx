import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [favorites, setFavorites] = useState([
        { id: '1', name: 'Tai nghe Bluetooth Apple AirPods Pro 2', price: 5490000, img: 'https://via.placeholder.com/150', rating: 4.9, sold: 1200 },
        { id: '2', name: 'Áo Thun Nam Phông Trơn Cổ Tròn', price: 99000, img: 'https://via.placeholder.com/150', rating: 4.8, sold: 5400 },
    ]);

    const removeFav = (id: string) => {
        setFavorites(prev => prev.filter(p => p.id !== id));
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <Image source={{ uri: item.img }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.price}>{item.price.toLocaleString('vi-VN')}đ</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.rating}>{item.rating}</Text>
                    <Text style={styles.sold}>| Đã bán {item.sold}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.heartBtn} onPress={() => removeFav(item.id)}>
                <Ionicons name="heart" size={24} color={colors.danger} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sản Phẩm Yêu Thích ({favorites.length})</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={favorites}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', padding: 40, marginTop: 40 }}>
                        <Ionicons name="heart-dislike-outline" size={80} color={colors.border} />
                        <Text style={{ marginTop: 16, color: colors.textSecondary, fontSize: 16 }}>Chưa có sản phẩm yêu thích nào</Text>
                        <TouchableOpacity style={styles.goShopBtn} onPress={() => navigation.navigate('Home')}>
                            <Text style={styles.goShopText}>Khám phá ngay</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, ...shadow.sm },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

    listContainer: { padding: 12 },
    card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 12, marginBottom: 12, ...shadow.sm },
    image: { width: 90, height: 90, borderRadius: 8, backgroundColor: colors.background },
    info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    name: { fontSize: 14, fontWeight: '500', color: colors.text, lineHeight: 20 },
    price: { fontSize: 16, fontWeight: '700', color: colors.primary },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    rating: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
    sold: { fontSize: 12, color: colors.textSecondary, marginLeft: 6 },

    heartBtn: { alignSelf: 'flex-start', padding: 8, marginRight: -8, marginTop: -8 },

    goShopBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 },
    goShopText: { color: colors.white, fontWeight: '700', fontSize: 15 }
});
