"use client";

import React, { useState } from "react";
import { Save, ArrowLeft, AlertTriangle } from "lucide-react";
import { Food } from "@/types";
import { localStorageUtils } from "@/utils/localStorage";
import { useRouter } from "next/navigation";
import { supabaseUtils } from "@/utils/supabaseUtils";
import { supabase } from "@/lib/supabaseClient";
import {
  validateFoodEntry,
  checkForDuplicateFood,
  sanitizeInput,
  formatNutritionValue,
  type FoodValidationData,
} from "@/utils/validation";

export default function CreateFoodPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    brand_name: "",
    serving_description: "",
    serving_mass_g: "",
    serving_volume_ml: "",
    calories: "",
    protein_g: "",
    fat_g: "",
    carbs_g: "",
    sugar_g: "",
    sodium_mg: "",
    cholesterol_mg: "",
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: sanitizeInput(value) };

      if (field === "serving_mass_g" && value) {
        updated.serving_volume_ml = "";
      } else if (field === "serving_volume_ml" && value) {
        updated.serving_mass_g = "";
      }

      return updated;
    });

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    if (isDuplicate) {
      setIsDuplicate(false);
    }
  };

  const checkDuplicate = async (foodData: FoodValidationData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let existingFoods: Array<{
      name: string;
      brand_name?: string;
      serving_description: string;
    }> = [];

    if (user) {
      // Check Supabase foods
      const supabaseFoods = await supabaseUtils.getFoods();
      existingFoods = supabaseFoods;
    } else {
      // Check localStorage foods
      const localFoods = localStorageUtils.getFoods();
      existingFoods = localFoods;
    }

    return checkForDuplicateFood(foodData, existingFoods);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);
    setIsDuplicate(false);

    try {
      // Prepare validation data
      const validationData: FoodValidationData = {
        name: formData.name,
        brand_name: formData.brand_name || undefined,
        serving_description: formData.serving_description,
        serving_mass_g: formData.serving_mass_g
          ? parseFloat(formData.serving_mass_g)
          : undefined,
        serving_volume_ml: formData.serving_volume_ml
          ? parseFloat(formData.serving_volume_ml)
          : undefined,
        calories: parseFloat(formData.calories) || 0,
        protein_g: formData.protein_g
          ? parseFloat(formData.protein_g)
          : undefined,
        fat_g: formData.fat_g ? parseFloat(formData.fat_g) : undefined,
        carbs_g: formData.carbs_g ? parseFloat(formData.carbs_g) : undefined,
        sugar_g: formData.sugar_g ? parseFloat(formData.sugar_g) : undefined,
        sodium_mg: formData.sodium_mg
          ? parseFloat(formData.sodium_mg)
          : undefined,
        cholesterol_mg: formData.cholesterol_mg
          ? parseFloat(formData.cholesterol_mg)
          : undefined,
      };

      // Validate input
      const validation = validateFoodEntry(validationData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Check for duplicates
      const isDuplicateFood = await checkDuplicate(validationData);
      if (isDuplicateFood) {
        setIsDuplicate(true);
        setValidationErrors([
          "This food item already exists with similar details",
        ]);
        return;
      }

      // Prepare the new food object
      const newFood: Omit<Food, "id"> = {
        name: sanitizeInput(formData.name),
        brand_name: formData.brand_name
          ? sanitizeInput(formData.brand_name)
          : undefined,
        serving_description: sanitizeInput(formData.serving_description),
        serving_mass_g: formData.serving_mass_g
          ? formatNutritionValue(formData.serving_mass_g)
          : null,
        serving_volume_ml: formData.serving_volume_ml
          ? formatNutritionValue(formData.serving_volume_ml)
          : null,
        calories: formatNutritionValue(formData.calories),
        protein_g: formatNutritionValue(formData.protein_g || "0"),
        fat_g: formatNutritionValue(formData.fat_g || "0"),
        carbs_g: formatNutritionValue(formData.carbs_g || "0"),
        sugar_g: formatNutritionValue(formData.sugar_g || "0"),
        sodium_mg: formatNutritionValue(formData.sodium_mg || "0"),
        cholesterol_mg: formatNutritionValue(formData.cholesterol_mg || "0"),
      };

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // User is logged in → save to Supabase
        console.log("Saving to Supabase:", newFood);
        const added = await supabaseUtils.addFood(newFood);
        if (!added) {
          console.error("Failed to save to Supabase:", {
            foodData: newFood,
            user: user?.id,
            timestamp: new Date().toISOString(),
          });
          setValidationErrors(["Error saving to cloud, please try again"]);
          return;
        }
      } else {
        // User is not logged in → save to localStorage
        const foodWithId = { ...newFood, id: crypto.randomUUID() } as Food;
        localStorageUtils.addFood(foodWithId);
      }

      router.push("/");
    } catch (error) {
      console.error("Error creating food:", error);
      setValidationErrors(["An unexpected error occurred. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    formData.name.trim() &&
    formData.serving_description.trim() &&
    formData.calories.trim();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push("/")}
          className="p-2 text-gray-600 transition-colors hover:text-gray-900"
          disabled={isSubmitting}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Food Record
        </h1>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-red-800">
                Please fix the following issues:
              </h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning */}
      {isDuplicate && (
        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-yellow-800">
                Possible Duplicate
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                A similar food item already exists. Please check if you meant to
                select an existing item instead.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="p-6 border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-xl">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Food Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Greek Yogurt"
                maxLength={100}
                required
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.name.length}/100 characters
              </p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Brand Name
              </label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) =>
                  handleInputChange("brand_name", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Chobani"
                maxLength={50}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.brand_name.length}/50 characters
              </p>
            </div>
          </div>
        </div>

        {/* Serving Information */}
        <div className="p-6 border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-xl">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Serving Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Serving Description *
              </label>
              <input
                type="text"
                value={formData.serving_description}
                onChange={(e) =>
                  handleInputChange("serving_description", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 1 cup (227g)"
                maxLength={100}
                required
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.serving_description.length}/100 characters
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Mass (grams)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10000"
                  value={formData.serving_mass_g}
                  onChange={(e) =>
                    handleInputChange("serving_mass_g", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="227"
                  disabled={!!formData.serving_volume_ml || isSubmitting}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Volume (ml)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10000"
                  value={formData.serving_volume_ml}
                  onChange={(e) =>
                    handleInputChange("serving_volume_ml", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="240"
                  disabled={!!formData.serving_mass_g || isSubmitting}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              * Provide either mass OR volume, not both
            </p>
          </div>
        </div>

        {/* Nutrition Information */}
        <div className="p-6 border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-xl">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Nutrition Information
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Calories *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10000"
                value={formData.calories}
                onChange={(e) => handleInputChange("calories", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="130"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Protein (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1000"
                value={formData.protein_g}
                onChange={(e) => handleInputChange("protein_g", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="23"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Fat (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1000"
                value={formData.fat_g}
                onChange={(e) => handleInputChange("fat_g", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Carbohydrates (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1000"
                value={formData.carbs_g}
                onChange={(e) => handleInputChange("carbs_g", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="9"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Sugar (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1000"
                value={formData.sugar_g}
                onChange={(e) => handleInputChange("sugar_g", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="6"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Sodium (mg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100000"
                value={formData.sodium_mg}
                onChange={(e) => handleInputChange("sodium_mg", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="65"
                disabled={isSubmitting}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Cholesterol (mg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10000"
                value={formData.cholesterol_mg}
                onChange={(e) =>
                  handleInputChange("cholesterol_mg", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="10"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 ${
            isValid && !isSubmitting
              ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-400 rounded-full border-t-transparent animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Save Food Record</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
