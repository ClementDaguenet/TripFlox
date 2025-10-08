import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile, UserRow } from '@/contexts/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { disableGeocoding, enableGeocoding, isGeocodingEnabled } from '@/services/location-utils';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const COUNTRIES = [
  'France', 'United States', 'United Kingdom', 'Germany', 'Spain', 'Italy', 
  'Canada', 'Australia', 'Japan', 'Brazil', 'India', 'China', 'Other'
];

export default function ProfileScreen() {
  const { currentUserEmail, logout, deleteAccount } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [avatar, setAvatar] = useState('');
  const [country, setCountry] = useState('');
  const [geocodingEnabled, setGeocodingEnabled] = useState(false);
  
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const inputBorder = theme.icon;
  const textColor = theme.text;
  const insets = useSafeAreaInsets();

  const loadProfile = useCallback(async () => {
    if (!currentUserEmail) return;
    const userProfile = await getUserProfile(currentUserEmail);
    setProfile(userProfile);
    
    if (userProfile) {
      setUsername(userProfile.username || '');
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setEmail(userProfile.email || '');
      setMobile(userProfile.mobile || '');
      setBirthDate(userProfile.birthDate ? new Date(userProfile.birthDate) : null);
      setAvatar(userProfile.avatar || '');
      setCountry(userProfile.country || '');
    }
    
    // Initialiser l'état du géocodage
    setGeocodingEnabled(isGeocodingEnabled());
  }, [currentUserEmail]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      await updateUserProfile(profile.email, {
        username,
        firstName,
        lastName,
        mobile,
        birthDate: birthDate ? birthDate.getTime() : undefined,
        avatar,
        country,
      });
      
      setProfile({ ...profile, username, firstName, lastName, mobile, birthDate: birthDate ? birthDate.getTime() : undefined, avatar, country });
      setIsEditing(false);
      Alert.alert(t('common.success'), t('alerts.profileUpdatedSuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), t('alerts.failedToUpdateProfile'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGeocoding = () => {
    const newState = !geocodingEnabled;
    setGeocodingEnabled(newState);
    
    if (newState) {
      enableGeocoding();
    } else {
      disableGeocoding();
    }
  };

  const handleCancel = () => {
    if (profile) {
      setUsername(profile.username || '');
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email || '');
      setMobile(profile.mobile || '');
      setBirthDate(profile.birthDate ? new Date(profile.birthDate) : null);
      setAvatar(profile.avatar || '');
      setCountry(profile.country || '');
    }
    setIsEditing(false);
  };

  const pickImage = async () => {
    if (avatar) {
      // Si il y a déjà une image, proposer de la supprimer ou de la changer
      Alert.alert(
        t('profile.profilePhoto'),
        t('profile.photoActions'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.takePhoto'), onPress: takePhoto },
          { text: t('profile.chooseFromGallery'), onPress: selectFromGallery },
          { text: t('profile.removePhoto'), style: 'destructive', onPress: () => setAvatar('') }
        ]
      );
    } else {
      // Si pas d'image, proposer de prendre ou choisir
      Alert.alert(
        t('profile.addProfilePhoto'),
        t('profile.addPhotoPrompt'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.takePhoto'), onPress: takePhoto },
          { text: t('profile.chooseFromGallery'), onPress: selectFromGallery }
        ]
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('profile.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const selectFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('profile.galleryPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.logout'), style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: deleteAccount }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderField = (label: string, value: string, isEditable: boolean, onChangeText?: (text: string) => void, placeholder?: string) => (
    <View style={styles.fieldContainer}>
      <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>
        {label}
      </ThemedText>
      {isEditable ? (
        <TextInput
          style={[styles.input, { 
            borderColor: inputBorder, 
            color: textColor,
            backgroundColor: theme.backgroundSecondary 
          }]}
          placeholder={placeholder || t('profile.enterField', { field: label.toLowerCase() })}
          placeholderTextColor={theme.textTertiary}
          value={value}
          onChangeText={onChangeText}
        />
      ) : (
        <View style={[styles.fieldValue, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.fieldValueText, { color: textColor }]}>
            {value || t('profile.notSet')}
          </ThemedText>
        </View>
      )}
    </View>
  );

  if (!profile) {
    return (
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium">
          <View style={styles.loadingContainer}>
            <ThemedText style={[styles.loadingText, { color: theme.text }]}>{t('profile.loading')}</ThemedText>
          </View>
        </AnimatedWaves>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground gradient="primary" style={styles.container}>
      <AnimatedWaves intensity="medium" style={{ paddingTop: insets.top }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.headerCard} blurIntensity={30}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <ThemedText type="title" style={[styles.title, { color: theme.text }]}>
                  Profile 👤
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Manage your account information
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: theme.tint }]}
                onPress={() => setIsEditing(!isEditing)}
              >
                <ThemedText style={[styles.editButtonText, { color: theme.text }]}>
                  {isEditing ? t('profile.cancel') : t('profile.edit')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </GlassCard>

          <GlassCard style={styles.avatarCard} blurIntensity={25}>
            <View style={styles.avatarSection}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={isEditing ? pickImage : undefined}
                disabled={!isEditing}
              >
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint }]}>
                    <ThemedText style={[styles.avatarText, { lineHeight: 60, color: theme.text }]}>
                      {(firstName || username || 'U').charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                )}
                {isEditing && (
                  <View style={styles.avatarEditOverlay}>
                    <ThemedText style={styles.avatarEditText}>
                      {avatar ? '✏️' : '📷'}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
              <ThemedText style={[styles.avatarLabel, { color: theme.text }]}>
                {isEditing 
                  ? (avatar ? t('newTrip.tapToChangePhoto') : t('newTrip.tapToAddPhoto'))
                  : t('newTrip.profilePhoto')
                }
              </ThemedText>
            </View>
          </GlassCard>

          <GlassCard style={styles.infoCard} blurIntensity={20}>
            <ThemedTextI18n 
              i18nKey="sections.personalInfo" 
              style={[styles.sectionTitle, { color: theme.text }]}
            />
            
            <View style={styles.fieldsContainer}>
              {renderField(t('profile.username'), username, isEditing, setUsername)}
              {renderField(t('profile.firstName'), firstName, isEditing, setFirstName)}
              {renderField(t('profile.lastName'), lastName, isEditing, setLastName)}
              {renderField(t('profile.email'), email, false)}
              {renderField(t('profile.mobile'), mobile, isEditing, setMobile, t('profile.enterPhoneNumber'))}
              
              <View style={styles.fieldContainer}>
                <ThemedTextI18n 
                  i18nKey="profile.birthDate" 
                  style={[styles.fieldLabel, { color: theme.text }]}
                />
                {isEditing ? (
                  <TouchableOpacity
                    style={[styles.dateButton, { 
                      borderColor: inputBorder,
                      backgroundColor: theme.backgroundSecondary 
                    }]}
                    onPress={() => setShowBirthDatePicker(true)}
                  >
                    <ThemedText style={[styles.dateText, { color: textColor }]}>
                      {birthDate ? formatDate(birthDate) : t('profile.selectBirthDate')}
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.fieldValue, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText style={[styles.fieldValueText, { color: textColor }]}>
                      {birthDate ? formatDate(birthDate) : t('profile.notSet')}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>
                  Country
                </ThemedText>
                {isEditing ? (
                  <TouchableOpacity
                    style={[styles.dateButton, { 
                      borderColor: inputBorder,
                      backgroundColor: theme.backgroundSecondary 
                    }]}
                    onPress={() => setShowCountryPicker(true)}
                  >
                    <ThemedText style={[styles.dateText, { color: textColor }]}>
                      {country || t('profile.selectCountry')}
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.fieldValue, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText style={[styles.fieldValueText, { color: textColor }]}>
                      {country || t('profile.notSet')}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </GlassCard>

          {isEditing && (
            <View style={styles.actionButtons}>
              <GradientButton
                title={t('buttons.saveChanges')}
                gradient="primary"
                size="lg"
                style={styles.actionButton}
                onPress={handleSave}
                disabled={isSaving}
              />
              <GradientButton
                title={t('buttons.cancel')}
                gradient="secondary"
                size="lg"
                style={styles.actionButton}
                onPress={handleCancel}
              />
            </View>
          )}

          <GlassCard style={styles.preferencesCard} blurIntensity={20}>
            <ThemedTextI18n 
              i18nKey="profile.preferences" 
              style={[styles.sectionTitle, { color: theme.text }]}
            />
            
            <View style={styles.fieldContainer}>
              <ThemedTextI18n 
                i18nKey="profile.theme" 
                style={[styles.fieldLabel, { color: theme.text }]}
              />
              <View style={styles.themeOptions}>
                {[
                  { value: 'light', label: t('common.light'), icon: '☀️' },
                  { value: 'dark', label: t('common.dark'), icon: '🌙' },
                  { value: 'system', label: t('common.system'), icon: '📱' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: themeMode === option.value ? theme.tint : theme.backgroundSecondary,
                        borderColor: themeMode === option.value ? theme.tint : inputBorder,
                      }
                    ]}
                    onPress={() => setThemeMode(option.value as 'light' | 'dark' | 'system')}
                  >
                    <ThemedText style={[styles.themeOptionIcon, { color: theme.text }]}>
                      {option.icon}
                    </ThemedText>
                    <ThemedText style={[
                      styles.themeOptionLabel,
                      { 
                        color: themeMode === option.value ? theme.text : theme.textSecondary,
                        fontWeight: themeMode === option.value ? '600' : '400'
                      }
                    ]}>
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <ThemedTextI18n 
                i18nKey="profile.language" 
                style={[styles.fieldLabel, { color: theme.text }]}
              />
              <View style={styles.languageOptions}>
                {[
                  { value: 'fr', label: 'Français', flag: '🇫🇷' },
                  { value: 'en', label: t('common.english'), flag: '🇺🇸' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.languageOption,
                      {
                        backgroundColor: locale === option.value ? theme.tint : theme.backgroundSecondary,
                        borderColor: locale === option.value ? theme.tint : inputBorder,
                      }
                    ]}
                    onPress={() => setLocale(option.value as 'fr' | 'en')}
                  >
                    <ThemedText style={[styles.languageOptionFlag, { color: theme.text }]}>
                      {option.flag}
                    </ThemedText>
                    <ThemedText style={[
                      styles.languageOptionLabel,
                      { 
                        color: locale === option.value ? theme.text : theme.textSecondary,
                        fontWeight: locale === option.value ? '600' : '400'
                      }
                    ]}>
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.fieldContainer}>
              <ThemedTextI18n 
                i18nKey="profile.geocoding" 
                style={[styles.fieldLabel, { color: theme.text }]}
              />
              <ThemedTextI18n 
                i18nKey="profile.geocodingDescription" 
                style={[styles.fieldDescription, { color: theme.textSecondary }]}
              />
              <View style={styles.geocodingOptions}>
                <TouchableOpacity
                  style={[
                    styles.geocodingOption,
                    {
                      backgroundColor: geocodingEnabled ? theme.tint : theme.backgroundSecondary,
                      borderColor: geocodingEnabled ? theme.tint : inputBorder,
                    }
                  ]}
                  onPress={toggleGeocoding}
                >
                  <ThemedText style={[styles.geocodingOptionIcon, { color: theme.text }]}>
                    🌍
                  </ThemedText>
                  <ThemedText style={[
                    styles.geocodingOptionLabel,
                    { 
                      color: geocodingEnabled ? theme.text : theme.textSecondary,
                      fontWeight: geocodingEnabled ? '600' : '400'
                    }
                  ]}>
                    {geocodingEnabled ? t('profile.enabled') : t('profile.disabled')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.accountCard} blurIntensity={15}>
            <ThemedTextI18n 
              i18nKey="sections.accountActions" 
              style={[styles.sectionTitle, { color: theme.text }]}
            />
            
            <View style={styles.accountActions}>
              <GradientButton
                title={t('buttons.logout')}
                gradient="fire"
                size="md"
                style={styles.accountButton}
                onPress={handleLogout}
              />
              <GradientButton
                title={t('buttons.deleteAccount')}
                gradient="night"
                size="md"
                style={styles.accountButton}
                onPress={handleDeleteAccount}
              />
            </View>
          </GlassCard>
        </ScrollView>
      </AnimatedWaves>

      {showBirthDatePicker && (
        <RNDateTimePicker
          value={birthDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowBirthDatePicker(false);
            if (selectedDate) {
              setBirthDate(selectedDate);
            }
          }}
        />
      )}

      {showCountryPicker && (
        <View style={styles.countryPickerOverlay}>
          <GlassCard style={styles.countryPickerCard} blurIntensity={30}>
            <ThemedText style={[styles.countryPickerTitle, { color: theme.text }]}>
              Select Country
            </ThemedText>
            <ScrollView style={styles.countryList}>
              {COUNTRIES.map((countryName) => (
                <TouchableOpacity
                  key={countryName}
                  style={[styles.countryItem, country === countryName && styles.countryItemSelected]}
                  onPress={() => {
                    setCountry(countryName);
                    setShowCountryPicker(false);
                  }}
                >
                  <ThemedText style={[styles.countryItemText, { color: theme.text }]}>
                    {countryName}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.countryPickerClose}
              onPress={() => setShowCountryPicker(false)}
            >
              <ThemedText style={[styles.countryPickerCloseText, { color: theme.text }]}>
                Close
              </ThemedText>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}
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
    padding: 16,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },

  // Header
  headerCard: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Avatar
  avatarCard: {
    marginBottom: 8,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditText: {
    fontSize: 16,
  },
  avatarLabel: {
    fontSize: 14,
    opacity: 0.8,
  },

  // Info
  infoCard: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldsContainer: {
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
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
  fieldValue: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldValueText: {
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
  },

  // Actions
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },

  // Preferences
  preferencesCard: {
    marginBottom: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  themeOptionIcon: {
    fontSize: 18,
  },
  themeOptionLabel: {
    fontSize: 14,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  languageOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  languageOptionFlag: {
    fontSize: 18,
  },
  languageOptionLabel: {
    fontSize: 14,
  },
  
  // Geocoding
  fieldDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  geocodingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  geocodingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  geocodingOptionIcon: {
    fontSize: 18,
  },
  geocodingOptionLabel: {
    fontSize: 14,
  },

  // Account
  accountCard: {
    marginBottom: 8,
  },
  accountActions: {
    flexDirection: 'row',
    gap: 12,
  },
  accountButton: {
    flex: 1,
  },

  // Country Picker
  countryPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  countryPickerCard: {
    width: '100%',
    maxHeight: '70%',
  },
  countryPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  countryList: {
    maxHeight: 300,
  },
  countryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  countryItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countryItemText: {
    fontSize: 16,
  },
  countryPickerClose: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  countryPickerCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});