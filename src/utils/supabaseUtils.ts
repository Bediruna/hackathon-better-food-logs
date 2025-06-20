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

    // Convert Supabase data to application format
    return data.map(food => ({
      id: food.id,
      name: food.name,
      brandName: food.brand_name,
      servingDescription: food.serving_description,
      servingMassG: food.serving_mass_g,
      servingVolumeMl: food.serving_volume_ml,
      calories: food.calories,
      proteinG: food.protein_g,
      fatG: food.fat_g,
      carbsG: food.carbs_g,
      sugarG: food.sugar_g,
      sodiumMg: food.sodium_mg,
      cholesterolMg: food.cholesterol_mg,
    }));
  },
  async addFood(food: Omit<Food, "id">): Promise<Food | null> {
    // Map the food fields to match Supabase column names
    const supabaseFood = {
      name: food.name,
      brand_name: food.brandName,
      serving_description: food.servingDescription,
      serving_mass_g: food.servingMassG,
      serving_volume_ml: food.servingVolumeMl,
      calories: food.calories,
      protein_g: food.proteinG,
      fat_g: food.fatG,
      carbs_g: food.carbsG,
      sugar_g: food.sugarG,
      sodium_mg: food.sodiumMg,
      cholesterol_mg: food.cholesterolMg,
    };

    const { data, error } = await supabase
      .from("foods")
      .insert(supabaseFood)
      .select()
      .single();
    if (error) {
      console.error("Error adding food:", error);
      return null;
    }

    // Convert back to application format
    return {
      id: data.id,
      name: data.name,
      brandName: data.brand_name,
      servingDescription: data.serving_description,
      servingMassG: data.serving_mass_g,
      servingVolumeMl: data.serving_volume_ml,
      calories: data.calories,
      proteinG: data.protein_g,
      fatG: data.fat_g,
      carbsG: data.carbs_g,
      sugarG: data.sugar_g,
      sodiumMg: data.sodium_mg,
      cholesterolMg: data.cholesterol_mg,
    };
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
        userId: parseInt(user.id.slice(-8), 16), // Convert for compatibility
        foodId: log.food_id,
        servingsConsumed: log.servings_consumed,
        consumedDate: new Date(log.consumed_date).getTime(),
        food: {
          id: log.food.id,
          name: log.food.name,
          brandName: log.food.brand_name,
          servingDescription: log.food.serving_description,
          servingMassG: log.food.serving_mass_g,
          servingVolumeMl: log.food.serving_volume_ml,
          calories: log.food.calories,
          proteinG: log.food.protein_g,
          fatG: log.food.fat_g,
          carbsG: log.food.carbs_g,
          sugarG: log.food.sugar_g,
          sodiumMg: log.food.sodium_mg,
          cholesterolMg: log.food.cholesterol_mg,
        },
      }));
  },
  async addFoodLog(log: Omit<FoodLog, "id">): Promise<FoodLog | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("User not authenticated");
      return null;
    }

    // Map the log fields to match Supabase column names
    const supabaseLog = {
      user_id: user.id, // Use Firebase UID directly as string
      food_id: log.foodId,
      servings_consumed: log.servingsConsumed,
      consumed_date: new Date(log.consumedDate).toISOString(),
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
      userId: parseInt(user.id.slice(-8), 16), // Convert for compatibility
      foodId: data.food_id,
      servingsConsumed: data.servings_consumed,
      consumedDate: new Date(data.consumed_date).getTime(),
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
      userId: user ? parseInt(user.id.slice(-8), 16) : 1,
      foodId: data.food_id,
      servingsConsumed: data.servings_consumed,
      consumedDate: new Date(data.consumed_date).getTime(),
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