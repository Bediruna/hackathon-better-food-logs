"use client"

import FoodLogEntry from "@/components/FoodLogEntry";
import SearchBar from "@/components/SearchBar";
import TodaysSummary from "@/components/TodaysSummary";
import EditFoodLogModal from "@/components/EditFoodLogModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { Food, FoodLog } from "@/types";
import { localStorageUtils } from "@/utils/localStorage";
import { sampleFoods } from "@/utils/sampleData";
import { supabaseUtils } from "@/utils/supabaseUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<FoodLog | null>(null);
  useEffect(() => {
    const loadData = async () => {
      // Add a version to your sampleFoods
      const SAMPLE_FOODS_VERSION = "v1"; // Increment this when you update sampleFoods

      const storedVersion = localStorage.getItem("sampleFoodsVersion");
      let storedFoods = localStorageUtils.getFoods();

      if (storedFoods.length === 0 || storedVersion !== SAMPLE_FOODS_VERSION) {
        localStorageUtils.saveFoods(sampleFoods);
        localStorage.setItem("sampleFoodsVersion", SAMPLE_FOODS_VERSION);
        storedFoods = sampleFoods;
      }
      setFoods(storedFoods);      // Load food logs based on authentication status
      if (user) {
        // User is signed in, load from Supabase
        const supabaseLogs = await supabaseUtils.getFoodLogs();
        setFoodLogs(supabaseLogs);
      } else {
        // User is not signed in, load from localStorage
        const logs = localStorageUtils.getFoodLogs();
        const logsWithFoodData = logs.map(log => ({
          ...log,
          food: storedFoods.find(food => food.id === log.food_id)
        }));
        setFoodLogs(logsWithFoodData);
      }
    };

    loadData();
  }, [user]);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
  };  const handleLogFood = async (food: Food, servings: number) => {
    const newLog = {
      user_id: user?.id ? parseInt(user.id.slice(-8), 16) : 1, // Convert Supabase user ID to number for app compatibility
      food_id: food.id,
      servings_consumed: servings,
      consumed_date: Date.now(),
    };
      if (user) {
      // User is signed in, save to Supabase
      try {
        const savedLog = await supabaseUtils.addFoodLog(newLog);
        if (savedLog) {
          // Update state with the saved log including the food data
          const logWithFood = { ...savedLog, food };
          setFoodLogs(prev => [logWithFood, ...prev]);
          console.log("Food log successfully saved to cloud");
        } else {
          throw new Error("Failed to save to Supabase");
        }      } catch (error) {
        console.error("Error saving to Supabase:", {
          error,
          newLog,
          food,
          errorMessage: error instanceof Error ? error.message : String(error)
        });// Fallback to localStorage on error
        const savedLog = localStorageUtils.addFoodLog(newLog);
        const logWithFood = { ...savedLog, food };
        setFoodLogs(prev => [logWithFood, ...prev]);
        console.log("Food log saved locally as fallback");
      }
    } else {      // User is not signed in, save to localStorage
      const savedLog = localStorageUtils.addFoodLog(newLog);
      const logWithFood = { ...savedLog, food };
      setFoodLogs(prev => [logWithFood, ...prev]);
      console.log("Food log saved locally (user not signed in)");
    }
    
    setSelectedFood(null);
  };
  const handleCancelFoodEntry = () => {
    setSelectedFood(null);
  };
  const handleEditLog = (log: FoodLog) => {
    console.log('Opening edit modal for log:', log);
    setEditingLog(log);
  };
  const handleSaveEditLog = async (logId: number, newServings: number) => {
    console.log('Attempting to save edit for log ID:', logId, 'new servings:', newServings);
    
    if (user) {
      // User is signed in, update in Supabase
      try {
        const updatedLog = await supabaseUtils.updateFoodLog(logId, newServings);
        if (updatedLog) {
          setFoodLogs(prev => prev.map(log => 
            log.id === logId 
              ? { ...log, servings_consumed: newServings }
              : log
          ));
          console.log("Food log successfully updated in cloud");
        } else {
          throw new Error("Failed to update in Supabase");
        }
      } catch (error) {
        console.error("Error updating in Supabase:", error);
        // Fallback to localStorage
        const success = localStorageUtils.updateFoodLog(logId, newServings);
        if (success) {
          setFoodLogs(prev => prev.map(log => 
            log.id === logId 
              ? { ...log, servings_consumed: newServings }
              : log
          ));
          console.log("Food log updated locally as fallback");
        } else {
          console.error("Failed to update food log locally");
        }
      }
    } else {
      // User is not signed in, update in localStorage
      console.log('Updating in localStorage for log ID:', logId);
      const success = localStorageUtils.updateFoodLog(logId, newServings);
      if (success) {
        setFoodLogs(prev => prev.map(log => 
          log.id === logId 
            ? { ...log, servings_consumed: newServings }
            : log
        ));
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

  const handleConfirmDeleteLog = async (logId: number) => {
    if (user) {
      // User is signed in, delete from Supabase
      try {
        const success = await supabaseUtils.deleteFoodLog(logId);
        if (success) {
          setFoodLogs(prev => prev.filter(log => log.id !== logId));
          console.log("Food log successfully deleted from cloud");
        } else {
          throw new Error("Failed to delete from Supabase");
        }
      } catch (error) {
        console.error("Error deleting from Supabase:", error);
        // Fallback to localStorage
        const success = localStorageUtils.deleteFoodLog(logId);
        if (success) {
          setFoodLogs(prev => prev.filter(log => log.id !== logId));
          console.log("Food log deleted locally as fallback");
        }
      }
    } else {
      // User is not signed in, delete from localStorage
      const success = localStorageUtils.deleteFoodLog(logId);
      if (success) {
        setFoodLogs(prev => prev.filter(log => log.id !== logId));
        console.log("Food log deleted locally");
      }
    }
    
    setDeletingLog(null);
  };

  const handleCancelDeleteLog = () => {
    setDeletingLog(null);
  };

  // Get today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysLogs = foodLogs.filter(log => {
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
          Log your meals instantly with our smart search. No friction, just results.
        </p>
      </div>

      {/* Authentication Status */}
      {user && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Signed in as {user.user_metadata?.full_name || user.email} - Food logs are being saved to the cloud
          </p>
        </div>
      )}
      
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
      </div>      {/* Food Entry Modal */}
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
      )}{/* Today's Summary */}
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
    </div>
  );
}
