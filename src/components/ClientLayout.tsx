"use client";

import Link from "next/link";
import Image from "next/image";
import { BarChart3, Home, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { user, logout, loading } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
  ];

  const location = usePathname();
  const isAuthPage = location === '/auth';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header - Hide on auth page */}
      {!isAuthPage && (
        <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BFL</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Better Food Logs
                </h1>
              </Link>

              {!loading && (
                <>
                  {user ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700 hidden sm:block">
                          {user.displayName || user.email}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <LogOut size={16} />
                        <span className="text-sm hidden sm:block">Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/auth"
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <User size={16} />
                      <span className="text-sm">Sign In / Up</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={isAuthPage ? "" : "max-w-4xl mx-auto px-4 py-6"}>
        {children}
        {!isAuthPage && (
          <Link
            href="https://bolt.new/"
            className="flex items-center pt-2 gap-1 justify-end w-full italic hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            <span>Made with ❤️ and</span>

            <Image
              src="/white_circle_360x360.png"
              alt="Made with Bolt"
              width={32}
              height={32}
              className="inline size-8"
            />
          </Link>
        )}
      </main>

      {/* Bottom Navigation - Hide on auth page */}
      {!isAuthPage && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-emerald-100">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex justify-around py-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  href={path}
                  className={`flex flex-col items-center py-2 px-4 transition-all duration-200 ${
                    location === path
                      ? "text-emerald-600"
                      : "text-gray-500 hover:text-emerald-500"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Bottom padding to account for fixed navigation - Hide on auth page */}
      {!isAuthPage && <div className="h-16"></div>}
    </div>
  );
}