export interface Food {
  id: number;
  name: string;
  brand_name?: string;
  serving_description: string;
  serving_mass_g: number;
  serving_volume_ml: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
}

export interface FoodLog {
  id: number;
  user_id: number;
  food_id: number;
  food?: Food;
  servings_consumed: number;
  consumed_date: number; // Unix timestamp
}

export interface User {
  id: number;
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