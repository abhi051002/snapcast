"use client";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const page = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      return await authClient.signIn.social({ provider: "google" });
    } catch (error) {
      console.error("Sign in failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            className={isLoading ? "opacity-70" : ""}
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
  );
};

export default page;
