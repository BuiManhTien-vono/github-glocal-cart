import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../../theme/colors';
import { ProductCard } from './ProductCard';

export const DailyDiscover = ({ data }: { data: any[] }) => {
  const { width: windowWidth } = useWindowDimensions();
  
  if (!data || data.length === 0) return null;

  // Calculate number of columns based on width
  // Mobile: 2, Tablet: 3-4, Desktop: 5-6
  let numColumns = 2;
  if (windowWidth > 1024) numColumns = 6;
  else if (windowWidth > 768) numColumns = 4;
  else if (windowWidth > 480) numColumns = 3;

  const cardWidth = `${(100 / numColumns) - 1}%`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GỢI Ý HÔM NAY</Text>
        <View style={styles.headerIndicator} />
      </View>
      
      <View style={styles.grid}>
        {data.map((item) => (
          <ProductCard key={item.id} item={item} customWidth={cardWidth} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: colors.white,
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 0,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  headerIndicator: {
    width: '100%',
    height: 4,
    backgroundColor: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Use flex-start and gap for better alignment
    paddingHorizontal: 4,
    gap: '1%', // Simple gap
  },
});
