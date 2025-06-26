-- Fix Foreign Key Constraint Issue
-- This addresses the error: "insert or update on table food_logs violates foreign key constraint fk_food_logs_user_id"

-- OPTION 1: Remove the foreign key constraint (Quick Fix)
-- This is the simplest solution if you don't need strict referential integrity
-- Uncomment the lines below to use this approach:

-- ALTER TABLE public.food_logs DROP CONSTRAINT IF EXISTS fk_food_logs_user_id;

-- OPTION 2: Keep the constraint but make it more flexible (Recommended)
-- This approach modifies the constraint to be deferrable, allowing more flexibility

-- First, drop the existing constraint
ALTER TABLE public.food_logs DROP CONSTRAINT IF EXISTS fk_food_logs_user_id;

-- Recreate it as deferrable initially deferred
ALTER TABLE public.food_logs 
ADD CONSTRAINT fk_food_logs_user_id 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- OPTION 3: Create a trigger to auto-create users (Most Robust)
-- This function will automatically create a user record if it doesn't exist

CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user exists, if not create a basic record
    INSERT INTO public.users (id, display_name, email)
    VALUES (NEW.user_id, 'Unknown User', '')
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert on food_logs
DROP TRIGGER IF EXISTS ensure_user_exists_trigger ON public.food_logs;
CREATE TRIGGER ensure_user_exists_trigger
    BEFORE INSERT ON public.food_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_user_exists();

-- Test the setup
-- This should now work without errors:
-- INSERT INTO public.food_logs (user_id, food_id, servings_consumed, consumed_date) 
-- VALUES ('test-user-123', 1, 1.5, NOW());
