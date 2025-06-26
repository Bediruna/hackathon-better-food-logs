// Input validation utilities for food entries
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FoodValidationData {
  name: string;
  brand_name?: string;
  serving_description: string;
  serving_mass_g?: number;
  serving_volume_ml?: number;
  calories: number;
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  cholesterol_mg?: number;
}

// Basic profanity filter - can be expanded
const PROFANITY_WORDS = [
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'bastard',
  // Add more words as needed
];

// Common spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/i, // Repeated characters (5+ times)
  /^[A-Z\s!]{10,}$/i, // All caps with exclamation
  /\b(buy|sale|discount|free|click|visit|www\.|http)/i, // Promotional terms
];

export const validateFoodEntry = (data: FoodValidationData): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Food name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Food name must be at least 2 characters long');
  } else if (data.name.trim().length > 100) {
    errors.push('Food name must be less than 100 characters');
  } else if (!/^[a-zA-Z0-9\s\-\(\)\&\.\,\'\"]+$/.test(data.name.trim())) {
    errors.push('Food name contains invalid characters');
  }

  // Brand name validation (optional)
  if (data.brand_name && data.brand_name.trim().length > 0) {
    if (data.brand_name.trim().length > 50) {
      errors.push('Brand name must be less than 50 characters');
    } else if (!/^[a-zA-Z0-9\s\-\(\)\&\.\,\'\"]+$/.test(data.brand_name.trim())) {
      errors.push('Brand name contains invalid characters');
    }
  }

  // Serving description validation
  if (!data.serving_description || data.serving_description.trim().length === 0) {
    errors.push('Serving description is required');
  } else if (data.serving_description.trim().length < 3) {
    errors.push('Serving description must be at least 3 characters long');
  } else if (data.serving_description.trim().length > 100) {
    errors.push('Serving description must be less than 100 characters');
  } else if (!/^[a-zA-Z0-9\s\-\(\)\&\.\,\'\"\/]+$/.test(data.serving_description.trim())) {
    errors.push('Serving description contains invalid characters');
  }

  // Serving size validation (at least one must be provided)
  if (!data.serving_mass_g && !data.serving_volume_ml) {
    errors.push('Either serving mass (grams) or volume (ml) must be provided');
  }

  if (data.serving_mass_g !== undefined && data.serving_mass_g !== null) {
    if (data.serving_mass_g < 0.1) {
      errors.push('Serving mass must be at least 0.1 grams');
    } else if (data.serving_mass_g > 10000) {
      errors.push('Serving mass must be less than 10,000 grams');
    }
  }

  if (data.serving_volume_ml !== undefined && data.serving_volume_ml !== null) {
    if (data.serving_volume_ml < 0.1) {
      errors.push('Serving volume must be at least 0.1 ml');
    } else if (data.serving_volume_ml > 10000) {
      errors.push('Serving volume must be less than 10,000 ml');
    }
  }

  // Calories validation
  if (data.calories === undefined || data.calories === null) {
    errors.push('Calories are required');
  } else if (data.calories < 0) {
    errors.push('Calories cannot be negative');
  } else if (data.calories > 10000) {
    errors.push('Calories must be less than 10,000 per serving');
  }

  // Nutrition validation (all optional but must be non-negative if provided)
  const nutritionFields = [
    { field: 'protein_g', name: 'Protein', max: 1000 },
    { field: 'fat_g', name: 'Fat', max: 1000 },
    { field: 'carbs_g', name: 'Carbohydrates', max: 1000 },
    { field: 'sugar_g', name: 'Sugar', max: 1000 },
    { field: 'sodium_mg', name: 'Sodium', max: 100000 },
    { field: 'cholesterol_mg', name: 'Cholesterol', max: 10000 },
  ];

  nutritionFields.forEach(({ field, name, max }) => {
    const value = data[field as keyof FoodValidationData] as number;
    if (value !== undefined && value !== null) {
      if (value < 0) {
        errors.push(`${name} cannot be negative`);
      } else if (value > max) {
        errors.push(`${name} value is unreasonably high`);
      }
    }
  });

  // Profanity check
  const textToCheck = [data.name, data.brand_name, data.serving_description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (containsProfanity(textToCheck)) {
    errors.push('Content contains inappropriate language');
  }

  // Spam check
  if (isSpammy(textToCheck)) {
    errors.push('Content appears to be spam or promotional');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const containsProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return PROFANITY_WORDS.some(word => lowerText.includes(word));
};

export const isSpammy = (text: string): boolean => {
  return SPAM_PATTERNS.some(pattern => pattern.test(text));
};

export const checkForDuplicateFood = (
  newFood: FoodValidationData,
  existingFoods: Array<{ name: string; brand_name?: string; serving_description: string; serving_mass_g?: number }>
): boolean => {
  const normalizedName = newFood.name.trim().toLowerCase();
  const normalizedBrand = newFood.brand_name?.trim().toLowerCase() || '';
  const normalizedServing = newFood.serving_description.trim().toLowerCase();

  return existingFoods.some(food => {
    const existingName = food.name.trim().toLowerCase();
    const existingBrand = food.brand_name?.trim().toLowerCase() || '';
    const existingServing = food.serving_description.trim().toLowerCase();

    // Consider it a duplicate if name and brand match, or if name and serving description are very similar
    return (
      (normalizedName === existingName && normalizedBrand === existingBrand) ||
      (normalizedName === existingName && 
       normalizedServing === existingServing &&
       Math.abs((newFood.serving_mass_g || 0) - (existingFoods.find(f => 
         f.name.trim().toLowerCase() === existingName
       )?.serving_mass_g || 0)) < 5)
    );
  });
};

// Sanitize input by trimming and removing extra spaces
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

// Format nutrition values to reasonable precision
export const formatNutritionValue = (value: number | string): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100; // Round to 2 decimal places
};