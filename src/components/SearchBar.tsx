import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Food } from '../types';

interface SearchBarProps {
  foods: Food[];
  onSelectFood: (food: Food) => void;
  placeholder?: string;
}

export default function SearchBar({ foods, onSelectFood, placeholder = "Search foods..." }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim()) {
      const filtered = foods.filter(food =>
        food.name.toLowerCase().includes(query.toLowerCase()) ||
        (food.brand_name && food.brand_name.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredFoods(filtered);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query, foods]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFood = (food: Food) => {
    onSelectFood(food);
    setQuery('');
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && filteredFoods.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
          {filteredFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => handleSelectFood(food)}
              className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{food.name}</p>
                  {food.brand_name && (
                    <p className="text-sm text-gray-500">{food.brand_name}</p>
                  )}
                  <p className="text-xs text-gray-400">{food.serving_description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{food.calories} cal</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && filteredFoods.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 text-center text-gray-500">
          No foods found. Try a different search term.
        </div>
      )}
    </div>
  );
}
