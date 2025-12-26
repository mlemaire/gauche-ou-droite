import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const scoresFilePath = path.join(process.cwd(), "data", "scores.json");

async function getScores() {
  try {
    const data = fs.readFileSync(scoresFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveScores(scores: any) {
  console.log("write  scores", scores);
  fs.writeFileSync(scoresFilePath, JSON.stringify(scores, null, 2));
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
