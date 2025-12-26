import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

export const dynamic = "force-dynamic";

const storeName = "scores";

async function getScores() {
  const store = getStore(storeName);
  try {
    const scores = await store.get("all", { type: "json" });
    return scores || {};
  } catch (error) {
    console.error("Error fetching scores:", error);
    return {};
  }
}

async function saveScores(scores: any) {
  const store = getStore(storeName);
  await store.setJSON("all", scores);
}

export async function GET() {
  const scores = await getScores();
  return NextResponse.json(scores);
}

export async function POST(request: Request) {
  const { itemId, choice } = await request.json();
  const scores = await getScores();

  if (!scores[itemId]) {
    scores[itemId] =
      choice === "left" ? { left: 1, right: 0 } : { left: 0, right: 1 };
  }

  if (choice === "left") {
    scores[itemId].left += 1;
  } else if (choice === "right") {
    scores[itemId].right += 1;
  }

  await saveScores(scores);

  return NextResponse.json(scores);
}
