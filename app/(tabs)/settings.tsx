import { useQuery } from "@tanstack/react-query";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import type { Family, Profile } from "@/types/database";

async function fetchFamilyData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, families(*)")
    .eq("id", user.id)
    .single<Profile & { families: Family | null }>();

  if (!profile?.family_id) return { profile, family: null, members: [] };

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .eq("family_id", profile.family_id);

  return { profile, family: (profile as any).families as Family | null, members: members ?? [] };
}

export default function SettingsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["family-data"],
    queryFn: fetchFamilyData,
  });

  async function createFamily() {
    const name = await promptName();
    if (!name) return;

    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: family, error } = await supabase
      .from("families")
      .insert({ name, invite_code: inviteCode })
      .select()
      .single();

    if (error || !family) { Alert.alert("Erro ao criar família"); return; }

    await supabase.from("profiles").upsert({ id: user.id, family_id: family.id, display_name: data?.profile?.display_name ?? "Membro" });
    Alert.alert("Família criada!", `Código de convite: ${inviteCode}`);
  }

  async function joinFamily() {
    Alert.prompt?.("Entrar na família", "Digite o código de convite", async (code) => {
      if (!code) return;
      const { data: family } = await supabase
        .from("families")
        .select("id")
        .eq("invite_code", code.toUpperCase())
        .single();

      if (!family) { Alert.alert("Código inválido"); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("profiles").upsert({ id: user.id, family_id: family.id, display_name: data?.profile?.display_name ?? "Membro" });
      Alert.alert("Você entrou na família!");
    });
  }

  if (isLoading) return <SafeAreaView className="flex-1 bg-gray-50" />;

  const { family, members, profile } = data ?? {};

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-800">Família</Text>
      </View>

      <View className="px-5 gap-4">
        {family ? (
          <>
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-xs text-gray-400 uppercase font-semibold mb-1">Família</Text>
              <Text className="text-lg font-bold text-gray-800">{family.name}</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Código de convite: <Text className="font-bold text-blue-600">{family.invite_code}</Text>
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-xs text-gray-400 uppercase font-semibold mb-3">Membros ({members?.length})</Text>
              {members?.map((m) => (
                <View key={m.id} className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xl">👤</Text>
                  <Text className="text-gray-800">{m.display_name}</Text>
                  {m.id === profile?.id && (
                    <Text className="text-xs text-blue-500 ml-auto">Você</Text>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-gray-600 mb-4">Você ainda não está em uma família.</Text>
            <TouchableOpacity
              className="bg-blue-600 rounded-xl py-3 items-center mb-3"
              onPress={createFamily}
            >
              <Text className="text-white font-semibold">Criar família</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="border border-blue-600 rounded-xl py-3 items-center"
              onPress={joinFamily}
            >
              <Text className="text-blue-600 font-semibold">Entrar com código</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          className="bg-red-50 border border-red-200 rounded-xl py-3 items-center mt-4"
          onPress={() => supabase.auth.signOut()}
        >
          <Text className="text-red-600 font-semibold">Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function promptName(): Promise<string> {
  return new Promise((resolve) => {
    Alert.prompt?.("Nova família", "Nome da sua família:", (text) => resolve(text ?? ""), "plain-text");
  });
}
