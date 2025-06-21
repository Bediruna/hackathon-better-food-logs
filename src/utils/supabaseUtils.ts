import { supabase } from "@/lib/supabaseClient";
import { Food, FoodLog } from "@/types";

export const supabaseUtils = {
  // ✅ FOOD METHODS
  async getFoods(): Promise<Food[]> {
    const { data, error } = await supabase.from("foods").select("*");
    if (error) {
      console.error("Error fetching foods:", error);
      return [];
    }

    return data || [];
  },
  async addFood(food: Omit<Food, "id">): Promise<Food | null> {
    const { data, error } = await supabase
      .from("foods")
      .insert(food)
      .select()
      .single();
    if (error) {
      console.error("Error adding food:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      return null;
    }    return data;
  },

  // ✅ FOOD LOG METHODS
  async getFoodLogs(): Promise<(FoodLog & { food: Food })[]> {
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("User not authenticated:", {
        authError,
        user: user?.id || 'null',
        errorMessage: authError?.message,
        timestamp: new Date().toISOString()
      });
      return [];
    }

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
        fullError: logsError
      });
      return [];
    }

    if (!foodLogsData || foodLogsData.length === 0) {
      return [];
    }

    // Get all unique food IDs from the logs
    const foodIds = [...new Set(foodLogsData.map(log => log.food_id))];

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
        fullError: foodsError
      });
      return [];
    }

    // Create a map of food ID to food data for quick lookup
    const foodsMap = new Map<number, Food>();
    (foodsData || []).forEach(food => {
      foodsMap.set(food.id, food);
    });

    // Convert Supabase data to application format, including food data
    return foodLogsData
      .filter(log => foodsMap.has(log.food_id)) // Only include logs with valid food data
      .map(log => ({
        id: log.id,
        user_id: parseInt(user.id.slice(-8), 16), // Convert for compatibility
        food_id: log.food_id,
        servings_consumed: log.servings_consumed,
        consumed_date: new Date(log.consumed_date).getTime(),
        food: foodsMap.get(log.food_id)!,
      }));
  },

  async addFoodLog(log: Omit<FoodLog, "id">): Promise<FoodLog | null> {
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
      console.error("User not authenticated for addFoodLog:", {
        authError,
        user: user?.id || 'null',
        errorMessage: authError?.message,
        timestamp: new Date().toISOString(),
        attemptedLog: log
      });
      return null;
    }

    // Map the log fields to match Supabase column names
    const supabaseLog = {
      user_id: user.id, // Use Supabase user ID
      food_id: log.food_id,
      servings_consumed: log.servings_consumed,
      consumed_date: new Date(log.consumed_date).toISOString(),
    };

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
        attemptedData: supabaseLog
      });
      return null;
    }

    // Convert back to application format
    return {
      id: data.id,
      user_id: parseInt(user.id.slice(-8), 16), // Convert for compatibility
      food_id: data.food_id,
      servings_consumed: data.servings_consumed,
      consumed_date: new Date(data.consumed_date).getTime(),
    };
  },

  async updateFoodLog(logId: number, servings_consumed: number): Promise<FoodLog | null> {
    const { data, error } = await supabase
      .from("food_logs")
      .update({ servings_consumed: servings_consumed })
      .eq("id", logId)
      .select()
      .single();    if (error) {
      console.error("Error updating food log:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
        logId,
        servings_consumed
      });
      return null;
    }
    
    // Convert back to application format
    return {
      id: data.id,
      user_id: 1, // This function doesn't have access to user ID, keeping simple
      food_id: data.food_id,
      servings_consumed: data.servings_consumed,
      consumed_date: new Date(data.consumed_date).getTime(),
    };
  },
  async deleteFoodLog(logId: number): Promise<boolean> {
    const { error } = await supabase.from("food_logs").delete().eq("id", logId);
    if (error) {
      console.error("Error deleting food log:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
        logId
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