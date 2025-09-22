import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputBorder = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  const handleLogin = async () => {
    setError(null);
    try {
      await login(email, password);
    } catch (e) {
      setError("Invalid credentials");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Sign in</ThemedText>
      {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
      <TextInput
        style={[styles.input, { borderColor: inputBorder, color: textColor }]}
        placeholder="Email"
        placeholderTextColor={inputBorder}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { borderColor: inputBorder, color: textColor }]}
        placeholder="Password"
        placeholderTextColor={inputBorder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Sign in" onPress={handleLogin} />
      <View style={{ height: 12 }} />
      <Link href="/register"><ThemedText type="link">Create account</ThemedText></Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  error: { color: "red", marginBottom: 8, textAlign: "center" },
});
