"use server";

import { headers } from "next/headers";
import { auth } from "../auth";
import { apiFetch, doesTitleMatch, getEnv, getOrderByClause, withErrorHandling } from "../utils";
import { BUNNY } from "@/constants";
import { db } from "@/drizzle/db";
import { user, videos } from "@/drizzle/schema";
import { revalidatePath } from "next/cache";
import aj from "../arject";
import { fixedWindow, request } from "@arcjet/next";
import { and, eq, or, sql } from "drizzle-orm";
// Removed unused 'number' import

const VIDEO_STREAM_BASE_URL = BUNNY.STREAM_BASE_URL;
const THUMBNAIL_STORGAE_BASE_URL = BUNNY.STORAGE_BASE_URL;
const THUMBNAIL_CDN_URL = BUNNY.CDN_URL;
const BUNNY_LIBRARY_ID = getEnv("BUNNY_LIBRARY_ID");
const ACCESS_KEYS = {
  streamAccessKey: getEnv("BUNNY_STREAM_ACCESS_KEY"),
  storageAccessKey: getEnv("BUNNY_STORAGE_ACCESS_KEY"),
};

// Helper Functions
const getSeesionUserId = async (): Promise<string> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthenticated");
  }

  return session.user.id;
};

const buildVideoWithUserQuery = () => {
  return db
    .select({ video: videos, user: { id: user.id, name: user.name, image: user.image } })
    .from(videos)
    .leftJoin(user, eq(videos.userId, user.id));
}

const revalidatePaths = (paths: string[]) => {
  paths.forEach((path) => revalidatePath(path));
};

// Define proper error type interface
interface RateLimitError extends Error {
  code: string;
  statusCode: number;
}

// Validator Functions
const validateWithArject = async (fingerPrint: string) => {
  const rateLimit = aj.withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 2,
      characteristics: ["fingerPrint"],
    })
  );

  const req = await request();
  const decision = await rateLimit.protect(req, { fingerPrint });

  if (decision.isDenied()) {
    // Create a user-friendly error with a specific type
    const error = new Error(
      "You're uploading videos too quickly. Please wait a moment before trying again."
    ) as RateLimitError;
    error.code = "RATE_LIMITED";
    error.statusCode = 429;
    throw error;
  }
};

// Server Actions
export const getVideoUploadUrl = withErrorHandling(async () => {
  // Removed unused variable 'getSessionUserId' - the function call was not being used
  await getSeesionUserId(); // Call the function if authentication check is needed

  const videoResponse = await apiFetch<BunnyVideoResponse>(
    `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: "POST",
      bunnyType: "stream",
      body: { title: "Temporrary Title", collectionId: "" },
    }
  );

  const uploadUrl = `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoResponse.guid}`;
  return {
    videoId: videoResponse.guid,
    uploadUrl,
    accessKey: ACCESS_KEYS.streamAccessKey,
  };
});

export const getThumbnailUploadUrl = withErrorHandling(
  async (videoId: string) => {
    const fileName = `${Date.now()}- ${videoId}-thumbnail`;
    const uploadUrl = `${THUMBNAIL_STORGAE_BASE_URL}/thumbnails/${fileName}`;
    const cdnUrl = `${THUMBNAIL_CDN_URL}/thumbnails/${fileName}`;

    return {
      uploadUrl,
      cdnUrl,
      accessKey: ACCESS_KEYS.storageAccessKey,
    };
  }
);

export const saveVideoDetails = withErrorHandling(
  async (videoDetails: VideoDetails) => {
    try {
      const userId = await getSeesionUserId();
      await validateWithArject(userId);

      await apiFetch(
        `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoDetails.videoId}`,
        {
          method: "POST",
          bunnyType: "stream",
          body: {
            title: videoDetails.title,
            description: videoDetails.description,
          },
        }
      );

      await db.insert(videos).values({
        videoId: videoDetails.videoId,
        title: videoDetails.title,
        description: videoDetails.description,
        thumbnailUrl: videoDetails.thumbnailUrl,
        visibility: videoDetails.visibility as "public" | "private",
        duration: videoDetails.duration,
        videoUrl: `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoDetails.videoId}`,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      revalidatePaths(["/"]);

      return { videoId: videoDetails.videoId };
    } catch (error: unknown) {
      // Handle rate limit errors with proper type checking
      if (error instanceof Error && 'code' in error && (error as RateLimitError).code === "RATE_LIMITED") {
        throw error;
      }

      // Handle other errors
      console.error("Error saving video details:", error);
      throw new Error("Failed to save video. Please try again.");
    }
  }
);

export const getAllVideos = withErrorHandling(async (
  searchQuery: string = '',
  sortFilter?: string,
  pageNumber: number = 1,
  pageSize: number = 8,
) => {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id;

  const canSeeTheVideos = or(
    eq(videos.visibility, 'public'),
    eq(videos.userId, currentUserId!),
  );

  const whereCondition = searchQuery.trim() ? and(canSeeTheVideos, doesTitleMatch(videos, searchQuery)) : canSeeTheVideos;

  const [{ totalCount }] = await db.select({ totalCount: sql<number>`count(*)` }).from(videos).where(whereCondition);

  const totalVideos = Number(totalCount || 0);

  const totalPages = Math.ceil(totalVideos / pageSize);

  const videoRecords = await buildVideoWithUserQuery()
    .where(whereCondition)
    .orderBy(sortFilter ? getOrderByClause(sortFilter) : sql`${videos.createdAt} DESC`)
    .limit(pageSize)
    .offset((pageNumber - 1) * pageSize);

  return {
    videos: videoRecords,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalVideos,
      pageSize
    }
  }
})