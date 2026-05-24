import { Link, useRouter } from "expo-router";
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

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Atenção", "Preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Atenção", "A senha precisa ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Atenção", "As senhas não coincidem");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    setLoading(false);

    if (error) {
      Alert.alert("Erro ao cadastrar", error.message);
      return;
    }

    Alert.alert(
      "Conta criada!",
      "Seu cadastro foi realizado com sucesso.",
      [{ text: "Fazer login", onPress: () => router.replace("/(auth)/login") }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Cadastre-se para entrar na família</Text>

        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
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
            placeholder="Senha (mínimo 6 caracteres)"
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

        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirmar senha"
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirm((v) => !v)}
          >
            <Text style={styles.eyeIcon}>{showConfirm ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Já tem conta? Entre aqui</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: "#1F2937", marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: "center", color: "#6B7280", marginBottom: 40 },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16,
  },
  passwordRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, marginBottom: 16,
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
