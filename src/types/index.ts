export interface Food {
  id: number;
  name: string;
  brandName?: string;
  servingDescription: string;
  servingMassG: number;
  servingVolumeMl: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG: number;
  sodiumMg: number;
  cholesterolMg: number;
}

export interface FoodLog {
  id: number;
  userId: number;
  foodId: number;
  food?: Food;
  servingsConsumed: number;
  consumedDate: number; // Unix timestamp
}

export interface User {
  id: number;
  displayName: string;
  email: string;
  photoURL?: string;
  createdDate: number; // Unix timestamp
}

export interface NutritionSummary {
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  totalSugarG: number;
  totalSodiumMg: number;
  totalCholesterolMg: number;
}