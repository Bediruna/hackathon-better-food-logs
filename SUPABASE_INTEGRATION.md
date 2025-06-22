# Supabase Integration for Food Logs

## Overview

The application now supports saving food logs to Supabase when users are signed in with Firebase Authentication. This provides cloud storage and synchronization across devices.

## How it Works

### Authentication Flow
1. Users authenticate using Firebase Auth (Google sign-in, email/password)
2. The app detects authentication state using the `useAuth` context
3. When signed in, all food logs are saved to and loaded from Supabase
4. When not signed in, data is stored locally in localStorage

### Database Schema Mapping

The app maps between its TypeScript interfaces and Supabase column names:

**Foods Table:**
- `name` ↔ `name`
- `brandName` ↔ `brand_name`
- `servingDescription` ↔ `serving_description`
- `servingMassG` ↔ `serving_mass_g`
- `servingVolumeMl` ↔ `serving_volume_ml`
- `calories` ↔ `calories`
- `proteinG` ↔ `protein_g`
- `fatG` ↔ `fat_g`
- `carbsG` ↔ `carbs_g`
- `sugarG` ↔ `sugar_g`
- `sodiumMg` ↔ `sodium_mg`
- `cholesterolMg` ↔ `cholesterol_mg`

**Food Logs Table:**
- `userId` ↔ `user_id` (Firebase UID as string)
- `foodId` ↔ `food_id`
- `servingsConsumed` ↔ `servings_consumed`
- `consumedDate` ↔ `consumed_date` (ISO string in DB, timestamp in app)

### User ID Handling

- Firebase provides string UIDs (e.g., "abc123def456")
- Supabase stores these as strings in the `user_id` column
- The app interface uses numeric user IDs for backward compatibility
- Conversion is handled automatically in the `supabaseUtils`

### Data Flow

1. **Food Logging (Main Page):**
   - User selects a food and enters servings
   - If authenticated: Save to Supabase with user's Firebase UID
   - If not authenticated: Save to localStorage
   - Fallback to localStorage if Supabase fails

2. **Data Loading:**
   - If authenticated: Load user's food logs from Supabase
   - If not authenticated: Load from localStorage
   - Food data is joined automatically via foreign key

3. **Reports Page:**
   - Shows authentication status indicator
   - Loads appropriate data source based on auth state
   - Edit/delete operations use correct storage method

## Implementation Details

### Key Files Modified:

1. **`src/app/page.tsx`**: Main food logging with auth-aware storage
2. **`src/app/reports/page.tsx`**: Reports with auth-aware data loading
3. **`src/utils/supabaseUtils.ts`**: Database operations with column mapping
4. **`src/app/create/page.tsx`**: Food creation with auth-aware storage

### Error Handling

- Graceful fallback to localStorage if Supabase operations fail
- Console logging for debugging
- User-friendly indicators showing data source (cloud vs local)

### Authentication Context

Uses the existing `AuthContext` to:
- Track user authentication state
- Access Firebase user information
- Trigger data reloading when auth state changes

## User Experience

### Visual Indicators
- Green banner when signed in: "Signed in as [user] - Food logs are being saved to the cloud"
- Blue banner when not signed in: "Viewing local data - Sign in to sync across devices"

### Data Synchronization
- No automatic migration from localStorage to Supabase
- Users need to re-log foods after signing in for cloud storage
- Future enhancement could include data migration on first sign-in

## Security

- User data is isolated by Firebase UID in Supabase
- Row Level Security (RLS) should be configured in Supabase
- Only authenticated users can access their own data

## Environment Setup

Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Firebase configuration variables
