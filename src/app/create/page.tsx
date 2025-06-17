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
    brandName: "",
    servingDescription: "",
    servingMassG: "",
    servingVolumeMl: "",
    calories: "",
    proteinG: "",
    fatG: "",
    carbsG: "",
    sugarG: "",
    sodiumMg: "",
    cholesterolMg: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newFood: Food = {
      id: Date.now(),
      name: formData.name,
      brandName: formData.brandName || undefined,
      servingDescription: formData.servingDescription,
      servingMassG: parseFloat(formData.servingMassG) || 0,
      servingVolumeMl: parseFloat(formData.servingVolumeMl) || 0,
      calories: parseFloat(formData.calories) || 0,
      proteinG: parseFloat(formData.proteinG) || 0,
      fatG: parseFloat(formData.fatG) || 0,
      carbsG: parseFloat(formData.carbsG) || 0,
      sugarG: parseFloat(formData.sugarG) || 0,
      sodiumMg: parseFloat(formData.sodiumMg) || 0,
      cholesterolMg: parseFloat(formData.cholesterolMg) || 0,
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // User is logged in → save to Supabase
      const { id, ...foodWithoutId } = newFood;
      const added = await supabaseUtils.addFood(foodWithoutId);
      if (!added) {
        console.error("Failed to save to Supabase:");
        alert("Error saving to cloud, please try again");
        return;
      }
    } else {
      // User is not logged in → save to localStorage
      localStorageUtils.addFood(newFood);
    }

    router.push("/");
  };

  const isValid =
    formData.name && formData.servingDescription && formData.calories;

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
                value={formData.brandName}
                onChange={(e) => handleInputChange("brandName", e.target.value)}
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
                value={formData.servingDescription}
                onChange={(e) =>
                  handleInputChange("servingDescription", e.target.value)
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
                  value={formData.servingMassG}
                  onChange={(e) =>
                    handleInputChange("servingMassG", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="227"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Volume (ml)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.servingVolumeMl}
                  onChange={(e) =>
                    handleInputChange("servingVolumeMl", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="240"
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
                value={formData.proteinG}
                onChange={(e) => handleInputChange("proteinG", e.target.value)}
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
                value={formData.fatG}
                onChange={(e) => handleInputChange("fatG", e.target.value)}
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
                value={formData.carbsG}
                onChange={(e) => handleInputChange("carbsG", e.target.value)}
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
                value={formData.sugarG}
                onChange={(e) => handleInputChange("sugarG", e.target.value)}
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
                value={formData.sodiumMg}
                onChange={(e) => handleInputChange("sodiumMg", e.target.value)}
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
                value={formData.cholesterolMg}
                onChange={(e) =>
                  handleInputChange("cholesterolMg", e.target.value)
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
