"use client";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Toast, { ToastType } from "@/components/Toast"; // Adjust import path as needed

// Define error types for better type safety
interface AuthError {
  response?: {
    status: number;
  };
  message?: string;
}


const Navbar = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "error") => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const handleAuthError = (error: AuthError, context: string) => {
    console.error(`${context} error:`, error);

    // Handle rate limiting and other errors
    if (error?.response?.status === 429) {
      showToast(
        "Too many requests. Please wait a moment before trying again.",
        "warning"
      );
    } else if (
      error?.message?.includes("rate limit") ||
      error?.message?.includes("Rate limit")
    ) {
      showToast("Please wait a moment before signing out again.", "warning");
    } else if (
      error?.message?.includes("network") ||
      error?.message?.includes("Network")
    ) {
      showToast(
        "Network error. Please check your connection and try again.",
        "error"
      );
    } else {
      showToast("Failed to sign out. Please try again.", "error");
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      hideToast(); // Clear any existing toasts

      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            showToast("Successfully signed out!", "success");
            // Small delay to show success message before redirect
            setTimeout(() => {
              router.push("/sign-in");
            }, 500);
          },
          onError: (error: AuthError) => {
            handleAuthError(error, "Sign out");
          },
        },
      });
    } catch (error) {
      const authError = error as AuthError;

      // Handle different types of errors
      if (authError?.response?.status === 429) {
        showToast(
          "Too many sign-out attempts. Please wait a moment before trying again.",
          "warning"
        );
      } else if (
        authError?.message?.includes("rate limit") ||
        authError?.message?.includes("Rate limit")
      ) {
        showToast("Please wait a moment before trying again.", "warning");
      } else if (
        authError?.message?.includes("network") ||
        authError?.message?.includes("Network")
      ) {
        showToast(
          "Network error. Please check your connection and try again.",
          "error"
        );
      } else {
        showToast("Sign out failed. Please try again.", "error");
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleProfileNavigation = () => {
    try {
      router.push(`/profile/${user?.id}`);
    } catch (error) {
      console.error("Navigation error:", error);
      showToast("Failed to navigate to profile. Please try again.", "error");
    }
  };

  return (
    <>
      <header className="navbar">
        <nav>
          <Link href={"/"}>
            <Image
              src="/assets/icons/logo.svg"
              alt="logo"
              width={32}
              height={32}
            />
            <h1>SnapCast</h1>
          </Link>
          {user && (
            <figure>
              <button
                onClick={handleProfileNavigation}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                aria-label="Go to profile"
              >
                <Image
                  src={user?.image || "/assets/aegims / dummy.jpg"}
                  alt="User profile"
                  width={36}
                  height={36}
                  className="rounded-full aspect-square hover:opacity-80 transition-opacity"
                />
              </button>
              <button
                className={`cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded ${
                  isSigningOut
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-80"
                } transition-opacity`}
                onClick={handleSignOut}
                disabled={isSigningOut}
                aria-label={isSigningOut ? "Signing out..." : "Sign out"}
                title={isSigningOut ? "Signing out..." : "Sign out"}
              >
                {isSigningOut ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg
                      className="animate-spin h-4 w-4 text-gray-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <Image
                    src="/assets/icons/logout.svg"
                    alt="logout"
                    width={24}
                    height={24}
                    className="rotate-180"
                  />
                )}
              </button>
            </figure>
          )}
        </nav>
      </header>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="top-right"
        />
      )}
    </>
  );
};

export default Navbar;
