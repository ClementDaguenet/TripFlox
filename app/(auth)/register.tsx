import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { findUserByEmail, initDb, insertUser } from "@/contexts/db";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputBorder = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    initDb();
  }, []);

  const handleRegister = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (!username || !email || !password) {
        setError("Please fill all fields");
        return;
      }
      const existing = await findUserByEmail(email);
      if (existing) {
        setError("An account already exists with this email");
        return;
      }
      await insertUser({ username, email, password });
      setSuccess("Account created. You can now sign in.");
      setTimeout(() => {
        router.replace("/login");
      }, 600);
    } catch (e) {
      setError("Registration error");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Create account</ThemedText>
      {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
      {!!success && <ThemedText style={styles.success}>{success}</ThemedText>}
      <TextInput
        style={[styles.input, { borderColor: inputBorder, color: textColor }]}
        placeholder="Username"
        placeholderTextColor={inputBorder}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
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
      <Button title="Create account" onPress={handleRegister} />
      <View style={{ height: 12 }} />
      <Link href="/login"><ThemedText type="link">Already have an account? Sign in</ThemedText></Link>
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
  success: { color: "green", marginBottom: 8, textAlign: "center" },
});


