-- Drop and Recreate Tables Script
-- WARNING: This will delete ALL existing data!
-- Make sure to backup your data first if needed.

-- Step 1: Drop existing tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.food_logs CASCADE;
DROP TABLE IF EXISTS public.foods CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Drop any remaining triggers and functions
DROP TRIGGER IF EXISTS handle_foods_updated_at ON public.foods;
DROP TRIGGER IF EXISTS handle_food_logs_updated_at ON public.food_logs;
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Step 3: Recreate tables with new UUID structure

-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Firebase UID as string
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the foods table with TEXT UUID
CREATE TABLE IF NOT EXISTS public.foods (
    id TEXT PRIMARY KEY, -- UUID as TEXT
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the food_logs table with TEXT UUID
CREATE TABLE IF NOT EXISTS public.food_logs (
    id TEXT PRIMARY KEY, -- UUID as TEXT
    user_id TEXT NOT NULL, -- Firebase UID as string
    food_id TEXT NOT NULL, -- UUID as TEXT
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

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_logs_user_id ON public.food_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_consumed_date ON public.food_logs(consumed_date);
CREATE INDEX IF NOT EXISTS idx_food_logs_food_id ON public.food_logs(food_id);
CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for foods table
-- Allow all users to read foods (foods are shared across users)
CREATE POLICY "Allow read access to all foods" ON public.foods
    FOR SELECT USING (true);

-- Allow authenticated users to insert foods
CREATE POLICY "Allow authenticated users to insert foods" ON public.foods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update foods they created (optional - you might want to restrict this)
CREATE POLICY "Allow users to update foods" ON public.foods
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Step 7: RLS Policies for users table
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

-- Allow authenticated users to insert their own user record
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- Step 8: RLS Policies for food_logs table
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

-- Step 9: Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create triggers for updated_at
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

-- Done! Tables are now recreated with UUID structure
SELECT 'Tables successfully recreated with UUID structure!' as status;
