import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

export const dynamic = "force-dynamic";

const storeName = "scores";

// Define a strict type for our scores object
type Scores = {
  [itemId: string]: {
    left: number;
    right: number;
  };
};

// Define a type for the expected request body, which is now an array of votes
interface PostBody {
  votes: { item: string; choice: "left" | "right" }[];
}

/**
 * Checks if an unknown error is an object with a numeric 'status' property.
 * This is a safe way to narrow the type of a caught error.
 */
function isHttpError(error: unknown): error is { status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}

/**
 * Fetches the scores object along with its ETag.
 * The ETag is a version identifier required for atomic updates.
 */
async function getScoresWithMetadata(): Promise<{
  scores: Scores;
  etag: string | null;
}> {
  const store = getStore(storeName);
  try {
    const result = await store.getWithMetadata("all", { type: "json" });

    if (!result) {
      return { scores: {}, etag: null };
    }

    // The etag is a top-level property on the result, not in metadata.
    return {
      scores: (result.data as Scores) || {},
      etag: result.etag ?? null,
    };
  } catch (error) {
    // Use the type guard to safely check the error status.
    if (isHttpError(error) && error.status === 404) {
      return { scores: {}, etag: null };
    }
    throw error;
  }
}

/**
 * The GET handler simply fetches and returns the current scores.
 */
export async function GET() {
  try {
    const { scores } = await getScoresWithMetadata();
    return NextResponse.json(scores);
  } catch (error) {
    console.error("Error in GET /api/scores:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * The POST handler now accepts a batch of votes and applies them all at once.
 */
export async function POST(request: Request) {
  try {
    const { votes } = (await request.json()) as PostBody;
    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return new NextResponse("Invalid or empty votes array", {
        status: 400,
      });
    }

    const store = getStore(storeName);
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const { scores, etag } = await getScoresWithMetadata();

        // Create a new scores object to avoid mutating the original one
        const newScores = { ...scores };

        // Apply all votes from the batch
        for (const vote of votes) {
          const { item, choice } = vote;
          if (!newScores[item]) {
            newScores[item] = { left: 0, right: 0 };
          }
          newScores[item][choice] += 1;
        }

        const options = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };
        await store.setJSON("all", newScores, options);

        return NextResponse.json(newScores);
      } catch (error) {
        // Use the type guard to safely check for a 412 Precondition Failed error.
        if (isHttpError(error) && error.status === 412) {
          if (i === maxRetries - 1) {
            console.error("Update failed after multiple retries:", error);
            return new NextResponse("High contention. Please try again.", {
              status: 409,
            });
          }
          await new Promise((resolve) => setTimeout(resolve, 25 * (i + 1)));
        } else {
          // Re-throw other errors to be caught by the outer catch block.
          throw error;
        }
      }
    }
  } catch (error) {
    console.error("An unexpected error occurred during POST:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  // This should only be reached if the retry loop fails completely.
  return new NextResponse("The request could not be processed.", {
    status: 500,
  });
}
