import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface AnimatedWavesProps {
  children: React.ReactNode;
  style?: any;
  intensity?: 'low' | 'medium' | 'high';
}

export function AnimatedWaves({ 
  children, 
  style, 
  intensity = 'medium' 
}: AnimatedWavesProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);
  
  const intensityMultiplier = {
    low: 0.5,
    medium: 1,
    high: 1.5,
  }[intensity];
  
  useEffect(() => {
    wave1.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    
    wave2.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    
    wave3.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);
  
  const animatedWave1 = useAnimatedStyle(() => {
    const translateY = interpolate(
      wave1.value,
      [0, 1],
      [0, 20 * intensityMultiplier]
    );
    
    return {
      transform: [{ translateY }],
    };
  });
  
  const animatedWave2 = useAnimatedStyle(() => {
    const translateY = interpolate(
      wave2.value,
      [0, 1],
      [0, -15 * intensityMultiplier]
    );
    
    return {
      transform: [{ translateY }],
    };
  });
  
  const animatedWave3 = useAnimatedStyle(() => {
    const translateY = interpolate(
      wave3.value,
      [0, 1],
      [0, 25 * intensityMultiplier]
    );
    
    return {
      transform: [{ translateY }],
    };
  });
  
  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.wave, animatedWave1]}>
        <LinearGradient
          colors={[theme.primary + '20', theme.secondary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.waveGradient}
        />
      </Animated.View>
      
      <Animated.View style={[styles.wave, styles.wave2, animatedWave2]}>
        <LinearGradient
          colors={[theme.secondary + '15', theme.primary + '05']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.waveGradient}
        />
      </Animated.View>
      
      <Animated.View style={[styles.wave, styles.wave3, animatedWave3]}>
        <LinearGradient
          colors={[theme.accent + '10', theme.primary + '20']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.waveGradient}
        />
      </Animated.View>
      
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    width: width * 1.2,
    height: height * 0.3,
    top: -50,
    left: -width * 0.1,
    borderRadius: width * 0.6,
  },
  wave2: {
    top: height * 0.2,
    left: -width * 0.05,
  },
  wave3: {
    top: height * 0.4,
    left: -width * 0.15,
  },
  waveGradient: {
    flex: 1,
    borderRadius: width * 0.6,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
