"use client";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Toast, { ToastType } from "@/components/Toast"; // Adjust import path as needed

const page = () => {
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      hideToast(); // Clear previous toasts

      const result = await authClient.signIn.social({ provider: "google" });
      if (result?.error) {
        showToast(result.error.message || "Sign-in failed. Please try again.");
        return;
      }
      return result;
    } catch (error: any) {
      console.error("Sign in failed:", error);

      if (error?.response?.status === 429) {
        showToast(
          "Too many sign-in attempts. Please wait a moment before trying again.",
          "warning"
        );
      } else if (error?.response?.status === 400) {
        showToast("Invalid email address. Please use a valid email.", "error");
      } else if (error?.response?.status === 403) {
        showToast(
          "Sign-in blocked for security reasons. Please try again later.",
          "error"
        );
      } else if (
        error?.message?.includes("rate limit") ||
        error?.message?.includes("Rate limit")
      ) {
        showToast(
          "Too many attempts. Please wait a moment before trying again.",
          "warning"
        );
      } else if (
        error?.message?.includes("network") ||
        error?.message?.includes("Network")
      ) {
        showToast(
          "Network error. Please check your connection and try again.",
          "error"
        );
      } else if (
        error?.message?.includes("popup") ||
        error?.message?.includes("window")
      ) {
        showToast(
          "Sign-in popup was blocked or closed. Please try again and allow popups.",
          "info"
        );
      } else {
        showToast("Sign-in failed. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="sign-in">
        <aside className="testimonial">
          <Link href={"/"}>
            <Image
              src={"/assets/icons/logo.svg"}
              alt="logo"
              width={32}
              height={32}
            />
            <h1>SnapCast</h1>
          </Link>
          <div className="description">
            <section>
              <figure>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Image
                    key={index}
                    src={"/assets/icons/star.svg"}
                    alt="star"
                    width={20}
                    height={20}
                  />
                ))}
              </figure>
              <p>
                {`SnapCast makes screen recording easy. From quick walkthrough to
                full presentations, it's fast, smooth, and shareable in seconds`}
              </p>
              <article>
                <Image
                  src={"/assets/images/jason.png"}
                  alt="jason"
                  width={64}
                  height={64}
                  className="rounded-full"
                />
                <div>
                  <h2>Jason Rivera</h2>
                  <p>Product Designer, NovaBytes</p>
                </div>
              </article>
            </section>
          </div>
          <div className="flex justify-center items-center border-t border-t-gray-200 pt-4 text-foreground">
            <p>&copy; SnapCast {new Date().getFullYear()}</p>
          </div>
        </aside>

        <aside className="google-sign-in">
          <section>
            <Link href={"/"}>
              <Image
                src={"/assets/icons/logo.svg"}
                alt="logo"
                width={40}
                height={40}
              />
              <h1>SnapCast</h1>
            </Link>
            <p>
              Create & share your very first <span>SnapCast Video</span> in no
              time!
            </p>

            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className={`w-full ${
                isLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
              } transition-opacity`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-pink-100"
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
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <Image
                    src={"/assets/icons/google.svg"}
                    alt="google"
                    width={22}
                    height={22}
                  />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </section>
        </aside>
        <div className="overlay" />
      </main>

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

export default page;
