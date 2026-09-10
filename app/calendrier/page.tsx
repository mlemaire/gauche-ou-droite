"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPlayableDayKeys, formatDayLabel, todayKey } from "@/lib/days";
import { hasPlayed } from "@/lib/votesStorage";
import SupportFooter from "@/components/SupportFooter";

export default function CalendrierPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const days = mounted
    ? listPlayableDayKeys().map((dayKey) => ({
        dayKey,
        played: hasPlayed(dayKey),
      }))
    : [];

  const today = todayKey();

  return (
    <div className="game-wrapper">
      <header>
        <h1 className="font-black text-2xl">Calendrier</h1>
      </header>
      <div className="results-container">
        <ul className="space-y-3 w-full max-w-md">
          {days.map(({ dayKey, played }) => (
            <li
              key={dayKey}
              className="flex justify-between items-center gap-3 card"
            >
              <div className="w-full">
                <p className="font-bold text-gray-800">
                  {formatDayLabel(dayKey)}
                  {dayKey === today && (
                    <span className="ml-2 text-gray-500 text-xs">
                      (aujourd&apos;hui)
                    </span>
                  )}
                </p>
                <div className="mt-2">
                  {played ? (
                    <Link
                      href={`/result?date=${dayKey}`}
                      className="inline-block bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold text-gray-600 text-sm"
                    >
                      Voir les résultats
                    </Link>
                  ) : (
                    <Link
                      href={`/?date=${dayKey}`}
                      className="inline-block bg-[var(--left-color)] hover:opacity-90 px-4 py-2 rounded-lg font-bold text-white text-sm"
                    >
                      Jouer
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="controls">
        <Link href="/" className="btn-left btn">
          <i className="fa-solid fa-gamepad"></i>
        </Link>
      </div>
      <div className="flex-col gap-2 controls">
        <SupportFooter />
      </div>
    </div>
  );
}
