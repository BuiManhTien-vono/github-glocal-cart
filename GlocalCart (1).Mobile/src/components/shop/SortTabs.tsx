import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const tabs = ['Liên quan', 'Mới nhất', 'Bán chạy', 'Giá'];

interface SortTabsProps {
  activeTab?: number;
  onTabChange?: (idx: number) => void;
  priceOrder?: 'asc' | 'desc';
  onFilterPress?: () => void;
}

export const SortTabs = ({ activeTab, onTabChange, priceOrder = 'asc', onFilterPress }: SortTabsProps) => {
  const [localActiveTab, setLocalActiveTab] = useState(0);

  const hasProps = activeTab !== undefined && onTabChange !== undefined;
  const currentActiveTab = hasProps ? activeTab : localActiveTab;

  const handleTabPress = (idx: number) => {
    if (hasProps) {
      onTabChange(idx);
    } else {
      setLocalActiveTab(idx);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tabs.map((tab, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={[styles.tabButton, currentActiveTab === idx && styles.tabButtonActive]}
            onPress={() => handleTabPress(idx)}
          >
            <Text style={[styles.tabText, currentActiveTab === idx && styles.tabTextActive]}>
              {tab}
            </Text>
            {tab === 'Giá' && (
              <View style={styles.priceArrows}>
                <Ionicons 
                  name="caret-up" 
                  size={10} 
                  color={currentActiveTab === idx && priceOrder === 'asc' ? colors.primary : colors.textMuted} 
                  style={{ marginBottom: -4 }} 
                />
                <Ionicons 
                  name="caret-down" 
                  size={10} 
                  color={currentActiveTab === idx && priceOrder === 'desc' ? colors.primary : colors.textMuted} 
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity style={styles.filterBtn} onPress={onFilterPress}>
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

