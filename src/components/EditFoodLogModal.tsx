import React, { useState } from 'react';
import { X, Save, Minus, Plus } from 'lucide-react';
import { FoodLog } from '@/types';

interface EditFoodLogModalProps {
  log: FoodLog;
  onSave: (logId: number, newServings: number) => void;
  onCancel: () => void;
}


export default function EditFoodLogModal({ log, onSave, onCancel }: EditFoodLogModalProps) {
  const [servings, setServings] = useState(log.servingsConsumed);

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

  const handleSave = () => {
    if (servings > 0) {
      onSave(log.id, servings);
    }
  };

  const totalCalories = Math.round((log.food?.calories || 0) * servings);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Food Log
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(log.consumedDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-900">{log.food?.name}</h4>
          {log.food?.brandName && (
            <p className="text-gray-600">{log.food.brandName}</p>
          )}
          <p className="text-sm text-gray-500">
            {log.food?.servingDescription}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Calories:</span>
              <span className="ml-2 font-semibold">{log.food?.calories}</span>
            </div>
            <div>
              <span className="text-gray-600">Protein:</span>
              <span className="ml-2 font-semibold">{log.food?.proteinG}g</span>
            </div>
            <div>
              <span className="text-gray-600">Fat:</span>
              <span className="ml-2 font-semibold">{log.food?.fatG}g</span>
            </div>
            <div>
              <span className="text-gray-600">Carbs:</span>
              <span className="ml-2 font-semibold">{log.food?.carbsG}g</span>
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
          <p className="text-2xl font-bold text-emerald-600">
            {totalCalories} calories
          </p>
          <p className="text-gray-500">
            Total for {servings} serving{servings !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={servings <= 0}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 ${
              servings > 0
                ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}