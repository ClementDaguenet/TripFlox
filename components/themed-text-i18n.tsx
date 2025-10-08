import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { useTranslation } from '../hooks/use-translation';

interface ThemedTextI18nProps extends TextProps {
  i18nKey: string;
  i18nOptions?: any;
  fallback?: string;
  children?: React.ReactNode;
  type?: 'default' | 'title' | 'subtitle' | 'body' | 'caption';
}

export function ThemedTextI18n({ 
  i18nKey, 
  i18nOptions, 
  fallback, 
  children, 
  style, 
  type = 'default',
  ...props 
}: ThemedTextI18nProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Si des enfants sont fournis, les utiliser comme fallback
  const fallbackText = children || fallback;
  
  // Obtenir la traduction
  const translatedText = t(i18nKey, i18nOptions) || fallbackText || i18nKey;

  // Styles selon le type
  const getTypeStyle = () => {
    switch (type) {
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'body':
        return styles.body;
      case 'caption':
        return styles.caption;
      default:
        return styles.text;
    }
  };

  return (
    <Text
      style={[
        getTypeStyle(),
        { color: theme.text },
        style,
      ]}
      {...props}
    >
      {translatedText}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
});
