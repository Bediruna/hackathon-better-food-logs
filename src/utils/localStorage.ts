import { Food, FoodLog } from '../types';

const FOODS_KEY = 'better_food_logs_foods';
const LOGS_KEY = 'better_food_logs_logs';

export const localStorageUtils = {
  // Foods
  getFoods(): Food[] {
    try {
      const foods = localStorage.getItem(FOODS_KEY);
      return foods ? JSON.parse(foods) : [];
    } catch {
      return [];
    }
  },

  saveFoods(foods: Food[]): void {
    localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
  },

  addFood(food: Food): void {
    const foods = this.getFoods();
    foods.push(food);
    this.saveFoods(foods);
  },

  // Food Logs
  getFoodLogs(): FoodLog[] {
    try {
      const logs = localStorage.getItem(LOGS_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  },

  saveFoodLogs(logs: FoodLog[]): void {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  },

  addFoodLog(log: Omit<FoodLog, 'id'>): void {
    const logs = this.getFoodLogs();
    const newLog: FoodLog = {
      ...log,
      id: Date.now() + Math.random(), // Simple ID generation
    };
    logs.push(newLog);
    this.saveFoodLogs(logs);
  },

  // Clear all data
  clearAll(): void {
    localStorage.removeItem(FOODS_KEY);
    localStorage.removeItem(LOGS_KEY);
  },
};