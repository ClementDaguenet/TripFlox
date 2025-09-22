import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile, UserRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COUNTRIES = [
  'France', 'United States', 'United Kingdom', 'Germany', 'Spain', 'Italy', 
  'Canada', 'Australia', 'Japan', 'Brazil', 'India', 'China', 'Other'
];

export default function ProfileScreen() {
  const { currentUserEmail, logout, deleteAccount } = useAuth();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [avatar, setAvatar] = useState('');
  const [country, setCountry] = useState('');
  
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const inputBorder = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const loadProfile = useCallback(async () => {
    try {
      if (!currentUserEmail) return;
      const userProfile = await getUserProfile(currentUserEmail);
      setProfile(userProfile);
      if (userProfile) {
        setUsername(userProfile.username);
        setFirstName(userProfile.firstName || '');
        setLastName(userProfile.lastName || '');
        setEmail(userProfile.email);
        setMobile(userProfile.mobile || '');
        setBirthDate(userProfile.birthDate ? new Date(userProfile.birthDate) : null);
        setAvatar(userProfile.avatar || '');
        setCountry(userProfile.country || '');
      } else {
        console.log('No profile found for user');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, [currentUserEmail]);

  useFocusEffect(useCallback(() => {
    loadProfile();
  }, [loadProfile]));

  const handleSave = async () => {
    if (!currentUserEmail) return;
    
    try {
      await updateUserProfile(currentUserEmail, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        mobile: mobile || undefined,
        birthDate: birthDate?.getTime() || undefined,
        avatar: avatar || undefined,
        country: country || undefined,
      });
      
      await loadProfile();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setUsername(profile.username);
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email);
      setMobile(profile.mobile || '');
      setBirthDate(profile.birthDate ? new Date(profile.birthDate) : null);
      setAvatar(profile.avatar || '');
      setCountry(profile.country || '');
    }
    setIsEditing(false);
  };

  const showDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: birthDate || new Date(),
        onChange: (_, selectedDate) => {
          setBirthDate(selectedDate || birthDate);
        },
        mode: 'date',
        is24Hour: true,
      });
    } else {
      setShowBirthDatePicker(true);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to select an avatar!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount }
      ]
    );
  };

  if (!profile) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholderHeader, { backgroundColor: theme.tint }]}>
                <ThemedText style={styles.avatarText}>
                  {username.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="title" style={styles.name}>
            {firstName && lastName ? `${firstName} ${lastName}` : username}
          </ThemedText>
          <ThemedText style={styles.email}>{email}</ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <View style={styles.editButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <ThemedText style={styles.buttonText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => setIsEditing(true)}>
              <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Username</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: textColor }]}
              value={username}
              onChangeText={setUsername}
              editable={isEditing}
              placeholderTextColor={inputBorder}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <ThemedText style={styles.label}>First Name</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: inputBorder, color: textColor }]}
                value={firstName}
                onChangeText={setFirstName}
                editable={isEditing}
                placeholderTextColor={inputBorder}
                placeholder="Enter first name"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <ThemedText style={styles.label}>Last Name</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: inputBorder, color: textColor }]}
                value={lastName}
                onChangeText={setLastName}
                editable={isEditing}
                placeholderTextColor={inputBorder}
                placeholder="Enter last name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: textColor }]}
              value={email}
              editable={false}
              placeholderTextColor={inputBorder}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Mobile</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: textColor }]}
              value={mobile}
              onChangeText={setMobile}
              editable={isEditing}
              placeholderTextColor={inputBorder}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Birth Date</ThemedText>
            <TouchableOpacity 
              style={[styles.input, styles.dateInput, { borderColor: inputBorder }]} 
              onPress={isEditing ? showDatePicker : undefined}
              disabled={!isEditing}
            >
              <ThemedText style={[styles.dateText, { color: birthDate ? textColor : inputBorder }]}>
                {birthDate ? birthDate.toDateString() : 'Select birth date'}
              </ThemedText>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showBirthDatePicker && (
              <RNDateTimePicker
                value={birthDate || new Date()}
                mode="date"
                display="inline"
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setBirthDate(selectedDate);
                  }
                  setShowBirthDatePicker(false);
                }}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Country</ThemedText>
            <TouchableOpacity 
              style={[styles.input, styles.pickerInput, { borderColor: inputBorder }]} 
              onPress={isEditing ? () => setShowCountryPicker(true) : undefined}
              disabled={!isEditing}
            >
              <ThemedText style={[styles.pickerText, { color: country ? textColor : inputBorder }]}>
                {country || 'Select country'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Avatar</ThemedText>
            <View style={styles.avatarSection}>
              <View style={styles.avatarPreview}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint }]}>
                    <ThemedText style={styles.avatarPlaceholderText}>
                      {username.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                )}
              </View>
              {isEditing && (
                <TouchableOpacity style={[styles.button, styles.avatarButton]} onPress={pickImage}>
                  <ThemedText style={styles.buttonText}>Select Photo</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: textColor }]}
              value={avatar}
              onChangeText={setAvatar}
              editable={isEditing}
              placeholderTextColor={inputBorder}
              placeholder="Or enter avatar image URL"
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <ThemedText type="subtitle" style={styles.dangerTitle}>Danger Zone</ThemedText>
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <ThemedText style={styles.buttonText}>Logout</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteAccount}>
            <ThemedText style={styles.buttonText}>Delete Account</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Dev Tools */}
        <View style={styles.devZone}>
          <ThemedText type="subtitle" style={styles.devTitle}>Developer Tools</ThemedText>
          <Link href="/reset-auth" asChild>
            <TouchableOpacity style={[styles.button, styles.devButton]}>
              <ThemedText style={styles.buttonText}>Reset Auth (Clear Token)</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      {showCountryPicker && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.background }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Select Country</ThemedText>
            <ScrollView style={styles.countryList}>
              {COUNTRIES.map((countryName) => (
                <TouchableOpacity
                  key={countryName}
                  style={styles.countryItem}
                  onPress={() => {
                    setCountry(countryName);
                    setShowCountryPicker(false);
                  }}
                >
                  <ThemedText style={styles.countryText}>{countryName}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowCountryPicker(false)}
            >
              <ThemedText style={styles.buttonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholderHeader: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  actionButtons: {
    marginBottom: 30,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#6c47ff',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#757575',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#FF9800',
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
  },
  pickerInput: {
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 16,
  },
  dangerZone: {
    marginBottom: 30,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#F44336',
  },
  devZone: {
    marginBottom: 30,
  },
  devTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FF9800',
  },
  devButton: {
    backgroundColor: '#FF9800',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatarPreview: {
    width: 60,
    height: 60,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  countryList: {
    maxHeight: 200,
  },
  countryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryText: {
    fontSize: 16,
  },
});
