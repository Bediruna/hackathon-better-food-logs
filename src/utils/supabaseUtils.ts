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
    return data as Food[];
  },

  async addFood(food: Omit<Food, "id">): Promise<Food | null> {
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
      return []; // If user is not logged in, we can provide local data if available
    }

    const { data, error } = await supabase.from("food_logs").select(
      `
        *,
        food:foods (
          id, name, brand_name, serving_description, serving_mass_g, serving_volume_ml,
          calories, protein_g, fat_g, carbs_g, sugar_g, sodium_mg, cholesterol_mg
        )
      `
    );

    if (error) {
      console.error("Error fetching food logs:", error);
      return [];
    }

    return data as (FoodLog & { food: Food })[];
  },

  async addFoodLog(log: Omit<FoodLog, "id">): Promise<FoodLog | null> {
    const { data, error } = await supabase
      .from("food_logs")
      .insert(log)
      .select()
      .single();
    if (error) {
      console.error("Error adding food log:", error);
      return null;
    }
    return data;
  },

  async updateFoodLog(
    logId: number,
    servingsConsumed: number
  ): Promise<FoodLog | null> {
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
    return data;
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
