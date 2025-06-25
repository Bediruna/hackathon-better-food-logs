"use client";
import FoodLogEntry from "@/components/FoodLogEntry";
import SearchBar from "@/components/SearchBar";
import TodaysSummary from "@/components/TodaysSummary";
import EditFoodLogModal from "@/components/EditFoodLogModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { Food, FoodLog } from "@/types";
import { localStorageUtils } from "@/utils/localStorage";
import { sampleFoods } from "@/utils/sampleData";
import { supabaseUtils } from "@/utils/supabaseUtils";
import { refreshUserData, ensureSampleFoodsConsistency } from "@/utils/dataConsistency";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Zap, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<FoodLog | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      
      try {
        // Always load foods (sample foods are ensured by AuthContext)
        const storedFoods = localStorageUtils.getFoods();
        if (storedFoods.length === 0) {
          // Fallback to sample foods if localStorage is empty
          await ensureSampleFoodsConsistency(false);
          setFoods(sampleFoods);
        } else {
          setFoods(storedFoods);
        }

        // Load food logs based on authentication status
        if (user) {
          console.log("👤 Loading data for authenticated user...");
          // User is signed in, load from Supabase with consistency checks
          const supabaseLogs = await refreshUserData(user.id);
          setFoodLogs(supabaseLogs);
          console.log(`📊 Loaded ${supabaseLogs.length} food logs from cloud`);
        } else {
          console.log("👤 Loading data for anonymous user...");
          // User is not signed in, load from localStorage
          const logs = localStorageUtils.getFoodLogs();
          const currentFoods = storedFoods.length > 0 ? storedFoods : sampleFoods;
          const logsWithFoodData = logs.map((log) => ({
            ...log,
            food: currentFoods.find((food) => food.id === log.food_id),
          })).filter((log): log is FoodLog & { food: Food } => log.food !== undefined);
          
          setFoodLogs(logsWithFoodData);
          console.log(`📊 Loaded ${logsWithFoodData.length} food logs from localStorage`);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to empty state
        setFoodLogs([]);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
  };

  const handleLogFood = async (food: Food, servings: number) => {
    const newLog = {
      id: uuidv4(), // generate UUID
      user_id: user?.id ?? "anonymous", // fall back to "anonymous" or another default UUID-like string
      food_id: food.id,
      servings_consumed: servings,
      consumed_date: Date.now(), // Unix timestamp
    };

    if (user) {
      // User is signed in, save to Supabase
      try {
        const savedLog = await supabaseUtils.addFoodLog(newLog);
        if (savedLog) {
          const logWithFood = { ...savedLog, food };
          setFoodLogs((prev) => [logWithFood, ...prev]);
          console.log("Food log successfully saved to cloud");
        } else {
          throw new Error("Failed to save to Supabase");
        }
      } catch (error) {
        console.error("Error saving to Supabase:", error);
        // Fallback to localStorage on error
        const savedLocalLog = localStorageUtils.addFoodLog(newLog);
        const logWithFood = { ...savedLocalLog, food };
        setFoodLogs((prev) => [logWithFood, ...prev]);
        console.log("Food log saved locally as fallback");
      }
    } else {
      // User is not signed in, save to localStorage
      const savedLocalLog = localStorageUtils.addFoodLog(newLog);
      const logWithFood = { ...savedLocalLog, food };
      setFoodLogs((prev) => [logWithFood, ...prev]);
      console.log("Food log saved locally (user not signed in)");
    }

    setSelectedFood(null);
  };
  const handleCancelFoodEntry = () => {
    setSelectedFood(null);
  };
  const handleEditLog = (log: FoodLog) => {
    console.log("Opening edit modal for log:", log);
    setEditingLog(log);
  };  const handleSaveEditLog = async (logId: string, newServings: number) => {
    console.log(
      "Attempting to save edit for log ID:",
      logId,
      "new servings:",
      newServings
    );

    if (user) {
      // User is signed in, update in Supabase
      try {
        const updatedLog = await supabaseUtils.updateFoodLog(
          logId,
          newServings
        );
        if (updatedLog) {
          setFoodLogs((prev) =>
            prev.map((log) =>
              log.id === logId
                ? { ...log, servings_consumed: newServings }
                : log
            )
          );
          console.log("Food log successfully updated in cloud");
        } else {
          throw new Error("Failed to update in Supabase");
        }
      } catch (error) {
        console.error("Error updating in Supabase:", error);
        // Fallback to localStorage
        const success = localStorageUtils.updateFoodLog(logId, newServings);
        if (success) {
          setFoodLogs((prev) =>
            prev.map((log) =>
              log.id === logId
                ? { ...log, servings_consumed: newServings }
                : log
            )
          );
          console.log("Food log updated locally as fallback");
        } else {
          console.error("Failed to update food log locally");
        }
      }
    } else {
      // User is not signed in, update in localStorage
      console.log("Updating in localStorage for log ID:", logId);
      const success = localStorageUtils.updateFoodLog(logId, newServings);
      if (success) {
        setFoodLogs((prev) =>
          prev.map((log) =>
            log.id === logId ? { ...log, servings_consumed: newServings } : log
          )
        );
        console.log("Food log updated locally");
      } else {
        console.error("Failed to update food log in localStorage");
      }
    }

    setEditingLog(null);
  };

  const handleCancelEditLog = () => {
    setEditingLog(null);
  };

  const handleDeleteLog = (log: FoodLog) => {
    setDeletingLog(log);
  };
  const handleConfirmDeleteLog = async (logId: string) => {
    if (user) {
      // User is signed in, delete from Supabase
      try {
        const success = await supabaseUtils.deleteFoodLog(logId);
        if (success) {
          setFoodLogs((prev) => prev.filter((log) => log.id !== logId));
          console.log("Food log successfully deleted from cloud");
        } else {
          throw new Error("Failed to delete from Supabase");
        }
      } catch (error) {
        console.error("Error deleting from Supabase:", error);
        // Fallback to localStorage
        const success = localStorageUtils.deleteFoodLog(logId);
        if (success) {
          setFoodLogs((prev) => prev.filter((log) => log.id !== logId));
          console.log("Food log deleted locally as fallback");
        }
      }
    } else {
      // User is not signed in, delete from localStorage
      const success = localStorageUtils.deleteFoodLog(logId);
      if (success) {
        setFoodLogs((prev) => prev.filter((log) => log.id !== logId));
        console.log("Food log deleted locally");
      }
    }

    setDeletingLog(null);
  };

  const handleCancelDeleteLog = () => {
    setDeletingLog(null);
  };

  const handleRefreshData = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      console.log("🔄 Manually refreshing user data...");
      const refreshedLogs = await refreshUserData(user.id);
      setFoodLogs(refreshedLogs);
      console.log(`✅ Refreshed ${refreshedLogs.length} food logs`);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Get today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysLogs = foodLogs.filter((log) => {
    const logDate = new Date(log.consumed_date);
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
          Log your meals instantly with our smart search. No friction, just
          results.
        </p>
      </div>
      {/* Authentication Status */}
      {user && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-700">
              ✅ Signed in as {user.user_metadata?.full_name || user.email} - Food
              logs are being saved to the cloud
            </p>
            <button
              onClick={handleRefreshData}
              disabled={refreshing}
              className="inline-flex items-center space-x-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data from cloud"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {dataLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
            <span className="text-gray-600">Loading your food data...</span>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!dataLoading && (
        <>
          {/* Search Section */}
          <div className="space-y-4">
            <SearchBar
              foods={foods}
              onSelectFood={handleSelectFood}
              placeholder="Search foods to log..."
            />

            <div className="flex justify-center">
              <Link
                href="/create"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 text-gray-700 hover:text-emerald-600"
              >
                <Plus size={16} />
                <span>Create New Food Record</span>
              </Link>
            </div>
          </div>

          {/* Today's Summary */}
          <TodaysSummary
            todaysLogs={todaysLogs}
            onEditLog={handleEditLog}
            onDeleteLog={handleDeleteLog}
          />

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
        </>
      )}{" "}
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
      {/* Edit Food Log Modal */}
      {editingLog && (
        <EditFoodLogModal
          log={editingLog}
          onSave={handleSaveEditLog}
          onCancel={handleCancelEditLog}
        />
      )}
      {/* Delete Confirmation Modal */}
      {deletingLog && (
        <DeleteConfirmModal
          log={deletingLog}
          onConfirm={handleConfirmDeleteLog}
          onCancel={handleCancelDeleteLog}
        />
      )}
    </div>
  );
}
