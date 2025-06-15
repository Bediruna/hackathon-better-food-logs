"use client"

import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, Award } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { FoodLog } from '@/types';
import { localStorageUtils } from '@/utils/localStorage';
import { calculateNutritionSummary } from '@/utils/nutrition';

export default function ReportsPage() {
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days'>('7days');

  useEffect(() => {
    const logs = localStorageUtils.getFoodLogs();
    const foods = localStorageUtils.getFoods();
    
    const logsWithFoodData = logs.map(log => ({
      ...log,
      food: foods.find(food => food.id === log.foodId)
    }));
    
    setFoodLogs(logsWithFoodData);
  }, []);

  const getPeriodLogs = (days: number) => {
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(new Date(), days - 1));
    
    return foodLogs.filter(log => {
      const logDate = new Date(log.consumedDate);
      return logDate >= startDate && logDate <= endDate;
    });
  };

  const periodLogs = getPeriodLogs(selectedPeriod === '7days' ? 7 : 30);
  const summary = calculateNutritionSummary(periodLogs);
  const days = selectedPeriod === '7days' ? 7 : 30;
  
  const averageCalories = Math.round(summary.totalCalories / days);
  const averageProtein = Math.round(summary.totalProteinG / days);

  // Daily breakdown for the chart
  const dailyData = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);
    
    const dayLogs = foodLogs.filter(log => {
      const logDate = new Date(log.consumedDate);
      return logDate >= startDate && logDate <= endDate;
    });
    
    const daySummary = calculateNutritionSummary(dayLogs);
    
    return {
      date,
      calories: Math.round(daySummary.totalCalories),
      meals: dayLogs.length,
    };
  });

  const maxCalories = Math.max(...dailyData.map(d => d.calories), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <TrendingUp className="text-emerald-500 mr-2" size={32} />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Your Progress
          </h1>
        </div>
        <p className="text-gray-600">Track your nutrition journey and see your patterns</p>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200">
          <button
            onClick={() => setSelectedPeriod('7days')}
            className={`px-4 py-2 rounded-md transition-all duration-200 ${
              selectedPeriod === '7days'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('30days')}
            className={`px-4 py-2 rounded-md transition-all duration-200 ${
              selectedPeriod === '30days'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl p-4 text-center">
          <Calendar className="mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold">{averageCalories}</p>
          <p className="text-emerald-100 text-sm">Avg Calories/Day</p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center">
          <Target className="mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold">{averageProtein}g</p>
          <p className="text-blue-100 text-sm">Avg Protein/Day</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center">
          <Award className="mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold">{periodLogs.length}</p>
          <p className="text-purple-100 text-sm">Total Meals</p>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 text-center">
          <TrendingUp className="mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold">{Math.round(summary.totalCalories)}</p>
          <p className="text-orange-100 text-sm">Total Calories</p>
        </div>
      </div>

      {/* Daily Calories Chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Calories</h2>
        
        <div className="space-y-2">
          {dailyData.map((day, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-16 text-xs text-gray-500 text-right">
                {format(day.date, 'MMM d')}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(day.calories / maxCalories) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-medium text-gray-700">
                    {day.calories} cal
                  </span>
                </div>
              </div>
              <div className="w-12 text-xs text-gray-500 text-center">
                {day.meals} meals
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition Breakdown */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Nutrition Breakdown ({selectedPeriod === '7days' ? 'Last 7 Days' : 'Last 30 Days'})
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{Math.round(summary.totalProteinG)}g</p>
            <p className="text-gray-600 text-sm">Total Protein</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{Math.round(summary.totalFatG)}g</p>
            <p className="text-gray-600 text-sm">Total Fat</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{Math.round(summary.totalCarbsG)}g</p>
            <p className="text-gray-600 text-sm">Total Carbs</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-pink-600">{Math.round(summary.totalSugarG)}g</p>
            <p className="text-gray-600 text-sm">Total Sugar</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{Math.round(summary.totalSodiumMg)}mg</p>
            <p className="text-gray-600 text-sm">Total Sodium</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{Math.round(summary.totalCholesterolMg)}mg</p>
            <p className="text-gray-600 text-sm">Total Cholesterol</p>
          </div>
        </div>
      </div>

      {periodLogs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
          <p className="text-gray-500">Start logging your meals to see your progress here!</p>
        </div>
      )}
    </div>
  );
}