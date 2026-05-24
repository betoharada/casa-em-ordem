import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-800">Tarefas de hoje</Text>
        <Text className="text-gray-500 mt-1">
          {done}/{tasks.length} concluídas
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : tasks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-base">
            Nenhuma tarefa cadastrada ainda.
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            Adicione tarefas em Família → Configurações
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 gap-3"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                if (!item.completion) {
                  await markTaskDone(item.id);
                  refetch();
                }
              }}
              className={`rounded-2xl p-4 flex-row items-center gap-3 ${
                item.completion ? "bg-green-50 border border-green-200" : "bg-white border border-gray-200"
              }`}
            >
              <Text className="text-2xl">{item.icon ?? "✅"}</Text>
              <View className="flex-1">
                <Text
                  className={`text-base font-medium ${
                    item.completion ? "text-green-700 line-through" : "text-gray-800"
                  }`}
                >
                  {item.title}
                </Text>
                {item.completion && (
                  <Text className="text-xs text-green-600 mt-0.5">Feito!</Text>
                )}
              </View>
              {!item.completion && (
                <Text className="text-gray-400 text-sm">Toque para marcar</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
