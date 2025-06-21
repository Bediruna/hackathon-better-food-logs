import { supabase } from "@/lib/supabaseClient";
import { localStorageUtils } from "@/utils/localStorage";

export async function syncLocalStorageToSupabase(userId: string) {
  const localFoods = localStorageUtils.getFoods();
  const localLogs = localStorageUtils.getFoodLogs();

  if (localFoods.length === 0 && localLogs.length === 0) return;

  // Fetch foods from Supabase
  const { data: existingFoods, error: foodFetchError } = await supabase
    .from("foods")
    .select("id, name, serving_mass_g");

  if (foodFetchError) {
    console.error("Error fetching foods:", foodFetchError.message);
    return;
  }

  const existingFoodSet = new Set(
    existingFoods?.map((f) => `${f.name}-${f.serving_mass_g}`)
  );

  // Filter new foods
  const newFoods = localFoods.filter(
    (food) => !existingFoodSet.has(`${food.name}-${food.serving_mass_g}`)
  );

  if (newFoods.length > 0) {
    const { error: insertFoodsError } = await supabase
      .from("foods")
      .insert(newFoods);
    if (insertFoodsError) {
      console.error("Error inserting foods:", insertFoodsError.message);
      return;
    }
  }

  // Refresh all foods to get correct IDs
  const { data: allFoods } = await supabase
    .from("foods")
    .select("id, name, serving_mass_g");

  const foodIdMap = new Map<string, string>();
  allFoods?.forEach((food) => {
    foodIdMap.set(`${food.name}-${food.serving_mass_g}`, food.id);
  });

  // Fetch existing logs
  const { data: existingLogs, error: logFetchError } = await supabase
    .from("food_logs")
    .select("food_id, consumed_date")
    .eq("user_id", userId);

  if (logFetchError) {
    console.error("Error fetching food logs:", logFetchError.message);
    return;
  }

  const existingLogSet = new Set(
    existingLogs?.map((log) => `${log.food_id}-${log.date}`)
  );

  const logsToInsert = localLogs
    .map(
      (
        log
      ): {
        user_id: string;
        food_id: string;
        consumed_date: string;
        servings_consumed: number;
      } | null => {
        const food = localFoods.find((f) => f.id === log.food_id);
        const foodKey = food ? `${food.name}-${food.serving_mass_g}` : "";
        const realFoodId = foodIdMap.get(foodKey);
        if (!realFoodId) return null;

        const key = `${realFoodId}-${log.consumed_date}`;
        if (existingLogSet.has(key)) return null;

        return {
          user_id: userId,
          food_id: realFoodId,
          consumed_date: new Date(log.consumed_date).toISOString(),
          servings_consumed: log.servings_consumed,
        };
      }
    )
    .filter(
      (
        log
      ): log is {
        user_id: string;
        food_id: string;
        consumed_date: number;
        servings_consumed: number;
      } => Boolean(log)
    );

  if (logsToInsert.length > 0) {
    const { error: insertLogsError } = await supabase
      .from("food_logs")
      .insert(logsToInsert);
    if (insertLogsError) {
      console.error("Error inserting food logs:", insertLogsError.message);
      return;
    }
  }

  // Clear local storage after sync
  localStorageUtils.clearAll();
  console.log("✅ Synced local foods and logs to Supabase.");
}
