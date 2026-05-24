import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import type { Task, TaskCompletion } from "@/types/database";

type TaskWithCompletion = Task & { completion: TaskCompletion | null };

async function fetchTodayTasks(): Promise<TaskWithCompletion[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) return [];

  const today = new Date().toISOString().split("T")[0];

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", profile.family_id);

  const { data: completions } = await supabase
    .from("task_completions")
    .select("*")
    .gte("completed_at", `${today}T00:00:00`)
    .lte("completed_at", `${today}T23:59:59`);

  return (tasks ?? []).map((task) => ({
    ...task,
    completion: (completions ?? []).find((c) => c.task_id === task.id) ?? null,
  }));
}

async function markTaskDone(taskId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("task_completions").insert({
    task_id: taskId,
    completed_by: user.id,
  });
}

export default function HomeScreen() {
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["today-tasks"],
    queryFn: fetchTodayTasks,
  });

  const done = tasks.filter((t) => t.completion !== null).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tarefas de hoje</Text>
        <Text style={styles.subtitle}>{done}/{tasks.length} concluídas</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
      ) : tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhuma tarefa cadastrada ainda.</Text>
          <Text style={styles.emptyHint}>Adicione tarefas em Família → Configurações</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                if (!item.completion) {
                  await markTaskDone(item.id);
                  refetch();
                }
              }}
              style={[styles.card, item.completion ? styles.cardDone : styles.cardPending]}
            >
              <Text style={styles.cardIcon}>{item.icon ?? "✅"}</Text>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, item.completion && styles.cardTitleDone]}>
                  {item.title}
                </Text>
                {item.completion && <Text style={styles.cardDoneLabel}>Feito!</Text>}
              </View>
              {!item.completion && <Text style={styles.cardHint}>Toque para marcar</Text>}
            </TouchableOpacity>
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
  emptyText: { color: "#9CA3AF", fontSize: 16 },
  emptyHint: { color: "#9CA3AF", fontSize: 13, marginTop: 4 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: {
    borderRadius: 16, padding: 16, flexDirection: "row",
    alignItems: "center", borderWidth: 1,
  },
  cardPending: { backgroundColor: "#fff", borderColor: "#E5E7EB" },
  cardDone: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "500", color: "#1F2937" },
  cardTitleDone: { color: "#15803D", textDecorationLine: "line-through" },
  cardDoneLabel: { fontSize: 12, color: "#16A34A", marginTop: 2 },
  cardHint: { fontSize: 12, color: "#9CA3AF" },
});
