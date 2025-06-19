import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { FoodLog } from '@/types';
interface DeleteConfirmModalProps {
  log: FoodLog;
  onConfirm: (logId: number) => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ log, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm(log.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
            <h3 className="text-lg font-semibold text-gray-900">
                Delete Food Log
              </h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">{log.food?.name}</h4>
              {log.food?.brandName && (
                <p className="text-sm text-gray-600">{log.food.brandName}</p>
              )}
              <p className="text-xs text-gray-500">
                {log.servingsConsumed} serving
                {log.servingsConsumed !== 1 ? "s" : ""} •{" "}
                {new Date(log.consumedDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-600">
          {Math.round((log.food?.calories || 0) * log.servingsConsumed)}{" "}cal
              </p>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this food log? This will permanently
          remove it from your records.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
