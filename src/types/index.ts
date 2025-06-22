export interface Food {
  id: string;
  name: string;
  brand_name?: string;
  serving_description: string;
  serving_mass_g: number | null;
  serving_volume_ml: number | null;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
}

export interface FoodLog {
  id: string; // UUID
  user_id: string; // UUID
  food_id: string; // UUID
  food?: Food;
  servings_consumed: number;
  consumed_date: number; // Unix timestamp
}

export interface User {
  id: string;
  display_name: string;
  email: string;
  photo_url?: string;
  created_date: number; // Unix timestamp
}

export interface NutritionSummary {
  total_calories: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  total_sugar_g: number;
  total_sodium_mg: number;
  total_cholesterol_mg: number;
}
