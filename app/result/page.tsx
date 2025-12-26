"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { database, getDailyWords } from "@/data/items";
import { translations } from "@/lib/translations";

// Define the types we'll use, consistent with GameContainer
type Scores = {
  [key: string]: {
    left: number;
    right: number;
  };
};

type Result = {
  item: string;
  choice: "left" | "right";
};

const lang: keyof typeof translations = "fr";

export default function ResultPage() {
  const [scores, setScores] = useState<Scores>({});
  const [userVotes, setUserVotes] = useState<Result[] | null>(null);
  const [dailyItems, setDailyItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function runs on the client after the component mounts
    const fetchAndLoadData = async () => {
      try {
        // 1. Get the list of daily words
        const items = getDailyWords(database);
        setDailyItems(items);

        // 2. Fetch global scores from the API
        const response = await fetch("/api/scores", { cache: "no-store" });
        const scoreData = await response.json();
        setScores(scoreData);

        // 3. Try to get user's votes from localStorage
        const storedVotes = localStorage.getItem("daily-votes");
        if (storedVotes) {
          setUserVotes(JSON.parse(storedVotes));
        }
      } catch (error) {
        console.error("Failed to load result data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndLoadData();
  }, []);

  if (loading) {
    return (
      <div className="game-wrapper">
        <header>
          <h1 className="font-black text-2xl">Résultats</h1>
        </header>
        <div className="results-container">
          <p>Chargement des scores...</p>
        </div>
      </div>
    );
  }

  // Determine which items to display: user's votes or all daily items
  const itemsToDisplay =
    userVotes?.map((v) => v.item) ?? dailyItems.filter((item) => scores[item]);

  return (
    <div className="game-wrapper">
      <header>
        <h1 className="font-black text-2xl">Résultats du jour</h1>
      </header>
      <div className="results-container">
        {itemsToDisplay.length === 0 && (
          <p className="text-center">
            Aucun vote n'a encore été enregistré aujourd'hui.
            <br />
            <Link href="/" className="font-bold g-txt">
              Soyez le premier à jouer !
            </Link>
          </p>
        )}
        <ul className="space-y-4">
          {itemsToDisplay.map((item, index) => {
            const itemScores = scores[item] || { left: 0, right: 0 };
            const totalVotes = itemScores.left + itemScores.right;
            const leftPercentage =
              totalVotes > 0
                ? Math.round((itemScores.left / totalVotes) * 100)
                : 50;
            const rightPercentage = 100 - leftPercentage;

            const userVote = userVotes?.find((v) => v.item === item);

            return (
              <li key={index} className="card">
                <div className="w-full">
                  <p className="mb-2 font-bold text-xl">{item}</p>
                  {userVote && (
                    <p className="mb-3 text-gray-600 text-sm">
                      Vous avez voté{" "}
                      <span
                        className={`font-bold ${
                          userVote.choice === "left" ? "g-txt" : "d-txt"
                        }`}
                      >
                        {translations[lang][userVote.choice]}
                      </span>
                      .
                    </p>
                  )}
                  <div className="flex bg-gray-200 rounded-full h-8 overflow-hidden font-bold text-white text-sm">
                    <div
                      className="bg-[var(--left-color)] flex justify-center items-center"
                      style={{ width: `${leftPercentage}%` }}
                    >
                      {leftPercentage}%
                    </div>
                    <div
                      className="bg-[var(--right-color)] flex justify-center items-center"
                      style={{ width: `${rightPercentage}%` }}
                    >
                      {rightPercentage}%
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="gap-4 controls">
        <Link href="/" className="btn-left btn">
          <i className="fa-solid fa-gamepad"></i>
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="btn-right btn"
        >
          <i className="fa-arrow-rotate-right fa-solid"></i>
        </button>
      </div>
    </div>
  );
}
