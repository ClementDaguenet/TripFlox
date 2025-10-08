import { View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = lightColor && darkColor ? (colorScheme === 'light' ? lightColor : darkColor) : Colors[colorScheme ?? 'light'].background;

  return <View style={[{ backgroundColor: typeof backgroundColor === 'string' ? backgroundColor : undefined }, style]} {...otherProps} />;
}
