import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

interface GradientButtonProps extends TouchableOpacityProps {
  title: string;
  gradient?: 'primary' | 'secondary' | 'sunset' | 'ocean' | 'forest' | 'fire' | 'night' | 'aurora';
  style?: ViewStyle;
  textStyle?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  onPress?: () => void;
}

export function GradientButton({ 
  title,
  gradient = 'primary', 
  style, 
  textStyle,
  size = 'md',
  shadow = 'md',
  borderRadius = 'lg',
  onPress,
  ...props
}: GradientButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const gradientColors = theme.gradients[gradient] || theme.gradients.primary;
  const shadowStyle = theme.shadows[shadow];
  const borderRadiusValue = theme.borderRadius[borderRadius];
  
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 },
    xl: { paddingVertical: 20, paddingHorizontal: 40, fontSize: 20 },
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderRadius: borderRadiusValue,
          ...shadowStyle,
        },
        style,
      ]}
      onPress={onPress}
      {...props}
    >
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            borderRadius: borderRadiusValue,
            ...sizeStyles[size],
          },
        ]}
      >
        <Text style={[
          styles.text,
          {
            fontSize: sizeStyles[size].fontSize,
            color: theme.text,
            fontWeight: '600',
          },
          textStyle,
        ]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
