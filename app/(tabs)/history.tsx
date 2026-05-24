import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

type HistoryItem = {
  id: string;
  task_title: string;
  task_icon: string | null;
  completed_by_name: string;
  completed_at: string;
};

async function fetchHistory(): Promise<HistoryItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: completions } = await supabase
    .from("task_completions")
    .select("id, completed_at, completed_by, tasks(title, icon), profiles(display_name)")
    .gte("completed_at", sevenDaysAgo.toISOString())
    .order("completed_at", { ascending: false });

  return (completions ?? []).map((c: any) => ({
    id: c.id,
    task_title: c.tasks?.title ?? "Tarefa",
    task_icon: c.tasks?.icon ?? null,
    completed_by_name: c.profiles?.display_name ?? "Alguém",
    completed_at: c.completed_at,
  }));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: fetchHistory,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>Últimos 7 dias</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhuma atividade ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.icon}>{item.task_icon ?? "✅"}</Text>
              <View style={styles.cardBody}>
                <Text style={styles.taskTitle}>{item.task_title}</Text>
                <Text style={styles.meta}>
                  {item.completed_by_name} · {formatDate(item.completed_at)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#9CA3AF" },
  list: { paddingHorizontal: 20, gap: 8 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#F3F4F6",
  },
  icon: { fontSize: 22, marginRight: 12 },
  cardBody: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: "500", color: "#1F2937" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
