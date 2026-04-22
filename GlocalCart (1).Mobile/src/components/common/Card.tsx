import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme/colors';

interface CardProps extends ViewProps {
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, elevation = 2, ...props }) => {
  return (
    <View
      style={[
        styles.card,
        {
          shadowOpacity: elevation * 0.05,
          shadowRadius: elevation,
          elevation: elevation,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  },
});
