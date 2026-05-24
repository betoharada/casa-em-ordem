import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  return {
    profile,
    family: (profile as any).families as Family | null,
    members: members ?? [],
  };
}

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["family-data"],
    queryFn: fetchFamilyData,
  });

  async function createFamily() {
    Alert.prompt?.("Nova família", "Nome da sua família:", async (name) => {
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

      await supabase.from("profiles").upsert({
        id: user.id,
        family_id: family.id,
        display_name: data?.profile?.display_name ?? "Membro",
      });
      queryClient.invalidateQueries({ queryKey: ["family-data"] });
      Alert.alert("Família criada!", `Código de convite: ${inviteCode}`);
    }, "plain-text");
  }

  async function joinFamily() {
    Alert.prompt?.("Entrar na família", "Digite o código de convite:", async (code) => {
      if (!code) return;
      const { data: family } = await supabase
        .from("families")
        .select("id")
        .eq("invite_code", code.toUpperCase())
        .single();

      if (!family) { Alert.alert("Código inválido"); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("profiles").upsert({
        id: user.id,
        family_id: family.id,
        display_name: data?.profile?.display_name ?? "Membro",
      });
      queryClient.invalidateQueries({ queryKey: ["family-data"] });
      Alert.alert("Você entrou na família!");
    }, "plain-text");
  }

  if (isLoading) return <SafeAreaView style={styles.container} />;

  const { family, members, profile } = data ?? {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Família</Text>
      </View>

      <View style={styles.content}>
        {family ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>FAMÍLIA</Text>
              <Text style={styles.familyName}>{family.name}</Text>
              <Text style={styles.inviteText}>
                Código de convite:{" "}
                <Text style={styles.inviteCode}>{family.invite_code}</Text>
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>MEMBROS ({members?.length})</Text>
              {members?.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <Text style={styles.memberIcon}>👤</Text>
                  <Text style={styles.memberName}>{m.display_name}</Text>
                  {m.id === profile?.id && (
                    <Text style={styles.youLabel}>Você</Text>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.noFamilyText}>
              Você ainda não está em uma família.
            </Text>
            <TouchableOpacity style={styles.buttonPrimary} onPress={createFamily}>
              <Text style={styles.buttonPrimaryText}>Criar família</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={joinFamily}>
              <Text style={styles.buttonSecondaryText}>Entrar com código</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.buttonDanger}
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={styles.buttonDangerText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
  content: { paddingHorizontal: 20, gap: 16 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  cardLabel: {
    fontSize: 11, color: "#9CA3AF", fontWeight: "600",
    letterSpacing: 0.5, marginBottom: 8,
  },
  familyName: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  inviteText: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  inviteCode: { fontWeight: "bold", color: "#2563EB" },
  memberRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  memberIcon: { fontSize: 20, marginRight: 8 },
  memberName: { fontSize: 15, color: "#1F2937", flex: 1 },
  youLabel: { fontSize: 12, color: "#2563EB" },
  noFamilyText: { color: "#6B7280", marginBottom: 16 },
  buttonPrimary: {
    backgroundColor: "#2563EB", borderRadius: 12,
    paddingVertical: 12, alignItems: "center", marginBottom: 12,
  },
  buttonPrimaryText: { color: "#fff", fontWeight: "600" },
  buttonSecondary: {
    borderWidth: 1, borderColor: "#2563EB", borderRadius: 12,
    paddingVertical: 12, alignItems: "center",
  },
  buttonSecondaryText: { color: "#2563EB", fontWeight: "600" },
  buttonDanger: {
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
    borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8,
  },
  buttonDangerText: { color: "#DC2626", fontWeight: "600" },
});
