import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const tabs = ['Liên quan', 'Mới nhất', 'Bán chạy', 'Giá'];

export const SortTabs = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tabs.map((tab, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={[styles.tabButton, activeTab === idx && styles.tabButtonActive]}
            onPress={() => setActiveTab(idx)}
          >
            <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
              {tab}
            </Text>
            {tab === 'Giá' && (
              <View style={styles.priceArrows}>
                <Ionicons name="chevron-up" size={10} color={colors.textMuted} style={{ marginBottom: -4 }} />
                <Ionicons name="chevron-down" size={10} color={colors.textMuted} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity style={styles.filterBtn}>
        <Ionicons name="filter" size={16} color={colors.textSecondary} />
        <Text style={styles.filterText}>Lọc</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    height: 48,
    alignItems: 'center',
  },
  scroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
  },
  priceArrows: {
    marginLeft: 4,
    justifyContent: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderLight,
    backgroundColor: '#FAFAFA',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
