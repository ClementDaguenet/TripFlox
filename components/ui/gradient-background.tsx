import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface GradientBackgroundProps {
  children: React.ReactNode;
  gradient?: 'primary' | 'secondary' | 'sunset' | 'ocean' | 'forest' | 'fire' | 'night' | 'aurora';
  style?: ViewStyle;
  opacity?: number;
}

export function GradientBackground({ 
  children, 
  gradient = 'primary', 
  style, 
  opacity = 1 
}: GradientBackgroundProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const gradientColors = theme.gradients[gradient] || theme.gradients.primary;
  
  return (
    <LinearGradient
      colors={gradientColors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      <View style={[styles.content, { opacity }]}>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
