import aj from "@/lib/arject";
import { auth } from "@/lib/auth";
import { ArcjetDecision, slidingWindow, validateEmail } from "@arcjet/next";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import ip from "@arcjet/ip";

// Email Validation -> BLOCK
const emailValidation = aj.withRule(
  validateEmail({
    mode: "LIVE",
    block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
  })
);

// Rate Limit
const rateLimit = aj.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: "2m",
    max: 2,
    characteristics: ["fingerPrint"],
  })
);

const protectedAuth = async (req: NextRequest): Promise<ArcjetDecision> => {
  const session = await auth.api.getSession({ headers: req.headers });

  let userId: string;

  if (session?.user?.id) {
    userId = session.user.id;
  } else {
    userId = ip(req) || "127.0.0.1";
  }

  if (req.nextUrl.pathname.startsWith("/api/auth/sign-in")) {
    const body = await req.clone().json();

    if (typeof body.email === "string") {
      return emailValidation.protect(req, { email: body.email });
    }
  }
  return rateLimit.protect(req, { fingerPrint: userId });
};

const authHandlers = toNextJsHandler(auth.handler);

export const { GET } = authHandlers;

export const POST = async (req: NextRequest) => {
  try {
    const decision = await protectedAuth(req);

    if (decision.isDenied()) {
      let errorMessage = "Authentication failed";
      let statusCode = 429;

      if (decision.reason.isEmail()) {
        errorMessage = "Invalid email address. Please use a valid email.";
        statusCode = 400;
      } else if (decision.reason.isRateLimit()) {
        errorMessage =
          "Too many attempts. Please wait a moment before trying again.";
        statusCode = 429;
      } else if (decision.reason.isShield()) {
        errorMessage = "Request blocked for security reasons.";
        statusCode = 403;
      }

      return NextResponse.json(
        {
          message: errorMessage,
          code: decision.reason.isRateLimit()
            ? "RATE_LIMITED"
            : "VALIDATION_ERROR",
        },
        { status: statusCode }
      );
    }

    return authHandlers.POST(req);
  } catch (error) {
    console.error("Auth handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
