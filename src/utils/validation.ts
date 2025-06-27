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

// Basic profanity filter - focused on truly inappropriate content
const PROFANITY_WORDS = [
  'shit', 'fuck', 'bitch', 'bastard', 'cunt',
  // Removed milder words like 'damn', 'hell', 'crap', 'ass' as they might appear in legitimate food contexts
  // Add more words as needed, but keep it focused on truly inappropriate content
];

// Common spam patterns - made less stringent to avoid false positives on food names
const SPAM_PATTERNS = [
  /(.)\1{7,}/i, // Repeated characters (8+ times) - allows for foods like "cheese" or "coffee"
  /^[A-Z\s!]{20,}$/i, // All caps with exclamation (20+ chars) - more lenient for food names
  /\b(buy now|sale|discount|click here|visit|www\.|http:\/\/|https:\/\/)/i, // More specific promotional terms
  /!!!{3,}/, // Multiple exclamation marks (4+ in a row)
  /\$\$\$+/, // Multiple dollar signs
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
  // Count how many spam patterns match
  const matchCount = SPAM_PATTERNS.filter(pattern => pattern.test(text)).length;
  
  // More lenient: require multiple indicators or very obvious spam
  if (matchCount >= 2) return true; // Multiple spam indicators
  
  // Check for very obvious spam patterns
  if (/\b(buy now|click here)\b/i.test(text)) return true;
  if (/^[A-Z\s!]{30,}$/.test(text)) return true; // Very long all-caps text
  if (/(.)\1{10,}/.test(text)) return true; // Excessive character repetition
  
  return false;
};

export const checkForDuplicateFood = (
  newFood: FoodValidationData,
  existingFoods: Array<{ name: string; brand_name?: string; serving_description: string; serving_mass_g?: number }>
): boolean => {
  // Safety check for newFood properties
  if (!newFood.name || !newFood.serving_description) {
    console.warn('Cannot check for duplicate - newFood missing required properties:', newFood);
    return false;
  }

  const normalizedName = newFood.name.trim().toLowerCase();
  const normalizedBrand = newFood.brand_name?.trim().toLowerCase() || '';
  const normalizedServing = newFood.serving_description.trim().toLowerCase();

  return existingFoods.some(food => {
    // Safety check for existing food properties
    if (!food.name || !food.serving_description) {
      console.warn('Skipping existing food with missing required properties:', food);
      return false;
    }

    const existingName = food.name.trim().toLowerCase();
    const existingBrand = food.brand_name?.trim().toLowerCase() || '';
    const existingServing = food.serving_description.trim().toLowerCase();

    // Consider it a duplicate if name and brand match, or if name and serving description are very similar
    return (
      (normalizedName === existingName && normalizedBrand === existingBrand) ||
      (normalizedName === existingName && 
       normalizedServing === existingServing &&
       Math.abs((newFood.serving_mass_g || 0) - (existingFoods.find(f => 
         f.name && f.name.trim().toLowerCase() === existingName
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