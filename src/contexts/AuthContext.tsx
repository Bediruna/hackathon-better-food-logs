"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { syncLocalStorageToSupabase } from "@/utils/syncUtils";
import { ensureSampleFoodsConsistency, validateFoodLogConsistency } from "@/utils/dataConsistency";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleUserChange = async () => {
      if (user) {
        console.log("🔄 User authenticated, syncing data...");
        
        // First ensure sample foods are available
        await ensureSampleFoodsConsistency(true);
        
        // Then sync any local data to Supabase
        await syncLocalStorageToSupabase(user.id);
        
        // Finally validate data consistency
        const consistencyResult = await validateFoodLogConsistency(user.id);
        if (!consistencyResult.foodsSync || !consistencyResult.logsSync) {
          console.warn("⚠️ Data consistency issues detected:", consistencyResult.errors);
        } else {
          console.log("✅ Data consistency validated");
        }
      } else {
        // User not authenticated, just ensure sample foods are in localStorage
        await ensureSampleFoodsConsistency(false);
      }
    };

    handleUserChange();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) throw error;

    // Insert into the custom users table if sign up was successful
    if (user) {
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          display_name: name,
          email: user.email,
          photo_url: "https://avatar.iran.liara.run/public/boy?username=Ash",
        },
      ]);

      if (insertError) {
        console.error("Error inserting user into 'users' table:", insertError);
        throw insertError;
      }
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
