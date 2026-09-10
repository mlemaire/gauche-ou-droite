"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { translations } from "@/lib/translations";
import { todayKey, isPlayableDayKey, formatDayLabel } from "@/lib/days";
import { getStoredVotes, type Vote } from "@/lib/votesStorage";
import SupportFooter from "@/components/SupportFooter";

type Scores = {
  [key: string]: {
    left: number;
    right: number;
  };
};

const lang: keyof typeof translations = "fr";

function ResultContent() {
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date");
  const dayKey =
    requestedDate && isPlayableDayKey(requestedDate)
      ? requestedDate
      : todayKey();
  const isToday = dayKey === todayKey();

  const [scores, setScores] = useState<Scores>({});
  const [userVotes, setUserVotes] = useState<Vote[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const votes = getStoredVotes(dayKey);
    setUserVotes(votes);

    if (!votes) {
      setLoading(false);
      return;
    }

    const fetchScores = async () => {
      try {
        const response = await fetch("/api/scores", { cache: "no-store" });
        const scoreData = await response.json();
        setScores(scoreData);
      } catch (error) {
        console.error("Failed to load result data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [dayKey]);

  if (loading) {
    return (
      <div className="results-container">
        <p>Chargement des scores...</p>
      </div>
    );
  }

  if (!userVotes) {
    return (
      <>
        <div className="results-container">
          <p className="text-center">
            Vous devez d&apos;abord jouer les mots{" "}
            {isToday ? "du jour" : `du ${formatDayLabel(dayKey)}`} avant de voir
            les résultats.
            <br />
            <Link
              href={isToday ? "/" : `/?date=${dayKey}`}
              className="font-bold g-txt"
            >
              Jouer maintenant !
            </Link>
          </p>
        </div>
        <div className="gap-4 controls">
          <Link href="/calendrier" className="btn-right btn">
            <i className="fa-solid fa-calendar-days"></i>
          </Link>
        </div>
        <div className="flex-col gap-2 controls">
          <SupportFooter />
        </div>
      </>
    );
  }

  const itemsToDisplay = userVotes.map((v) => v.item);

  return (
    <>
      <div className="results-container">
        <ul className="space-y-4">
          {itemsToDisplay.map((item, index) => {
            const itemScores = scores[item] || { left: 0, right: 0 };
            const totalVotes = itemScores.left + itemScores.right;
            const leftPercentage =
              totalVotes > 0
                ? Math.round((itemScores.left / totalVotes) * 100)
                : 50;
            const rightPercentage = 100 - leftPercentage;

            const userVote = userVotes.find((v) => v.item === item);

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
        <Link href="/calendrier" className="btn-right btn">
          <i className="fa-solid fa-calendar-days"></i>
        </Link>
      </div>
      <div className="flex-col gap-2 controls">
        <SupportFooter />
      </div>
    </>
  );
}

export default function ResultPage() {
  return (
    <div className="game-wrapper">
      <header>
        <h1 className="font-black text-2xl">Résultats du jour</h1>
      </header>
      <Suspense
        fallback={
          <div className="results-container">
            <p>Chargement des scores...</p>
          </div>
        }
      >
        <ResultContent />
      </Suspense>
    </div>
  );
}
