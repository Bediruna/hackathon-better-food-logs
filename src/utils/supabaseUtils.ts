import { supabase } from "@/lib/supabaseClient";
import { Food, FoodLog } from "@/types";
import type { User } from "@supabase/supabase-js";

export const supabaseUtils = {
  // ✅ USER METHODS
  async ensureUserExists(user: User): Promise<void> {
    try {
      // Try to insert the user record using upsert (INSERT ... ON CONFLICT DO NOTHING)
      const { error } = await supabase.from("users").upsert(
        {
          id: user.id,
          display_name: user.user_metadata?.full_name || user.email || "Unknown User",
          email: user.email || "",
          photo_url: user.user_metadata?.avatar_url || null,
        },
        { 
          onConflict: "id",
          ignoreDuplicates: true 
        }
      );

      if (error) {
        console.error("Error ensuring user exists:", error);
        // Continue anyway - the user might exist or the constraint might be relaxed
      } else {
        console.log("User record ensured for:", user.id);
      }
    } catch (error) {
      console.error("Exception in ensureUserExists:", error);
      // Continue anyway
    }
  },

  // ✅ FOOD METHODS
  async getFoods(): Promise<Food[]> {
    const { data, error } = await supabase.from("foods").select("*");
    if (error) {
      console.error("Error fetching foods:", error);
      return [];
    }

    // Convert Supabase data to application format
    return (data || []).map(food => ({
      id: food.id,
      name: food.name,
      brand_name: food.brand_name,
      serving_description: food.serving_description,
      serving_mass_g: food.serving_mass_g,
      serving_volume_ml: food.serving_volume_ml,
      calories: food.calories || 0,
      protein_g: food.protein_g || 0,
      fat_g: food.fat_g || 0,
      carbs_g: food.carbs_g || 0,
      sugar_g: food.sugar_g || 0,
      sodium_mg: food.sodium_mg || 0,
      cholesterol_mg: food.cholesterol_mg || 0,
    }));
  },

  async addFood(food: Omit<Food, "id">): Promise<Food | null> {
    const { data, error } = await supabase
      .from("foods")
      .insert({
        name: food.name,
        brand_name: food.brand_name || null,
        serving_description: food.serving_description,
        serving_mass_g: food.serving_mass_g || null,
        serving_volume_ml: food.serving_volume_ml || null,
        calories: food.calories || 0,
        protein_g: food.protein_g || 0,
        fat_g: food.fat_g || 0,
        carbs_g: food.carbs_g || 0,
        sugar_g: food.sugar_g || 0,
        sodium_mg: food.sodium_mg || 0,
        cholesterol_mg: food.cholesterol_mg || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding food:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
      });
      return null;
    }

    // Convert back to application format
    return {
      id: data.id,
      name: data.name,
      brand_name: data.brand_name,
      serving_description: data.serving_description,
      serving_mass_g: data.serving_mass_g,
      serving_volume_ml: data.serving_volume_ml,
      calories: data.calories || 0,
      protein_g: data.protein_g || 0,
      fat_g: data.fat_g || 0,
      carbs_g: data.carbs_g || 0,
      sugar_g: data.sugar_g || 0,
      sodium_mg: data.sodium_mg || 0,
      cholesterol_mg: data.cholesterol_mg || 0,
    };
  },

  // ✅ FOOD LOG METHODS
  async getFoodLogs(): Promise<(FoodLog & { food: Food })[]> {
    // Get the current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("User not authenticated:", {
        authError,
        user: user?.id || "null",
        errorMessage: authError?.message,
        timestamp: new Date().toISOString(),
      });
      return [];
    }

    // Ensure user record exists in the users table
    await this.ensureUserExists(user);

    // First, get the food logs
    const { data: foodLogsData, error: logsError } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id);

    if (logsError) {
      console.error("Error fetching food logs:", {
        message: logsError.message,
        details: logsError.details,
        hint: logsError.hint,
        code: logsError.code,
        fullError: logsError,
      });
      return [];
    }

    if (!foodLogsData || foodLogsData.length === 0) {
      return [];
    }

    // Get all unique food IDs from the logs
    const foodIds = [...new Set(foodLogsData.map((log) => log.food_id))];

    // Fetch all foods that are referenced in the logs
    const { data: foodsData, error: foodsError } = await supabase
      .from("foods")
      .select("*")
      .in("id", foodIds);

    if (foodsError) {
      console.error("Error fetching foods:", {
        message: foodsError.message,
        details: foodsError.details,
        hint: foodsError.hint,
        code: foodsError.code,
        fullError: foodsError,
      });
      return [];
    }

    // Create a map of food ID to food data for quick lookup
    const foodsMap = new Map();
    if (foodsData) {
      foodsData.forEach((food) => {
        foodsMap.set(food.id, {
          id: food.id,
          name: food.name,
          brand_name: food.brand_name,
          serving_description: food.serving_description,
          serving_mass_g: food.serving_mass_g,
          serving_volume_ml: food.serving_volume_ml,
          calories: food.calories || 0,
          protein_g: food.protein_g || 0,
          fat_g: food.fat_g || 0,
          carbs_g: food.carbs_g || 0,
          sugar_g: food.sugar_g || 0,
          sodium_mg: food.sodium_mg || 0,
          cholesterol_mg: food.cholesterol_mg || 0,
        });
      });
    }

    // Convert Supabase data to application format
    return foodLogsData
      .map((log) => {
        const food = foodsMap.get(log.food_id);
        if (!food) return null; // Skip logs where food doesn't exist
        
        return {
          id: log.id as string,
          user_id: user.id, // Use directly as UUID string
          food_id: log.food_id as string,
          servings_consumed: Number(log.servings_consumed),
          consumed_date: new Date(log.consumed_date).getTime(),
          food: food as Food,
        };
      })
      .filter((log) => log !== null) as (FoodLog & { food: Food })[];
  },

  async addFoodLog(log: Omit<FoodLog, "id" | "food">): Promise<FoodLog | null> {
    // Get the current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("User not authenticated for addFoodLog:", {
        authError,
        user: user?.id || "null",
        errorMessage: authError?.message,
        timestamp: new Date().toISOString(),
        attemptedLog: log,
      });
      return null;
    }

    // Ensure user record exists in the users table
    await this.ensureUserExists(user);

    // Map the log fields to match Supabase column names
    const supabaseLog = {
      user_id: user.id, // Use Supabase user ID (UUID string)
      food_id: log.food_id,
      servings_consumed: log.servings_consumed,
      consumed_date: new Date(log.consumed_date).toISOString(), // convert from Unix timestamp to ISO
    };

    console.log("Attempting to insert food log:", supabaseLog);

    const { data, error } = await supabase
      .from("food_logs")
      .insert(supabaseLog)
      .select()
      .single();

    if (error) {
      console.error("Error adding food log:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
        attemptedData: supabaseLog,
      });
      return null;
    }

    console.log("Successfully inserted food log:", data);

    // Convert back to application format
    return {
      id: data.id.toString(), // Ensure it's a string
      user_id: data.user_id,
      food_id: data.food_id.toString(), // Ensure it's a string
      servings_consumed: data.servings_consumed,
      consumed_date: new Date(data.consumed_date).getTime(), // convert to Unix timestamp
    };
  },

  async updateFoodLog(
    logId: string,
    servings_consumed: number
  ): Promise<FoodLog | null> {
    const { data, error } = await supabase
      .from("food_logs")
      .update({ servings_consumed })
      .eq("id", logId)
      .select()
      .single();
    if (error) {
      console.error("Error updating food log:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
        logId,
        servings_consumed,
      });
      return null;
    }

    // Convert back to application format
    return {
      id: data.id, // UUID
      user_id: data.user_id,
      food_id: data.food_id,
      servings_consumed: data.servings_consumed,
      consumed_date: new Date(data.consumed_date).getTime(), // convert to Unix timestamp
    };
  },

  async deleteFoodLog(logId: string): Promise<boolean> {
    const { error } = await supabase.from("food_logs").delete().eq("id", logId);
    if (error) {
      console.error("Error deleting food log:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
        logId,
      });
      return false;
    }
    return true;
  },

  // Delete or clear utilities
  async deleteAllFoods() {
    const { error } = await supabase.from("foods").delete().neq("id", "");
    if (error) console.error("Error deleting foods:", error);
  },

  async deleteAllLogs() {
    const { error } = await supabase.from("food_logs").delete().neq("id", "");
    if (error) console.error("Error deleting logs:", error);
  },
};