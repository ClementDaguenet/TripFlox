import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect } from 'react';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: any;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
}

export function AnimatedNumber({ 
  value, 
  duration = 1000, 
  style, 
  color,
  fontSize = 28,
  fontWeight = 'bold'
}: AnimatedNumberProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const animatedValue = useSharedValue(0);
  const displayValue = useSharedValue(0);

  useEffect(() => {
    // Animer vers la nouvelle valeur
    animatedValue.value = withTiming(value, { duration });
    
    // Mettre à jour la valeur affichée progressivement
    const interval = setInterval(() => {
      displayValue.value = withTiming(animatedValue.value, { duration: 100 });
    }, 50);

    return () => clearInterval(interval);
  }, [value, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(animatedValue.value, [0, value], [0.8, 1.2], 'clamp');
    const opacity = interpolate(animatedValue.value, [0, value], [0.5, 1], 'clamp');
    
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <ThemedText 
        style={[
          {
            fontSize,
            fontWeight,
            color: color || theme.text,
          },
          style
        ]}
      >
        {Math.round(displayValue.value)}
      </ThemedText>
    </Animated.View>
  );
}
