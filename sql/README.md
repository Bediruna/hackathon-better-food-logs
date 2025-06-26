# SQL Scripts

This folder contains all the SQL scripts needed to set up and maintain the database for the Better Food Logs application.

## Scripts Overview

### 1. `supabase_setup.sql`
**Purpose**: Initial database setup and schema creation
**When to use**: When setting up the database for the first time
**Contains**:
- Creates `foods`, `users`, and `food_logs` tables
- Sets up indexes for performance
- Configures Row Level Security (RLS) policies
- Inserts sample food data

### 2. `database_migration_fix_ids.sql`
**Purpose**: Fixes auto-increment ID column issues
**When to use**: When you get errors like "null value in column id violates not-null constraint"
**What it does**:
- Resets sequence values for ID columns
- Ensures auto-increment functionality works properly
- Provides verification queries

### 3. `fix_foreign_key_constraint.sql`
**Purpose**: Resolves foreign key constraint errors between food_logs and users tables
**When to use**: When you get errors like "violates foreign key constraint fk_food_logs_user_id"
**Options provided**:
- Option 1: Remove foreign key constraint (quick fix)
- Option 2: Make constraint deferrable (flexible)
- Option 3: Auto-create user records with trigger (recommended)

## Usage Instructions

1. **For new setups**: Run `supabase_setup.sql` first
2. **For ID issues**: Run `database_migration_fix_ids.sql`
3. **For user constraint issues**: Run `fix_foreign_key_constraint.sql`

## Running Scripts

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of the desired script
4. Execute the script

## Important Notes

- Always backup your data before running migration scripts
- Test scripts on a development environment first
- Some scripts provide multiple options - choose the one that best fits your needs
- The scripts are designed to be safe to run multiple times (idempotent)

## Troubleshooting

If you encounter issues:
1. Check the `DATABASE_FIX_GUIDE.md` in the root directory
2. Verify your Supabase environment variables are correct
3. Ensure you have the necessary permissions in Supabase
4. Check the console logs for detailed error messages
