import { ThemedText } from "@/components/themed-text";
import { ThemedTextI18n } from "@/components/themed-text-i18n";
import { AnimatedWaves } from "@/components/ui/animated-waves";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { GradientButton } from "@/components/ui/gradient-button";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { clearAllData } from "@/contexts/db";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/hooks/use-translation";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Alert, Dimensions, Platform, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

// TEMPORARY: Set to true to show clear database button
const SHOW_CLEAR_DB_BUTTON = false;

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const inputBorder = theme.icon;
  const textColor = theme.text;
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(t('auth.invalidCredentials'));
      Alert.alert(t('auth.loginError'), t('auth.loginErrorDescription'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    Alert.alert(
      t('auth.clearDatabase'),
      t('auth.clearDatabaseDescription'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('auth.clearAllData'),
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearAllData();
              Alert.alert(t('common.success'), t('auth.databaseClearedSuccess'));
            } catch (err) {
              Alert.alert(t('common.error'), t('auth.databaseClearError', { error: err instanceof Error ? err.message : t('common.unknownError') }));
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  return (
    <GradientBackground gradient="primary" style={styles.container}>
      <AnimatedWaves intensity="high" style={{ paddingTop: insets.top }}>
        <View style={styles.content}>
          <GlassCard style={styles.headerCard} blurIntensity={30}>
            <View style={styles.header}>
              <ThemedTextI18n 
                i18nKey="auth.welcomeBack" 
                type="title" 
                style={[styles.title, { color: theme.text }]}
              />
              <ThemedTextI18n 
                i18nKey="auth.signInToContinue" 
                style={[styles.subtitle, { color: theme.textSecondary }]}
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.formCard} blurIntensity={25}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="auth.email" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.input, { 
                    borderColor: inputBorder, 
                    color: textColor,
                    backgroundColor: theme.backgroundSecondary,
                    ...(Platform.OS === 'android' && {
                      borderWidth: 0.5,
                      elevation: 1,
                    })
                  }]}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="auth.password" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.input, { 
                    borderColor: inputBorder, 
                    color: textColor,
                    backgroundColor: theme.backgroundSecondary,
                    ...(Platform.OS === 'android' && {
                      borderWidth: 0.5,
                      elevation: 1,
                    })
                  }]}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>
                    {error}
                  </ThemedText>
                </View>
              )}

              <GradientButton
                title={isLoading ? t('auth.signingIn') : t('auth.login')}
                gradient="primary"
                size="lg"
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              />

              {/* TEMPORARY: Clear Database Button */}
              {SHOW_CLEAR_DB_BUTTON && (
                <GradientButton
                  title={isClearing ? t('auth.clearing') : t('auth.clearDatabase')}
                  gradient="fire"
                  size="md"
                  style={[styles.loginButton, { marginTop: 10, opacity: 0.7 }] as any}
                  onPress={handleClearDatabase}
                  disabled={isClearing || isLoading}
                />
              )}
            </View>
          </GlassCard>

          <GlassCard style={styles.signupCard} blurIntensity={20}>
            <View style={styles.signupContent}>
              <ThemedTextI18n 
                i18nKey="auth.dontHaveAccount" 
                style={[styles.signupText, { color: theme.textSecondary }]}
              />
              <Link href="/register" asChild>
                <GradientButton
                  title={t('auth.createAccount')}
                  gradient="secondary"
                  size="md"
                  style={styles.signupButton}
                />
              </Link>
            </View>
          </GlassCard>
        </View>
      </AnimatedWaves>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  
  // Header
  headerCard: {
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },

  // Form
  formCard: {
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorContainer: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
  },

  // Sign Up
  signupCard: {
    marginBottom: 0,
  },
  signupContent: {
    alignItems: 'center',
    gap: 16,
  },
  signupText: {
    fontSize: 16,
    textAlign: 'center',
  },
  signupButton: {
    minWidth: 200,
  },
});