import { supabase } from "@/lib/supabaseClient";
import { localStorageUtils } from "@/utils/localStorage";
import { sampleFoods } from "@/utils/sampleData";
import { Food, FoodLog } from "@/types";

export interface DataConsistencyResult {
  foodsSync: boolean;
  logsSync: boolean;
  errors: string[];
}

/**
 * Ensures sample foods are available both locally and in Supabase
 */
export async function ensureSampleFoodsConsistency(isAuthenticated: boolean): Promise<void> {
  // Always ensure sample foods are in localStorage
  const localFoods = localStorageUtils.getFoods();
  if (localFoods.length === 0) {
    console.log("📦 Loading sample foods to localStorage...");
    localStorageUtils.saveFoods(sampleFoods);
  }

  if (isAuthenticated) {
    // If user is authenticated, also ensure sample foods are in Supabase
    try {
      const { data: existingFoods, error } = await supabase
        .from("foods")
        .select("id")
        .limit(1);

      if (error) {
        console.error("Error checking Supabase foods:", error);
        return;
      }

      // If Supabase has no foods, insert the sample foods
      if (!existingFoods || existingFoods.length === 0) {
        console.log("📦 Loading sample foods to Supabase...");
        const { error: insertError } = await supabase
          .from("foods")
          .insert(sampleFoods.map(food => ({
            id: food.id,
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

        if (insertError) {
          console.error("Error inserting sample foods to Supabase:", insertError);
        } else {
          console.log("✅ Sample foods loaded to Supabase");
        }
      }
    } catch (error) {
      console.error("Error ensuring sample foods consistency:", error);
    }
  }
}

/**
 * Validates that food logs reference existing foods
 */
export async function validateFoodLogConsistency(userId: string): Promise<DataConsistencyResult> {
  const result: DataConsistencyResult = {
    foodsSync: true,
    logsSync: true,
    errors: []
  };

  try {
    // Get all food logs for the user
    const { data: userLogs, error: logsError } = await supabase
      .from("food_logs")
      .select("id, food_id")
      .eq("user_id", userId);

    if (logsError) {
      result.logsSync = false;
      result.errors.push(`Failed to fetch user logs: ${logsError.message}`);
      return result;
    }

    if (!userLogs || userLogs.length === 0) {
      return result; // No logs to validate
    }

    // Get all unique food IDs from logs
    const foodIds = [...new Set(userLogs.map(log => log.food_id))];

    // Check if all referenced foods exist
    const { data: existingFoods, error: foodsError } = await supabase
      .from("foods")
      .select("id")
      .in("id", foodIds);

    if (foodsError) {
      result.foodsSync = false;
      result.errors.push(`Failed to fetch foods: ${foodsError.message}`);
      return result;
    }

    const existingFoodIds = new Set(existingFoods?.map(f => f.id) || []);
    const missingFoodIds = foodIds.filter(id => !existingFoodIds.has(id));

    if (missingFoodIds.length > 0) {
      result.foodsSync = false;
      result.errors.push(`Missing foods for IDs: ${missingFoodIds.join(", ")}`);
      
      // Attempt to fix by removing orphaned logs
      console.warn("🔧 Removing orphaned food logs...");
      const { error: deleteError } = await supabase
        .from("food_logs")
        .delete()
        .in("food_id", missingFoodIds)
        .eq("user_id", userId);

      if (deleteError) {
        result.errors.push(`Failed to clean orphaned logs: ${deleteError.message}`);
      } else {
        console.log("✅ Cleaned orphaned food logs");
      }
    }

  } catch (error) {
    result.foodsSync = false;
    result.logsSync = false;
    result.errors.push(`Consistency check failed: ${error}`);
  }

  return result;
}

/**
 * Forces a complete refresh of food logs from Supabase
 */
export async function refreshUserData(userId: string): Promise<(FoodLog & { food: Food })[]> {
  try {
    // First ensure data consistency
    await validateFoodLogConsistency(userId);

    // Then fetch fresh data
    const { data: foodLogsData, error: logsError } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", userId)
      .order("consumed_date", { ascending: false });

    if (logsError) {
      console.error("Error refreshing food logs:", logsError);
      return [];
    }

    if (!foodLogsData || foodLogsData.length === 0) {
      return [];
    }

    // Get all unique food IDs
    const foodIds = [...new Set(foodLogsData.map(log => log.food_id))];

    // Fetch all referenced foods
    const { data: foodsData, error: foodsError } = await supabase
      .from("foods")
      .select("*")
      .in("id", foodIds);

    if (foodsError) {
      console.error("Error refreshing foods:", foodsError);
      return [];
    }

    // Create food lookup map
    const foodsMap = new Map<string, Food>();
    foodsData?.forEach(food => {
      foodsMap.set(food.id, food as Food);
    });

    // Combine logs with food data
    const logsWithFood = foodLogsData
      .map(log => {
        const food = foodsMap.get(log.food_id);
        if (!food) {
          console.warn(`Missing food data for log ${log.id}, food_id: ${log.food_id}`);
          return null;
        }

        return {
          id: log.id as string,
          user_id: log.user_id,
          food_id: log.food_id as string,
          servings_consumed: Number(log.servings_consumed),
          consumed_date: new Date(log.consumed_date).getTime(),
          food: food
        };
      })
      .filter((log): log is (FoodLog & { food: Food }) => log !== null);

    console.log("✅ User data refreshed successfully");
    return logsWithFood;

  } catch (error) {
    console.error("Error refreshing user data:", error);
    return [];
  }
}
