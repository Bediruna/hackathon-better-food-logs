"use client";

import React, { useState, useEffect } from "react";
import { Calendar, TrendingUp, Target, Award } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { FoodLog } from "@/types";
import { localStorageUtils } from "@/utils/localStorage";
import { calculateNutritionSummary } from "@/utils/nutrition";
import { supabaseUtils } from "@/utils/supabaseUtils";
import { supabase } from "@/lib/supabaseClient";

export default function ReportsPage() {
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"7days" | "30days">(
    "7days"
  );

  useEffect(() => {
    const fetchLogs = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const logs = await supabaseUtils.getFoodLogs();
        if (logs.length === 0) {
          alert("No logs found for your account.");
        }
        setFoodLogs(logs);
      } else {
        // Not logged in — fallback to localStorage
        const logs = localStorageUtils.getFoodLogs();
        const foods = localStorageUtils.getFoods();
        const logsWithFoodData = logs.map((log) => ({
          ...log,
          food: foods.find((food) => food.id === log.foodId),
        }));
        setFoodLogs(logsWithFoodData);
      }
    };

    fetchLogs();
  }, []);

  const getPeriodLogs = (days: number) => {
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(new Date(), days - 1));

    return foodLogs.filter((log) => {
      const logDate = new Date(log.consumedDate);
      return logDate >= startDate && logDate <= endDate;
    });
  };

  const periodLogs = getPeriodLogs(selectedPeriod === "7days" ? 7 : 30);
  const summary = calculateNutritionSummary(periodLogs);
  const days = selectedPeriod === "7days" ? 7 : 30;

  const averageCalories = Math.round(summary.totalCalories / days);
  const averageProtein = Math.round(summary.totalProteinG / days);

  // Daily breakdown for the chart
  const dailyData = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const dayLogs = foodLogs.filter((log) => {
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

  const maxCalories = Math.max(...dailyData.map((d) => d.calories), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <TrendingUp className="mr-2 text-emerald-500" size={32} />
          <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text">
            Your Progress
          </h1>
        </div>
        <p className="text-gray-600">
          Track your nutrition journey and see your patterns
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="p-1 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm">
          <button
            onClick={() => setSelectedPeriod("7days")}
            className={`px-4 py-2 rounded-md transition-all duration-200 ${
              selectedPeriod === "7days"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod("30days")}
            className={`px-4 py-2 rounded-md transition-all duration-200 ${
              selectedPeriod === "30days"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="p-4 text-center text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
          <Calendar className="mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold">{averageCalories}</p>
          <p className="text-sm text-emerald-100">Avg Calories/Day</p>
        </div>

        <div className="p-4 text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
          <Target className="mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold">{averageProtein}g</p>
          <p className="text-sm text-blue-100">Avg Protein/Day</p>
        </div>

        <div className="p-4 text-center text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
          <Award className="mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold">{periodLogs.length}</p>
          <p className="text-sm text-purple-100">Total Meals</p>
        </div>

        <div className="p-4 text-center text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
          <TrendingUp className="mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold">
            {Math.round(summary.totalCalories)}
          </p>
          <p className="text-sm text-orange-100">Total Calories</p>
        </div>
      </div>

      {/* Daily Calories Chart */}
      <div className="p-6 border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Daily Calories
        </h2>

        <div className="space-y-2">
          {dailyData.map((day, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-16 text-xs text-right text-gray-500">
                {format(day.date, "MMM d")}
              </div>
              <div className="relative flex-1 h-6 overflow-hidden bg-gray-200 rounded-full">
                <div
                  className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                  style={{ width: `${(day.calories / maxCalories) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-medium text-gray-700">
                    {day.calories} cal
                  </span>
                </div>
              </div>
              <div className="w-12 text-xs text-center text-gray-500">
                {day.meals} meals
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition Breakdown */}
      <div className="p-6 border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Nutrition Breakdown (
          {selectedPeriod === "7days" ? "Last 7 Days" : "Last 30 Days"})
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="p-4 text-center rounded-lg bg-gray-50">
            <p className="text-2xl font-bold text-emerald-600">
              {Math.round(summary.totalProteinG)}g
            </p>
            <p className="text-sm text-gray-600">Total Protein</p>
          </div>

          <div className="p-4 text-center rounded-lg bg-gray-50">
            <p className="text-2xl font-bold text-orange-600">
              {Math.round(summary.totalFatG)}g
            </p>
            <p className="text-sm text-gray-600">Total Fat</p>
          </div>

          <div className="p-4 text-center rounded-lg bg-gray-50">
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(summary.totalCarbsG)}g
            </p>
            <p className="text-sm text-gray-600">Total Carbs</p>
          </div>

          <div className="p-4 text-center rounded-lg bg-gray-50">
            <p className="text-2xl font-bold text-pink-600">
              {Math.round(summary.totalSugarG)}g
            </p>
            <p className="text-sm text-gray-600">Total Sugar</p>
          </div>

          <div className="p-4 text-center rounded-lg bg-gray-50">
            <p className="text-2xl font-bold text-red-600">
              {Math.round(summary.totalSodiumMg)}mg
            </p>
            <p className="text-sm text-gray-600">Total Sodium</p>
          </div>

          <div className="p-4 text-center rounded-lg bg-gray-50">
            <p className="text-2xl font-bold text-yellow-600">
              {Math.round(summary.totalCholesterolMg)}mg
            </p>
            <p className="text-sm text-gray-600">Total Cholesterol</p>
          </div>
        </div>
      </div>

      {periodLogs.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-4 text-gray-400">
            <Calendar size={48} className="mx-auto" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No data yet
          </h3>
          <p className="text-gray-500">
            Start logging your meals to see your progress here!
          </p>
        </div>
      )}
    </div>
  );
}
