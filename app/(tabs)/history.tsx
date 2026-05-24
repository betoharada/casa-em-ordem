import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
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
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: fetchHistory,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-800">Histórico</Text>
        <Text className="text-gray-500 mt-1">Últimos 7 dias</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Nenhuma atividade ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 gap-2"
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-4 flex-row items-center gap-3 border border-gray-100">
              <Text className="text-xl">{item.task_icon ?? "✅"}</Text>
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">{item.task_title}</Text>
                <Text className="text-gray-500 text-xs mt-0.5">
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
