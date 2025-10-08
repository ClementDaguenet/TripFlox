import { ThemedText } from "@/components/themed-text";
import { ThemedTextI18n } from "@/components/themed-text-i18n";
import { AnimatedWaves } from "@/components/ui/animated-waves";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { GradientButton } from "@/components/ui/gradient-button";
import { Colors } from "@/constants/theme";
import { findUserByEmail, initDb, insertUser } from "@/contexts/db";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/hooks/use-translation";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const inputBorder = theme.icon;
  const textColor = theme.text;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const initializeDb = async () => {
      try {
        await initDb();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    };
    initializeDb();
  }, []);

  const handleRegister = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      if (!username || !email || !password || !confirmPassword) {
        setError(t('auth.fillAllFields'));
        return;
      }
      
      if (username.length < 3) {
        setError(t('auth.usernameTooShort'));
        return;
      }
      
      if (password !== confirmPassword) {
        setError(t('auth.passwordsDoNotMatch'));
        return;
      }
      
      if (password.length < 6) {
        setError(t('auth.passwordTooShort'));
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError(t('auth.emailInvalid'));
        return;
      }
      
      const existing = await findUserByEmail(email);
      if (existing) {
        setError(t('auth.accountAlreadyExists'));
        return;
      }
      
      await insertUser({ username, email, password });
      setSuccess(t('auth.accountCreated'));
      Alert.alert(t('common.success'), t('auth.accountCreatedSuccess'));
      
      setTimeout(() => {
        router.replace("/login");
      }, 1000);
    } catch (e) {
      console.error('Registration error:', e);
      const errorMessage = e instanceof Error ? e.message : t('common.unknownError');
      setError(t('auth.registerError', { error: errorMessage }));
      Alert.alert(t('auth.registerError'), t('auth.registerErrorDescription', { error: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground gradient="secondary" style={styles.container}>
      <AnimatedWaves intensity="high" style={{ paddingTop: insets.top }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
          <GlassCard style={styles.headerCard} blurIntensity={30}>
            <View style={styles.header}>
              <ThemedTextI18n 
                i18nKey="auth.joinWoxTripflox" 
                type="title" 
                style={[styles.title, { color: theme.text }]}
              />
              <ThemedTextI18n 
                i18nKey="auth.createAccountDescription" 
                style={[styles.subtitle, { color: theme.textSecondary }]}
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.formCard} blurIntensity={25}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="auth.username" 
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
                  placeholder={t('auth.usernamePlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

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
                  placeholder={t('auth.createPasswordPlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="auth.confirmPassword" 
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
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>
                    {error}
                  </ThemedText>
                </View>
              )}

              {success && (
                <View style={styles.successContainer}>
                  <ThemedText style={styles.successText}>
                    {success}
                  </ThemedText>
                </View>
              )}

              <GradientButton
                title={isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
                gradient="primary"
                size="lg"
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={isLoading}
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.signinCard} blurIntensity={20}>
            <View style={styles.signinContent}>
              <ThemedTextI18n 
                i18nKey="auth.alreadyHaveAccount" 
                style={[styles.signinText, { color: theme.textSecondary }]}
              />
              <Link href="/login" asChild>
                <GradientButton
                  title={t('auth.login')}
                  gradient="ocean"
                  size="md"
                  style={styles.signinButton}
                />
              </Link>
            </View>
          </GlassCard>
          </View>
        </ScrollView>
      </AnimatedWaves>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 40,
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
  successContainer: {
    paddingVertical: 8,
  },
  successText: {
    color: '#10b981',
    fontSize: 14,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 8,
  },

  // Sign In
  signinCard: {
    marginBottom: 0,
  },
  signinContent: {
    alignItems: 'center',
    gap: 16,
  },
  signinText: {
    fontSize: 16,
    textAlign: 'center',
  },
  signinButton: {
    minWidth: 200,
  },
});