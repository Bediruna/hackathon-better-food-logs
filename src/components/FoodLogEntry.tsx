import React, { useState } from 'react';
import { Minus, Plus, Check, X } from 'lucide-react';
import { Food } from '../types';

interface FoodLogEntryProps {
  food: Food;
  onLog: (food: Food, servings: number) => void;
  onCancel: () => void;
}

export default function FoodLogEntry({ food, onLog, onCancel }: FoodLogEntryProps) {
  const [servings, setServings] = useState(1);

  const adjustServings = (delta: number) => {
    setServings(prev => {
      const next = Math.max(0.25, Math.round((prev + delta) * 100) / 100);
      return next;
    });
  };

  const handleServingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setServings(Math.round(num * 100) / 100);
    } else if (value === "") {
      setServings(0);
    }
  };

  const handleLog = () => {
    onLog(food, servings);
  };

  const totalCalories = Math.round(food.calories * servings);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{food.name}</h3>
          {food.brand_name && (
            <p className="text-gray-600">{food.brand_name}</p>
          )}
          <p className="text-sm text-gray-500">{food.serving_description}</p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Calories:</span>
            <span className="ml-2 font-semibold">{food.calories}</span>
          </div>
          <div>
            <span className="text-gray-600">Protein:</span>
            <span className="ml-2 font-semibold">{food.protein_g}g</span>
          </div>
          <div>
            <span className="text-gray-600">Fat:</span>
            <span className="ml-2 font-semibold">{food.fat_g}g</span>
          </div>
          <div>
            <span className="text-gray-600">Carbs:</span>
            <span className="ml-2 font-semibold">{food.carbs_g}g</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <span className="text-gray-700 font-medium">Servings:</span>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => adjustServings(-0.25)}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            min="0.25"
            step="0.01"
            value={servings}
            onChange={handleServingsChange}
            className="w-16 text-center font-semibold border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            onClick={() => adjustServings(0.25)}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-emerald-600">{totalCalories} calories</p>
        <p className="text-gray-500">Total for {servings} serving{servings !== 1 ? 's' : ''}</p>
      </div>

      <button
        onClick={handleLog}
        className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <Check size={20} />
        <span>Log Food</span>
      </button>
    </div>
  );
}
