import { FoodLog, NutritionSummary } from '../types';

export const calculateNutritionSummary = (foodLogs: FoodLog[]): NutritionSummary => {
  return foodLogs.reduce(
    (summary, log) => {
      if (!log.food) return summary;

      const multiplier = log.servings_consumed || 0;
      
      return {
        total_calories: summary.total_calories + ((log.food.calories || 0) * multiplier),
        total_protein_g: summary.total_protein_g + ((log.food.protein_g || 0) * multiplier),
        total_fat_g: summary.total_fat_g + ((log.food.fat_g || 0) * multiplier),
        total_carbs_g: summary.total_carbs_g + ((log.food.carbs_g || 0) * multiplier),
        total_sugar_g: summary.total_sugar_g + ((log.food.sugar_g || 0) * multiplier),
        total_sodium_mg: summary.total_sodium_mg + ((log.food.sodium_mg || 0) * multiplier),
        total_cholesterol_mg: summary.total_cholesterol_mg + ((log.food.cholesterol_mg || 0) * multiplier),
      };
    },
    {
      total_calories: 0,
      total_protein_g: 0,
      total_fat_g: 0,
      total_carbs_g: 0,
      total_sugar_g: 0,
      total_sodium_mg: 0,
      total_cholesterol_mg: 0,
    }
  );
};