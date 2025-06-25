import { supabase } from "@/lib/supabaseClient";
import { localStorageUtils } from "@/utils/localStorage";
import { Food, FoodLog } from "@/types";

export async function syncLocalStorageToSupabase(userId: string) {
  const localFoods = localStorageUtils.getFoods();
  const localLogs = localStorageUtils.getFoodLogs();

  if (localFoods.length === 0 && localLogs.length === 0) return;

  try {
    // Step 1: Sync foods first to ensure they exist in Supabase
    await syncFoodsToSupabase(localFoods);
    
    // Step 2: Sync food logs, using the correct food IDs
    await syncFoodLogsToSupabase(localLogs, userId);
    
    // Step 3: Clear local storage after successful sync
    localStorageUtils.clearAll();
    console.log("✅ Successfully synced local data to Supabase.");
  } catch (error) {
    console.error("❌ Error during sync:", error);
    // Don't clear local storage if sync failed
  }
}

async function syncFoodsToSupabase(localFoods: Food[]) {
  if (localFoods.length === 0) return;

  // Get existing foods from Supabase
  const { data: existingFoods, error: foodFetchError } = await supabase
    .from("foods")
    .select("id, name, brand_name, serving_description, serving_mass_g");

  if (foodFetchError) {
    throw new Error(`Failed to fetch existing foods: ${foodFetchError.message}`);
  }

  // Create a set of existing food identifiers for quick lookup
  const existingFoodSet = new Set(
    existingFoods?.map((f) => createFoodIdentifier(f)) || []
  );

  // Filter out foods that already exist
  const newFoods = localFoods.filter(
    (food) => !existingFoodSet.has(createFoodIdentifier(food))
  );

  if (newFoods.length > 0) {
    console.log(`📦 Syncing ${newFoods.length} new foods to Supabase...`);
    
    const { error: insertFoodsError } = await supabase
      .from("foods")
      .insert(newFoods.map(food => ({
        id: food.id, // Preserve the UUID from localStorage
        name: food.name,
        brand_name: food.brand_name,
        serving_description: food.serving_description,
        serving_mass_g: food.serving_mass_g,
        serving_volume_ml: food.serving_volume_ml,
        calories: food.calories,
        protein_g: food.protein_g,
        fat_g: food.fat_g,
        carbs_g: food.carbs_g,
        sugar_g: food.sugar_g,
        sodium_mg: food.sodium_mg,
        cholesterol_mg: food.cholesterol_mg
      })));

    if (insertFoodsError) {
      throw new Error(`Failed to insert foods: ${insertFoodsError.message}`);
    }
    
    console.log(`✅ Successfully synced ${newFoods.length} foods`);
  }
}

async function syncFoodLogsToSupabase(localLogs: FoodLog[], userId: string) {
  if (localLogs.length === 0) return;

  // Get existing logs from Supabase for this user
  const { data: existingLogs, error: logFetchError } = await supabase
    .from("food_logs")
    .select("id, food_id, consumed_date, servings_consumed")
    .eq("user_id", userId);

  if (logFetchError) {
    throw new Error(`Failed to fetch existing logs: ${logFetchError.message}`);
  }

  // Create a set of existing log identifiers
  const existingLogSet = new Set(
    existingLogs?.map((log) => createLogIdentifier(log)) || []
  );

  // Filter out logs that already exist
  const newLogs = localLogs.filter(
    (log) => !existingLogSet.has(createLogIdentifier(log))
  );

  if (newLogs.length > 0) {
    console.log(`📝 Syncing ${newLogs.length} new food logs to Supabase...`);
    
    const logsToInsert = newLogs.map(log => ({
      id: log.id, // Preserve the UUID from localStorage
      user_id: userId,
      food_id: log.food_id, // Use the same food ID
      consumed_date: new Date(log.consumed_date).toISOString(),
      servings_consumed: log.servings_consumed,
    }));

    const { error: insertLogsError } = await supabase
      .from("food_logs")
      .insert(logsToInsert);

    if (insertLogsError) {
      throw new Error(`Failed to insert food logs: ${insertLogsError.message}`);
    }
    
    console.log(`✅ Successfully synced ${newLogs.length} food logs`);
  }
}

function createFoodIdentifier(food: Pick<Food, 'name' | 'brand_name' | 'serving_description' | 'serving_mass_g'>): string {
  // Create a unique identifier for a food item
  return `${food.name}|${food.brand_name || ''}|${food.serving_description}|${food.serving_mass_g || 0}`;
}

function createLogIdentifier(log: { food_id: string; consumed_date: string | number; servings_consumed: number }): string {
  // Create a unique identifier for a food log
  const date = typeof log.consumed_date === 'number' 
    ? new Date(log.consumed_date).toISOString()
    : log.consumed_date;
  return `${log.food_id}|${date}|${log.servings_consumed}`;
}
