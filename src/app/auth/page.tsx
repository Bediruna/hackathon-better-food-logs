"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {  const router = useRouter();
  const { user, signIn, signUp, signInWithGoogle } = useAuth(); // Keep signInWithGoogle to maintain interface compatibility
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (isSignUp && !formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (isSignUp) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, formData.name);
      } else {
        await signIn(formData.email, formData.password);
      }
      router.push("/");
    } catch (error: unknown) {
      console.error("Authentication error:", error);
      // Handle Firebase auth errors
      let errorMessage = "An error occurred. Please try again.";
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
      ) {
        const code = (error as { code: string }).code;
        if (code === "auth/user-not-found" || code === "auth/wrong-password") {
          errorMessage = "Invalid email or password.";
        } else if (code === "auth/email-already-in-use") {
          errorMessage = "An account with this email already exists.";
        } else if (code === "auth/weak-password") {
          errorMessage = "Password should be at least 6 characters.";
        } else if (code === "auth/invalid-email") {
          errorMessage = "Please enter a valid email address.";
        }
      }
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }  };

  // Commented out Google sign-in handler since Google auth is disabled for now
  /*
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      await signInWithGoogle();
      router.push("/");
    } catch (error: unknown) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
      ) {
        const code = (error as { code: string }).code;
        if (code === "auth/popup-closed-by-user") {
          errorMessage = "Sign-in was cancelled.";
        } else if (code === "auth/popup-blocked") {
          errorMessage =
            "Pop-up was blocked. Please allow pop-ups and try again.";
        }
      }
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  */

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    setErrors({});
  };

  // Don't render if user is authenticated
  if (user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Auth Card */}
        <div className="p-8 border border-gray-200 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl">
                <Zap className="text-white" size={24} />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-gray-600">
              {isSignUp
                ? "Start your nutrition journey today"
                : "Sign in to continue tracking your nutrition"}
            </p>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="p-3 mb-6 border border-red-200 rounded-lg bg-red-50">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                      errors.name
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                  size={18}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                    errors.email
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                    errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                    size={18}
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                      errors.confirmPassword
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Forgot Password Link (Sign In Only) */}
            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm transition-colors text-emerald-600 hover:text-emerald-700"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:shadow-lg hover:scale-[1.02]"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-400 rounded-full border-t-transparent animate-spin"></div>
                  <span>
                    {isSignUp ? "Creating Account..." : "Signing In..."}
                  </span>
                </div>
              ) : isSignUp ? (
                "Create Account"              ) : (
                "Sign In"
              )}
            </button>          </form>

          {/* Google Auth section temporarily disabled */}
          {/*
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={`w-full py-3 px-4 border border-gray-300 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              isLoading ? "bg-gray-50 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 rounded-full border-t-transparent animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
          */}

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="font-semibold transition-colors text-emerald-600 hover:text-emerald-700"
                disabled={isLoading}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>

        {/* Terms and Privacy (Sign Up Only) */}
        {isSignUp && (
          <div className="mt-6 text-xs text-center text-gray-500">
            By creating an account, you agree to our{" "}
            <Link href="#" className="text-emerald-600 hover:text-emerald-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-emerald-600 hover:text-emerald-700">
              Privacy Policy
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
