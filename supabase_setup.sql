-- Supabase Database Setup for Food Logs Application
-- Run this SQL in your Supabase SQL Editor

-- Create the foods table
CREATE TABLE IF NOT EXISTS public.foods (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brand_name TEXT,
    serving_description TEXT NOT NULL,
    serving_mass_g NUMERIC,
    serving_volume_ml NUMERIC,
    calories NUMERIC NOT NULL DEFAULT 0,
    protein_g NUMERIC DEFAULT 0,
    fat_g NUMERIC DEFAULT 0,
    carbs_g NUMERIC DEFAULT 0,
    sugar_g NUMERIC DEFAULT 0,
    sodium_mg NUMERIC DEFAULT 0,
    cholesterol_mg NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Firebase UID as string
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    photo_url TEXT,
    created_date BIGINT NOT NULL, -- Unix timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the food_logs table
CREATE TABLE IF NOT EXISTS public.food_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- Firebase UID as string
    food_id BIGINT NOT NULL,
    servings_consumed NUMERIC NOT NULL DEFAULT 1,
    consumed_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      -- Foreign key constraint
    CONSTRAINT fk_food_logs_food_id 
        FOREIGN KEY (food_id) 
        REFERENCES public.foods(id) 
        ON DELETE CASCADE,
        
    -- Foreign key constraint to users table
    CONSTRAINT fk_food_logs_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_logs_user_id ON public.food_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_consumed_date ON public.food_logs(consumed_date);
CREATE INDEX IF NOT EXISTS idx_food_logs_food_id ON public.food_logs(food_id);
CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for foods table
-- Allow all users to read foods (foods are shared across users)
CREATE POLICY "Allow read access to all foods" ON public.foods
    FOR SELECT USING (true);

-- Allow authenticated users to insert foods
CREATE POLICY "Allow authenticated users to insert foods" ON public.foods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update foods they created (optional - you might want to restrict this)
CREATE POLICY "Allow users to update foods" ON public.foods
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for users table
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

-- Allow authenticated users to insert their own user record
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- RLS Policies for food_logs table
-- Users can only see their own food logs
CREATE POLICY "Users can view own food logs" ON public.food_logs
    FOR SELECT USING (auth.uid()::text = user_id);

-- Users can only insert their own food logs
CREATE POLICY "Users can insert own food logs" ON public.food_logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own food logs
CREATE POLICY "Users can update own food logs" ON public.food_logs
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can only delete their own food logs
CREATE POLICY "Users can delete own food logs" ON public.food_logs
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_foods_updated_at
    BEFORE UPDATE ON public.foods
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_food_logs_updated_at
    BEFORE UPDATE ON public.food_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample foods (optional)
INSERT INTO public.foods (name, brand_name, serving_description, serving_mass_g, calories, protein_g, fat_g, carbs_g, sugar_g, sodium_mg, cholesterol_mg) VALUES
('Banana', 'Generic', '1 medium banana', 118, 105, 1.3, 0.4, 27, 14.4, 1, 0),
('Chicken Breast', 'Generic', '100g cooked', 100, 165, 31, 3.6, 0, 0, 74, 85),
('Brown Rice', 'Generic', '1 cup cooked', 195, 216, 5, 1.8, 45, 0.7, 10, 0),
('Greek Yogurt', 'Generic', '1 cup plain', 245, 130, 23, 0, 9, 9, 68, 5),
('Almonds', 'Generic', '1 oz (28g)', 28, 164, 6, 14, 6, 1.2, 0, 0)
ON CONFLICT DO NOTHING;
