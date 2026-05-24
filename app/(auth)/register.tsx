import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert("Preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      Alert.alert("A senha precisa ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    setLoading(false);
    if (error) Alert.alert("Erro ao cadastrar", error.message);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-2xl font-bold text-center text-gray-800 mb-1">
          Criar conta
        </Text>
        <Text className="text-center text-gray-500 mb-10">
          Cadastre-se para entrar na família
        </Text>

        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base"
          placeholder="Seu nome"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base"
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-6 text-base"
          placeholder="Senha (mínimo 6 caracteres)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 items-center"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Cadastrar</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity className="mt-4 items-center">
            <Text className="text-blue-600">Já tem conta? Entre aqui</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
