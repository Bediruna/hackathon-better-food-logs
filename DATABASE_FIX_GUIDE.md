# Database Errors Fix Guide

## Problem 1: ID Column Auto-Increment Error
```
null value in column "id" of relation "food_logs" violates not-null constraint
```

### Root Cause
The `food_logs` table's `id` column is not properly configured for auto-increment.

### Solution
Run the `sql/database_migration_fix_ids.sql` file in your Supabase SQL Editor.

---

## Problem 2: Foreign Key Constraint Error
```
insert or update on table "food_logs" violates foreign key constraint "fk_food_logs_user_id"
Key is not present in table "users".
```

### Root Cause
The `food_logs` table requires a corresponding record in the `users` table before a food log can be inserted, but user records aren't automatically created when users sign in.

### Solution Options

#### Option A: Quick Fix (Remove Constraint)
Run this in Supabase SQL Editor:
```sql
ALTER TABLE public.food_logs DROP CONSTRAINT IF EXISTS fk_food_logs_user_id;
```

#### Option B: Recommended Fix (Auto-create Users)
Run the `sql/fix_foreign_key_constraint.sql` file in your Supabase SQL Editor. This will:
1. Make the constraint more flexible
2. Create a trigger that automatically creates user records when needed

#### Option C: Application-level Fix
The updated `supabaseUtils.ts` now includes an `ensureUserExists()` method that creates user records as needed.

---

## SQL Scripts Location

All database scripts are now located in the `sql/` folder:
- `sql/supabase_setup.sql` - Initial database setup
- `sql/database_migration_fix_ids.sql` - Fix ID auto-increment issues
- `sql/fix_foreign_key_constraint.sql` - Fix foreign key constraint issues
- `sql/README.md` - Detailed documentation for all scripts

---

## Testing the Fixes

After applying any of these fixes, test by:
1. Signing in to your application
2. Trying to log a food item
3. The error should be resolved

## Prevention
- Use the updated database schema files in the `sql/` folder
- The application now handles user creation automatically
