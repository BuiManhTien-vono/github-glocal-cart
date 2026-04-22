import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, fontSize } from '../../theme/colors';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Đang tải...', fullScreen = true }) => {
  if (!fullScreen) {
    return (
      <View style={styles.inline}>
        <ActivityIndicator size="small" color={colors.primary} />
        {message && <Text style={styles.text}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  text: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
