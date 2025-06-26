import { supabase } from "@/lib/supabaseClient";
import { localStorageUtils } from "@/utils/localStorage";

export async function syncLocalStorageToSupabase(userId: string) {
  const localFoods = localStorageUtils.getFoods();
  const localLogs = localStorageUtils.getFoodLogs();

  console.log(`Starting sync for user ${userId}:`, {
    localFoodsCount: localFoods.length,
    localLogsCount: localLogs.length
  });

  if (localFoods.length === 0 && localLogs.length === 0) {
    console.log("No local data to sync");
    return;
  }

  try {
    // Validate local foods data before syncing
    const validLocalFoods = localFoods.filter((food) => {
      if (!food.name || typeof food.name !== 'string') {
        console.warn('Filtering out food with invalid name:', food.id);
        return false;
      }
      if (!food.serving_description || typeof food.serving_description !== 'string') {
        console.warn('Filtering out food with invalid serving_description:', food.id);
        return false;
      }
      return true;
    });

    console.log(`Validated ${validLocalFoods.length} out of ${localFoods.length} local foods`);

    // 1. Sync Foods first
    if (validLocalFoods.length > 0) {
      console.log("Syncing foods to Supabase...");
      
      // Fetch existing foods from Supabase
      const { data: existingFoods, error: foodFetchError } = await supabase
        .from("foods")
        .select("id, name, brand_name, serving_description, serving_mass_g, serving_volume_ml");

      if (foodFetchError) {
        console.error("Error fetching existing foods:", foodFetchError.message);
        throw foodFetchError;
      }

      // Create a set of existing food signatures for duplicate detection
      const existingFoodSignatures = new Set(
        existingFoods?.map((f) => 
          `${(f.name || '').toLowerCase().trim()}-${(f.brand_name || '').toLowerCase().trim()}-${(f.serving_description || '').toLowerCase().trim()}-${f.serving_mass_g || 0}-${f.serving_volume_ml || 0}`
        ) || []
      );

      // Filter out foods that already exist in Supabase
      const newFoods = validLocalFoods.filter((food) => {
        // Skip foods with missing required fields (additional safety check)
        if (!food.name || !food.serving_description) {
          console.warn('Skipping food with missing required fields:', food);
          return false;
        }
        const signature = `${food.name.toLowerCase().trim()}-${(food.brand_name || '').toLowerCase().trim()}-${food.serving_description.toLowerCase().trim()}-${food.serving_mass_g || 0}-${food.serving_volume_ml || 0}`;
        return !existingFoodSignatures.has(signature);
      });

      console.log(`Found ${newFoods.length} new foods to sync`);

      // Insert new foods to Supabase
      if (newFoods.length > 0) {
        // Convert local foods to Supabase format (remove local IDs)
        const foodsToInsert = newFoods.map(({ id, ...food }) => {
          void id; // Explicitly indicate we're not using this variable
          return {
            ...food,
            // Ensure all numeric fields are properly formatted
            serving_mass_g: food.serving_mass_g || null,
            serving_volume_ml: food.serving_volume_ml || null,
            calories: food.calories || 0,
            protein_g: food.protein_g || 0,
            fat_g: food.fat_g || 0,
            carbs_g: food.carbs_g || 0,
            sugar_g: food.sugar_g || 0,
            sodium_mg: food.sodium_mg || 0,
            cholesterol_mg: food.cholesterol_mg || 0,
          };
        });

        const { data: insertedFoods, error: insertFoodsError } = await supabase
          .from("foods")
          .insert(foodsToInsert)
          .select();

        if (insertFoodsError) {
          console.error("Error inserting foods:", insertFoodsError.message);
          throw insertFoodsError;
        }

        console.log(`Successfully synced ${insertedFoods?.length || 0} foods to Supabase`);
      }
    }

    // 2. Refresh all foods to get correct IDs for food logs sync
    const { data: allFoods, error: allFoodsError } = await supabase
      .from("foods")
      .select("id, name, brand_name, serving_description, serving_mass_g, serving_volume_ml");

    if (allFoodsError) {
      console.error("Error fetching all foods:", allFoodsError.message);
      throw allFoodsError;
    }

    // Create a mapping from local food signature to Supabase food ID
    const foodIdMap = new Map<string, string>();
    allFoods?.forEach((food) => {
      // Skip foods with missing required fields
      if (!food.name || !food.serving_description) {
        console.warn('Skipping Supabase food with missing required fields:', food);
        return;
      }
      const signature = `${food.name.toLowerCase().trim()}-${(food.brand_name || '').toLowerCase().trim()}-${food.serving_description.toLowerCase().trim()}-${food.serving_mass_g || 0}-${food.serving_volume_ml || 0}`;
      foodIdMap.set(signature, food.id);
    });

    // 3. Sync Food Logs
    if (localLogs.length > 0) {
      console.log("Syncing food logs to Supabase...");

      // Fetch existing logs for this user
      const { data: existingLogs, error: logFetchError } = await supabase
        .from("food_logs")
        .select("food_id, consumed_date, servings_consumed")
        .eq("user_id", userId);

      if (logFetchError) {
        console.error("Error fetching existing food logs:", logFetchError.message);
        throw logFetchError;
      }

      // Create a set of existing log signatures
      const existingLogSignatures = new Set(
        existingLogs?.map((log) => 
          `${log.food_id}-${new Date(log.consumed_date).getTime()}-${log.servings_consumed}`
        ) || []
      );

      // Process local logs and map to Supabase food IDs
      const logsToInsert = localLogs
        .map((log): {
          user_id: string;
          food_id: string;
          consumed_date: string;
          servings_consumed: number;
        } | null => {
          // Find the corresponding local food
          const localFood = validLocalFoods.find((f) => f.id === log.food_id);
          if (!localFood) {
            console.warn(`Local food not found for log with food_id: ${log.food_id}`);
            return null;
          }

          // Skip foods with missing required fields
          if (!localFood.name || !localFood.serving_description) {
            console.warn('Skipping log for food with missing required fields:', localFood);
            return null;
          }

          // Create signature to find Supabase food ID
          const foodSignature = `${localFood.name.toLowerCase().trim()}-${(localFood.brand_name || '').toLowerCase().trim()}-${localFood.serving_description.toLowerCase().trim()}-${localFood.serving_mass_g || 0}-${localFood.serving_volume_ml || 0}`;
          const supabaseFoodId = foodIdMap.get(foodSignature);
          
          if (!supabaseFoodId) {
            console.warn(`Supabase food ID not found for signature: ${foodSignature}`);
            return null;
          }

          // Check if this log already exists
          const logSignature = `${supabaseFoodId}-${log.consumed_date}-${log.servings_consumed}`;
          if (existingLogSignatures.has(logSignature)) {
            return null; // Skip duplicate
          }

          return {
            user_id: userId,
            food_id: supabaseFoodId,
            consumed_date: new Date(log.consumed_date).toISOString(),
            servings_consumed: log.servings_consumed,
          };
        })
        .filter((log): log is NonNullable<typeof log> => Boolean(log));

      console.log(`Found ${logsToInsert.length} new food logs to sync`);

      if (logsToInsert.length > 0) {
        const { error: insertLogsError } = await supabase
          .from("food_logs")
          .insert(logsToInsert);

        if (insertLogsError) {
          console.error("Error inserting food logs:", insertLogsError.message);
          throw insertLogsError;
        }

        console.log(`Successfully synced ${logsToInsert.length} food logs to Supabase`);
      }
    }

    // 4. Clear local storage after successful sync
    localStorageUtils.clearAll();
    console.log("✅ Successfully synced all local data to Supabase and cleared local storage");

  } catch (error) {
    console.error("❌ Error during sync:", error);
    // Don't clear local storage if sync failed
    throw error;
  }
}