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
  },  async addFood(food: Omit<Food, "id">): Promise<Food | null> {
    const { data, error } = await supabase
      .from("foods")
      .insert(food)
      .select()
      .single();
    if (error) {
      console.error("Error adding food:", error);
      return null;
    }

    return data;
  },

  // ✅ FOOD LOG METHODS
  async getFoodLogs(): Promise<(FoodLog & { food: Food })[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return []; // If user is not logged in, return empty array
    }

    const { data, error } = await supabase
      .from("food_logs")
      .select(
        `
        *,
        food:foods (
          id, name, brand_name, serving_description, serving_mass_g, serving_volume_ml,
          calories, protein_g, fat_g, carbs_g, sugar_g, sodium_mg, cholesterol_mg
        )
      `
      )
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching food logs:", error);
      return [];
    }    // Convert Supabase data to application format
    return data
      .filter(log => log.food) // Only include logs with food data
      .map(log => ({
        id: log.id,
        user_id: parseInt(user.id.slice(-8), 16), // Convert for compatibility
        food_id: log.food_id,
        servings_consumed: log.servings_consumed,
        consumed_date: new Date(log.consumed_date).getTime(),
        food: log.food,
      }));
  },
  async addFoodLog(log: Omit<FoodLog, "id">): Promise<FoodLog | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("User not authenticated");
      return null;
    }    // Map the log fields to match Supabase column names
    const supabaseLog = {
      user_id: user.id, // Use Firebase UID directly as string
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
      console.error("Error adding food log:", error);
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

async updateFoodLog(logId: number, servingsConsumed: number): Promise<FoodLog | null> {
    const { data, error } = await supabase
      .from("food_logs")
      .update({ servings_consumed: servingsConsumed })
      .eq("id", logId)
      .select()
      .single();
    if (error) {
      console.error("Error updating food log:", error);
      return null;
    }
    
    // Convert back to application format
    const {
      data: { user },
    } = await supabase.auth.getUser();
      return {
      id: data.id,
      user_id: user ? parseInt(user.id.slice(-8), 16) : 1,
      food_id: data.food_id,
      servings_consumed: data.servings_consumed,
      consumed_date: new Date(data.consumed_date).getTime(),
    };
  },

  async deleteFoodLog(logId: number): Promise<boolean> {
const { error } = await supabase.from("food_logs").delete().eq("id", logId);
    if (error) {
      console.error("Error deleting food log:", error);
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