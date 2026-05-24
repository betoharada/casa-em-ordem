import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

type ModalType = "create" | "join" | null;

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["family-data"],
    queryFn: fetchFamilyData,
  });

  const [modalType, setModalType] = useState<ModalType>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!inputValue.trim()) {
      Alert.alert("Atenção", "Digite o nome da família");
      return;
    }
    setSaving(true);
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: family, error } = await supabase
      .from("families")
      .insert({ name: inputValue.trim(), invite_code: inviteCode })
      .select()
      .single();

    if (error || !family) {
      setSaving(false);
      Alert.alert("Erro", "Não foi possível criar a família");
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      family_id: family.id,
      display_name: data?.profile?.display_name ?? "Membro",
    });

    setSaving(false);
    setModalType(null);
    setInputValue("");
    queryClient.invalidateQueries({ queryKey: ["family-data"] });
    Alert.alert(
      "Família criada! 🎉",
      `Compartilhe o código com sua família:\n\n${inviteCode}`,
      [{ text: "OK" }]
    );
  }

  async function handleJoin() {
    if (!inputValue.trim()) {
      Alert.alert("Atenção", "Digite o código de convite");
      return;
    }
    setSaving(true);
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("invite_code", inputValue.trim().toUpperCase())
      .single();

    if (!family) {
      setSaving(false);
      Alert.alert("Código inválido", "Verifique o código e tente novamente");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      family_id: family.id,
      display_name: data?.profile?.display_name ?? "Membro",
    });

    setSaving(false);
    setModalType(null);
    setInputValue("");
    queryClient.invalidateQueries({ queryKey: ["family-data"] });
    Alert.alert("Bem-vindo! 🏠", "Você entrou na família com sucesso.");
  }

  function openModal(type: ModalType) {
    setInputValue("");
    setModalType(type);
  }

  if (isLoading) return <SafeAreaView style={styles.container} />;

  const { family, members, profile } = data ?? {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Família</Text>
        </View>

        {family ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>FAMÍLIA</Text>
              <Text style={styles.familyName}>{family.name}</Text>
              <View style={styles.inviteBox}>
                <Text style={styles.inviteLabel}>Código de convite</Text>
                <Text style={styles.inviteCode}>{family.invite_code}</Text>
                <Text style={styles.inviteHint}>
                  Compartilhe esse código com quem quiser adicionar à família
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>MEMBROS ({members?.length})</Text>
              {members?.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {m.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>{m.display_name}</Text>
                  {m.id === profile?.id && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>Você</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.noFamilyTitle}>Você não está em uma família ainda</Text>
            <Text style={styles.noFamilyText}>
              Crie uma família e compartilhe o código com os outros membros,
              ou entre em uma família existente com o código de convite.
            </Text>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => openModal("create")}
            >
              <Text style={styles.buttonPrimaryText}>🏠  Criar família</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => openModal("join")}
            >
              <Text style={styles.buttonSecondaryText}>🔑  Entrar com código</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.buttonDanger}
          onPress={() =>
            Alert.alert("Sair", "Tem certeza que quer sair da conta?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Sair", style: "destructive", onPress: () => supabase.auth.signOut() },
            ])
          }
        >
          <Text style={styles.buttonDangerText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: criar ou entrar na família */}
      <Modal visible={modalType !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {modalType === "create" ? "Criar família" : "Entrar na família"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {modalType === "create"
                ? "Como se chama a sua família?"
                : "Digite o código de convite"}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={modalType === "create" ? "Ex: Família Harada" : "Ex: AB12CD"}
              autoCapitalize={modalType === "create" ? "words" : "characters"}
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalType(null)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, saving && { opacity: 0.6 }]}
                onPress={modalType === "create" ? handleCreate : handleJoin}
                disabled={saving}
              >
                <Text style={styles.modalConfirmText}>
                  {saving ? "Salvando..." : "Confirmar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 20, gap: 16 },
  header: { paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  cardLabel: {
    fontSize: 11, color: "#9CA3AF", fontWeight: "600",
    letterSpacing: 0.5, marginBottom: 10,
  },
  familyName: { fontSize: 20, fontWeight: "bold", color: "#1F2937", marginBottom: 16 },
  inviteBox: {
    backgroundColor: "#EFF6FF", borderRadius: 12, padding: 14,
  },
  inviteLabel: { fontSize: 12, color: "#3B82F6", fontWeight: "600", marginBottom: 4 },
  inviteCode: {
    fontSize: 28, fontWeight: "bold", color: "#1D4ED8",
    letterSpacing: 4, marginBottom: 6,
  },
  inviteHint: { fontSize: 12, color: "#6B7280" },
  memberRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  memberAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  memberAvatarText: { fontSize: 16, fontWeight: "bold", color: "#2563EB" },
  memberName: { fontSize: 15, color: "#1F2937", flex: 1 },
  youBadge: {
    backgroundColor: "#EFF6FF", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  youBadgeText: { fontSize: 11, color: "#2563EB", fontWeight: "600" },
  noFamilyTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 8 },
  noFamilyText: { fontSize: 14, color: "#6B7280", marginBottom: 20, lineHeight: 20 },
  buttonPrimary: {
    backgroundColor: "#2563EB", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginBottom: 12,
  },
  buttonPrimaryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  buttonSecondary: {
    borderWidth: 1.5, borderColor: "#2563EB", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  buttonSecondaryText: { color: "#2563EB", fontWeight: "600", fontSize: 15 },
  buttonDanger: {
    borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FEF2F2",
    borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  buttonDangerText: { color: "#DC2626", fontWeight: "600" },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modalBox: {
    backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  modalInput: {
    borderWidth: 1.5, borderColor: "#D1D5DB", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancel: {
    flex: 1, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12,
    paddingVertical: 13, alignItems: "center",
  },
  modalCancelText: { color: "#6B7280", fontWeight: "600" },
  modalConfirm: {
    flex: 1, backgroundColor: "#2563EB", borderRadius: 12,
    paddingVertical: 13, alignItems: "center",
  },
  modalConfirmText: { color: "#fff", fontWeight: "600" },
});
