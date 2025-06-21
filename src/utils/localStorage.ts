import { Food, FoodLog } from "../types";

const FOODS_KEY = "better_food_logs_foods";
const LOGS_KEY = "better_food_logs_logs";

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
  addFoodLog(log: Omit<FoodLog, "id">): FoodLog {
    const logs = this.getFoodLogs();
    const newLog: FoodLog = {
      ...log,
      id: Date.now() + Math.random(), // Simple ID generation
    };
    logs.push(newLog);
    this.saveFoodLogs(logs);
    return newLog;
  },  updateFoodLog(logId: number, servings_consumed: number): boolean {
    console.log('LocalStorage updateFoodLog called with ID:', logId, 'servings:', servings_consumed);
    const logs = this.getFoodLogs();
    console.log('Current logs in localStorage:', logs.map(log => ({ id: log.id, servings: log.servings_consumed })));
    const logIndex = logs.findIndex((log) => log.id === logId);
    console.log('Found log at index:', logIndex);
    if (logIndex !== -1) {
      logs[logIndex].servings_consumed = servings_consumed;
      this.saveFoodLogs(logs);
      console.log('Successfully updated log in localStorage');
      return true;
    }
    console.log('Log with ID', logId, 'not found in localStorage');
    return false;
  },

  deleteFoodLog(logId: number): boolean {
    const logs = this.getFoodLogs();
const filteredLogs = logs.filter((log) => log.id !== logId);
    if (filteredLogs.length !== logs.length) {
      this.saveFoodLogs(filteredLogs);
      return true;
    }
    return false;
  },

  // Clear all data
  clearAll(): void {
    localStorage.removeItem(FOODS_KEY);
    localStorage.removeItem(LOGS_KEY);
  },
};
