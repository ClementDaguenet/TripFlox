import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from 'react-native';

interface GlassCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  onPress?: () => void;
}

export function GlassCard({ 
  children, 
  style, 
  blurIntensity = 20,
  shadow = 'md',
  borderRadius = 'lg',
  onPress,
  ...props
}: GlassCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
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
      {Platform.OS === 'android' ? (
        <View
          style={[
            styles.blur,
            {
              borderRadius: borderRadiusValue,
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(30, 30, 30, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              borderWidth: 0,
              shadowColor: colorScheme === 'dark' ? '#000' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
        >
          {children}
        </View>
      ) : (
        <BlurView
          intensity={blurIntensity}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.blur,
            {
              borderRadius: borderRadiusValue,
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1,
              borderColor: colorScheme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.3)',
            },
          ]}
        >
          {children}
        </BlurView>
      )}
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
  blur: {
    padding: 16,
  },
});
