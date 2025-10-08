import { useTheme } from '@/contexts/ThemeContext';

export function useColorScheme() {
  const { actualTheme } = useTheme();
  return actualTheme;
}
