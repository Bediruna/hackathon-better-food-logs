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
    setServings(Math.max(0.25, servings + delta));
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
          {food.brandName && (
            <p className="text-gray-600">{food.brandName}</p>
          )}
          <p className="text-sm text-gray-500">{food.servingDescription}</p>
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
            <span className="ml-2 font-semibold">{food.proteinG}g</span>
          </div>
          <div>
            <span className="text-gray-600">Fat:</span>
            <span className="ml-2 font-semibold">{food.fatG}g</span>
          </div>
          <div>
            <span className="text-gray-600">Carbs:</span>
            <span className="ml-2 font-semibold">{food.carbsG}g</span>
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
          <span className="min-w-[3rem] text-center font-semibold">{servings}</span>
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