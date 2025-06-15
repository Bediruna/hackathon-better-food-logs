import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Zap } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import FoodLogEntry from '../components/FoodLogEntry';
import TodaysSummary from '../components/TodaysSummary';
import { Food, FoodLog } from '../types';
import { localStorageUtils } from '../utils/localStorage';
import { sampleFoods } from '../utils/sampleData';

export default function HomePage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  useEffect(() => {
    // Load foods from localStorage, or initialize with sample data
    let storedFoods = localStorageUtils.getFoods();
    if (storedFoods.length === 0) {
      localStorageUtils.saveFoods(sampleFoods);
      storedFoods = sampleFoods;
    }
    setFoods(storedFoods);

    // Load food logs
    const logs = localStorageUtils.getFoodLogs();
    const logsWithFoodData = logs.map(log => ({
      ...log,
      food: storedFoods.find(food => food.id === log.foodId)
    }));
    setFoodLogs(logsWithFoodData);
  }, []);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
  };

  const handleLogFood = (food: Food, servings: number) => {
    const newLog = {
      userId: 1, // Default user for now
      foodId: food.id,
      servingsConsumed: servings,
      consumedDate: Date.now(),
    };
    
    localStorageUtils.addFoodLog(newLog);
    
    // Update state
    const logWithFood = { ...newLog, id: Date.now(), food };
    setFoodLogs(prev => [logWithFood, ...prev]);
    setSelectedFood(null);
  };

  const handleCancelFoodEntry = () => {
    setSelectedFood(null);
  };

  // Get today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysLogs = foodLogs.filter(log => {
    const logDate = new Date(log.consumedDate);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center mb-4">
          <Zap className="text-emerald-500 mr-2" size={32} />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Quick Food Logging
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Log your meals instantly with our smart search. No friction, just results.
        </p>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <SearchBar
          foods={foods}
          onSelectFood={handleSelectFood}
          placeholder="Search foods to log..."
        />
        
        <div className="flex justify-center">
          <Link
            to="/create"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 text-gray-700 hover:text-emerald-600"
          >
            <Plus size={16} />
            <span>Create New Food Record</span>
          </Link>
        </div>
      </div>

      {/* Food Entry Modal */}
      {selectedFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <FoodLogEntry
              food={selectedFood}
              onLog={handleLogFood}
              onCancel={handleCancelFoodEntry}
            />
          </div>
        </div>
      )}

      {/* Today's Summary */}
      <TodaysSummary todaysLogs={todaysLogs} />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{todaysLogs.length}</p>
          <p className="text-emerald-100 text-sm">Meals Today</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{foods.length}</p>
          <p className="text-blue-100 text-sm">Foods Available</p>
        </div>
      </div>
    </div>
  );
}