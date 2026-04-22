import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  block?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  block = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const bgColors: Record<string, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    danger: colors.danger,
    outline: 'transparent',
    ghost: 'transparent',
  };

  const textColors: Record<string, string> = {
    primary: '#FFF',
    secondary: '#FFF',
    danger: '#FFF',
    outline: colors.primary,
    ghost: colors.textSecondary,
  };

  const heights: Record<string, number> = { sm: 36, md: 48, lg: 56 };
  const fontSizes: Record<string, number> = { sm: fontSize.sm, md: fontSize.md, lg: fontSize.lg };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: block ? '100%' : undefined }}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: disabled ? colors.disabled : bgColors[variant],
            height: heights[size],
            borderWidth: variant === 'outline' ? 1.5 : 0,
            borderColor: variant === 'outline' ? colors.primary : undefined,
          },
          block && { width: '100%' },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={textColors[variant]} size="small" />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.text,
                { color: textColors[variant], fontSize: fontSizes[size] },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontWeight: '600',
  },
});
