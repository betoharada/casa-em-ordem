import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Atenção", "Preencha e-mail e senha");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert("Erro ao entrar", error.message);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.emoji}>🏠</Text>
        <Text style={styles.title}>Casa em Ordem</Text>
        <Text style={styles.subtitle}>Entre para ver as tarefas da família</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Senha"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: "#1F2937", marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: "center", color: "#6B7280", marginBottom: 40 },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16,
  },
  passwordRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, marginBottom: 24,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
  },
  eyeButton: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },
  button: {
    backgroundColor: "#2563EB", borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginBottom: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  linkButton: { marginTop: 8, alignItems: "center" },
  linkText: { color: "#2563EB" },
});
