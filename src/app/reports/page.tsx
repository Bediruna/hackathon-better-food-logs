"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Target,
  Award,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { FoodLog } from "@/types";
import { localStorageUtils } from "@/utils/localStorage";
import { calculateNutritionSummary } from "@/utils/nutrition";
import { supabaseUtils } from "@/utils/supabaseUtils";
import { supabase } from "@/lib/supabaseClient";
import EditFoodLogModal from "@/components/EditFoodLogModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function ReportsPage() {
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"7days" | "30days">(
    "7days"
  );
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<FoodLog | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsLoggedIn(true);
        const logs = await supabaseUtils.getFoodLogs();
        if (logs.length === 0) {
          console.log("No logs found for your account.");
        }
        setFoodLogs(logs);
      } else {
        setIsLoggedIn(false);
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

  const handleEditLog = async (logId: number, newServings: number) => {
  if (isLoggedIn) {
    const updatedLog = await supabaseUtils.updateFoodLog(logId, newServings);
    if (updatedLog) {
      setFoodLogs((prev) =>
        prev.map((log) =>
          log.id === logId ? { ...log, servingsConsumed: newServings } : log
        )
      );
    }
  } else {
    const success = localStorageUtils.updateFoodLog(logId, newServings);
    if (success) {
      setFoodLogs((prev) =>
        prev.map((log) =>
          log.id === logId ? { ...log, servingsConsumed: newServings } : log
        )
      );
    }
  }
  setEditingLog(null);
};
    
  const handleDeleteLog = async (logId: number) => {
  if (isLoggedIn) {
    const success = await supabaseUtils.deleteFoodLog(logId);
    if (success) {
      setFoodLogs((prev) => prev.filter((log) => log.id !== logId));
    }
  } else {
    const success = localStorageUtils.deleteFoodLog(logId);
    if (success) {
      setFoodLogs((prev) => prev.filter((log) => log.id !== logId));
    }
  }
  setDeletingLog(null);
};

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
      logs: dayLogs,
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

      {/* Daily Calories Chart with Food Logs */}
      <div className="p-6 border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Daily Calories & Food Logs
        </h2>

        <div className="space-y-4">
          {dailyData.map((day, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4">
              {/* Day Header with Chart */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-16 text-sm font-medium text-gray-700">
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

              {/* Food Logs for this day */}
              {day.logs.length > 0 && (
                <div className="ml-19 space-y-2">
                  {day.logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
  <div className="flex items-center space-x-2">
    <h4 className="font-medium text-gray-900">{log.food?.name}</h4>
    {log.food?.brandName && (
      <span className="text-sm text-gray-500">({log.food.brandName})</span>
    )}
  </div>
  <p className="text-xs text-gray-500">
    {log.servingsConsumed} serving{log.servingsConsumed !== 1 ? "s" : ""} •{" "}
    {Math.round((log.food?.calories || 0) * log.servingsConsumed)} cal
  </p>
</div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingLog(log)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit log"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingLog(log)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Edit Modal */}
      {editingLog && (
        <EditFoodLogModal
          log={editingLog}
          onSave={handleEditLog}
          onCancel={() => setEditingLog(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingLog && (
        <DeleteConfirmModal
          log={deletingLog}
          onConfirm={handleDeleteLog}
          onCancel={() => setDeletingLog(null)}
        />
      )}
    </div>
  );
}