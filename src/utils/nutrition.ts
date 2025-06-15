import { FoodLog, NutritionSummary } from '../types';

export const calculateNutritionSummary = (foodLogs: FoodLog[]): NutritionSummary => {
  return foodLogs.reduce(
    (summary, log) => {
      if (!log.food) return summary;

      const multiplier = log.servingsConsumed;
      
      return {
        totalCalories: summary.totalCalories + (log.food.calories * multiplier),
        totalProteinG: summary.totalProteinG + (log.food.proteinG * multiplier),
        totalFatG: summary.totalFatG + (log.food.fatG * multiplier),
        totalCarbsG: summary.totalCarbsG + (log.food.carbsG * multiplier),
        totalSugarG: summary.totalSugarG + (log.food.sugarG * multiplier),
        totalSodiumMg: summary.totalSodiumMg + (log.food.sodiumMg * multiplier),
        totalCholesterolMg: summary.totalCholesterolMg + (log.food.cholesterolMg * multiplier),
      };
    },
    {
      totalCalories: 0,
      totalProteinG: 0,
      totalFatG: 0,
      totalCarbsG: 0,
      totalSugarG: 0,
      totalSodiumMg: 0,
      totalCholesterolMg: 0,
    }
  );
};