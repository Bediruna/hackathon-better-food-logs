import React from 'react';
import { FoodLog } from '../types';
import { calculateNutritionSummary } from '../utils/nutrition';
import { format } from 'date-fns';

interface TodaysSummaryProps {
  todaysLogs: FoodLog[];
}

export default function TodaysSummary({ todaysLogs }: TodaysSummaryProps) {
  const summary = calculateNutritionSummary(todaysLogs);

  const macros = [
    { label: 'Protein', value: Math.round(summary.totalProteinG), unit: 'g', color: 'text-blue-600' },
    { label: 'Fat', value: Math.round(summary.totalFatG), unit: 'g', color: 'text-orange-600' },
    { label: 'Carbs', value: Math.round(summary.totalCarbsG), unit: 'g', color: 'text-purple-600' },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Summary</h2>
        <span className="text-sm text-gray-500">{format(new Date(), 'MMM d, yyyy')}</span>
      </div>

      <div className="text-center mb-6">
        <p className="text-3xl font-bold text-emerald-600">{Math.round(summary.totalCalories)}</p>
        <p className="text-gray-500">calories consumed</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {macros.map((macro) => (
          <div key={macro.label} className="text-center">
            <p className={`text-xl font-semibold ${macro.color}`}>
              {macro.value}{macro.unit}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{macro.label}</p>
          </div>
        ))}
      </div>

      {todaysLogs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Today&apos;s Meals</h3>
          <div className="space-y-2">
            {todaysLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.food?.name}</p>
                  <p className="text-xs text-gray-500">
                    {log.servingsConsumed} serving{log.servingsConsumed !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-emerald-600">
                  {Math.round((log.food?.calories || 0) * log.servingsConsumed)} cal
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}