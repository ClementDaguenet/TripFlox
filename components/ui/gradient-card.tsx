import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from 'react-native';

interface GradientCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  gradient?: 'primary' | 'secondary' | 'sunset' | 'ocean' | 'forest' | 'fire' | 'night' | 'aurora';
  style?: ViewStyle;
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  onPress?: () => void;
}

export function GradientCard({ 
  children, 
  gradient = 'primary', 
  style, 
  shadow = 'md',
  borderRadius = 'lg',
  onPress,
  ...props
}: GradientCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const gradientColors = theme.gradients[gradient] || theme.gradients.primary;
  const shadowStyle = theme.shadows[shadow];
  const borderRadiusValue = theme.borderRadius[borderRadius];
  
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
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
          },
        ]}
      >
        {children}
      </LinearGradient>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    ...(Platform.OS === 'android' && {
      elevation: 2,
    }),
  },
  gradient: {
    padding: 16,
  },
});
