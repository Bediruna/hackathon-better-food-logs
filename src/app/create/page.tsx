"use client";

import React, { useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import { Food } from "@/types";
import { localStorageUtils } from "@/utils/localStorage";
import { useRouter } from "next/navigation";
import { supabaseUtils } from "@/utils/supabaseUtils";
import { supabase } from "@/lib/supabaseClient";

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "serving_mass_g" && value) {
        updated.serving_volume_ml = "";
      } else if (field === "serving_volume_ml" && value) {
        updated.serving_mass_g = "";
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newFood = {
      id: crypto.randomUUID(), // Generate a unique ID
      name: formData.name,
      brand_name: formData.brand_name || undefined,
      serving_description: formData.serving_description,
      // Only one of these should be set, the other should be null
      serving_mass_g: formData.serving_mass_g
        ? parseFloat(formData.serving_mass_g)
        : null,
      serving_volume_ml: formData.serving_volume_ml
        ? parseFloat(formData.serving_volume_ml)
        : null,
      calories: parseFloat(formData.calories) || 0,
      protein_g: parseFloat(formData.protein_g) || 0,
      fat_g: parseFloat(formData.fat_g) || 0,
      carbs_g: parseFloat(formData.carbs_g) || 0,
      sugar_g: parseFloat(formData.sugar_g) || 0,
      sodium_mg: parseFloat(formData.sodium_mg) || 0,
      cholesterol_mg: parseFloat(formData.cholesterol_mg) || 0,
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!newFood.name.trim() || !newFood.serving_description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    if (user) {
      // User is logged in → save to Supabase
      console.log("Saving to Supabase:", newFood);
      const { /* id, */ ...foodWithoutId } = newFood;
      const added = await supabaseUtils.addFood(foodWithoutId);      if (!added) {
        console.error("Failed to save to Supabase:", {
          foodData: foodWithoutId,
          user: user?.id,
          timestamp: new Date().toISOString()
        });
        alert("Error saving to cloud, please try again");
        return;
      }
    } else {
      // User is not logged in → save to localStorage
      localStorageUtils.addFood(newFood as Food);
    }

    router.push("/");
  };

  const isValid =
    !!formData.name.trim() &&
    !!formData.serving_description.trim() &&
    !isNaN(parseFloat(formData.calories));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push("/")}
          className="p-2 text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Food Record
        </h1>
      </div>

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
                required
              />
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
              />
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
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Mass (grams)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.serving_mass_g}
                  onChange={(e) =>
                    handleInputChange("serving_mass_g", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="227"
                  disabled={!!formData.serving_volume_ml}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Volume (ml)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.serving_volume_ml}
                  onChange={(e) =>
                    handleInputChange("serving_volume_ml", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="240"
                  disabled={!!formData.serving_mass_g}
                />
              </div>
            </div>
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
                value={formData.calories}
                onChange={(e) => handleInputChange("calories", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="130"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Protein (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.protein_g}
                onChange={(e) => handleInputChange("protein_g", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="23"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Fat (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.fat_g}
                onChange={(e) => handleInputChange("fat_g", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Carbohydrates (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.carbs_g}
                onChange={(e) => handleInputChange("carbs_g", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="9"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Sugar (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.sugar_g}
                onChange={(e) => handleInputChange("sugar_g", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="6"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Sodium (mg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.sodium_mg}
                onChange={(e) => handleInputChange("sodium_mg", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="65"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Cholesterol (mg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.cholesterol_mg}
                onChange={(e) =>
                  handleInputChange("cholesterol_mg", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 ${
            isValid
              ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Save size={20} />
          <span>Save Food Record</span>
        </button>
      </form>
    </div>
  );
}
