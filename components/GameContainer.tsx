"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { database, getDailyWords, WORDS_PER_DAY } from "@/data/items";
import { translations, TranslationKeys } from "@/lib/translations";
import {
  fromDayKey,
  isPlayableDayKey,
  todayKey,
  formatDayLabel,
} from "@/lib/days";
import { getStoredVotes, saveVotes, type Vote } from "@/lib/votesStorage";
import Link from "next/link";

type Scores = {
  [key: string]: {
    left: number;
    right: number;
  };
};

const lang: keyof typeof translations = "fr";

export default function GameContainer() {
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date");

  const dayKey = useMemo(() => {
    if (requestedDate && isPlayableDayKey(requestedDate)) return requestedDate;
    return todayKey();
  }, [requestedDate]);

  const isToday = dayKey === todayKey();
  const targetDate = useMemo(() => fromDayKey(dayKey), [dayKey]);
  const items = useMemo(
    () => getDailyWords(database, WORDS_PER_DAY, targetDate),
    [targetDate],
  );

  const [phase, setPhase] = useState<"loading" | "playing" | "finished">(
    "loading",
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Vote[]>([]);
  const [displayResults, setDisplayResults] = useState<Vote[]>([]);
  const [isExit, setIsExit] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scores, setScores] = useState<Scores>({});
  const justFinishedRef = useRef(false);
  const isExitRef = useRef(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = getStoredVotes(dayKey);
    if (existing) {
      setDisplayResults(existing);
      setPhase("finished");
    } else {
      setResults([]);
      setCurrentIndex(0);
      setPhase("playing");
    }
  }, [dayKey]);

  useEffect(() => {
    const fetchScores = async () => {
      const response = await fetch("/api/scores", { cache: "no-store" });
      const data = await response.json();
      setScores(data);
    };
    fetchScores();
  }, []);

  useEffect(() => {
    if (phase === "finished" && justFinishedRef.current) {
      justFinishedRef.current = false;

      const sendResults = async () => {
        if (displayResults.length === 0) return;

        saveVotes(dayKey, displayResults);

        try {
          const response = await fetch("/api/scores", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ votes: displayResults }),
            cache: "no-store",
          });
          const newScores = await response.json();
          setScores(newScores);
        } catch (error) {
          console.error("Failed to send results:", error);
        }
      };

      sendResults();
    }
  }, [phase, displayResults, dayKey]);

  useEffect(() => {
    if (phase === "playing" && items.length > 0) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, items, phase]);

  const animateExit = useCallback(
    (dir: "left" | "right") => {
      if (isExitRef.current) return;
      isExitRef.current = true;
      setIsExit(true);
      setExitDir(dir);

      const currentItem = items[currentIndex];
      const updated = [...results, { item: currentItem, choice: dir }];
      setResults(updated);

      setTimeout(() => {
        isExitRef.current = false;
        setIsExit(false);
        setExitDir(null);
        setIsVisible(false);
        if (currentIndex >= items.length - 1) {
          justFinishedRef.current = true;
          setDisplayResults(updated);
          setPhase("finished");
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 300);
    },
    [currentIndex, items, results],
  );

  const vote = useCallback(
    (dir: "left" | "right") => {
      if (isExitRef.current || phase !== "playing") return;
      animateExit(dir);
    },
    [animateExit, phase],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") vote("left");
      if (e.key === "ArrowRight") vote("right");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [vote]);

  useEffect(() => {
    if (cardRef.current && !isExit && phase === "playing") {
      let mc: HammerManager;

      import("hammerjs").then((Hammer) => {
        if (!cardRef.current) return;
        mc = new Hammer.default(cardRef.current);

        mc.on("pan", (e: HammerInput) => {
          const x = e.deltaX;
          const rotation = x / 15;
          if (cardRef.current) {
            cardRef.current.style.transition = "none";
            cardRef.current.style.transform = `translateX(${x}px) rotate(${rotation}deg)`;

            const stampG = cardRef.current.querySelector(
              ".stamp.left",
            ) as HTMLElement;
            const stampD = cardRef.current.querySelector(
              ".stamp.right",
            ) as HTMLElement;
            if (stampG)
              stampG.style.opacity =
                x < -50 ? Math.min(Math.abs(x) / 150, 1).toString() : "0";
            if (stampD)
              stampD.style.opacity =
                x > 50 ? Math.min(x / 150, 1).toString() : "0";
          }
        });

        mc.on("panend", (e: HammerInput) => {
          if (e.deltaX > 120) animateExit("right");
          else if (e.deltaX < -120) animateExit("left");
          else if (cardRef.current) {
            cardRef.current.style.transition = "transform 0.3s ease";
            cardRef.current.style.transform = "";
            const stamps = cardRef.current.querySelectorAll(
              ".stamp",
            ) as NodeListOf<HTMLElement>;
            stamps.forEach((s) => (s.style.opacity = "0"));
          }
        });

        mc.on("swiperight", () => animateExit("right"));
        mc.on("swipeleft", () => animateExit("left"));
      });

      return () => {
        if (mc) {
          mc.destroy();
        }
      };
    }
  }, [animateExit, isExit, phase]);

  if (phase === "loading") {
    return <div className="game-wrapper" />;
  }

  if (phase === "finished") {
    return (
      <div className="game-wrapper">
        <header>
          <h1 className="font-black text-2xl">Résultats</h1>
          {!isToday && (
            <div className="pt-1 font-bold text-gray-500 text-sm">
              {formatDayLabel(dayKey)}
            </div>
          )}
        </header>
        <div className="results-container">
          <ul className="space-y-4">
            {displayResults.map((result, index) => {
              const itemScores = scores[result.item] || { left: 0, right: 0 };
              const totalVotes = itemScores.left + itemScores.right;
              const leftPercentage =
                totalVotes > 0
                  ? Math.round((itemScores.left / totalVotes) * 100)
                  : 50;
              const rightPercentage = 100 - leftPercentage;

              const userChoiceText = translations[lang][result.choice];
              const majorityChoice: "left" | "right" =
                leftPercentage > rightPercentage ? "left" : "right";
              const majorityPercentage = Math.max(
                leftPercentage,
                rightPercentage,
              );
              const majorityChoiceText = translations[lang][majorityChoice];

              return (
                <li key={index} className="card">
                  <div className="w-full">
                    <p className="mb-2 font-bold text-xl">{result.item}</p>
                    <p className="mb-3 text-gray-600 text-sm">
                      Vous avez voté{" "}
                      <span
                        className={`font-bold ${
                          result.choice === "left" ? "g-txt" : "d-txt"
                        }`}
                      >
                        {userChoiceText}
                      </span>
                      ,{" "}
                      {result.choice !== majorityChoice
                        ? "cependant"
                        : "et comme vous,"}{" "}
                      <span
                        className={`font-bold ${
                          majorityChoice === "left" ? "g-txt" : "d-txt"
                        }`}
                      >
                        {majorityPercentage}%
                      </span>{" "}
                      des gens ont voté {majorityChoiceText}.
                    </p>
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
        <div className="flex-col gap-2 controls">
          <div className="flex items-center gap-4">
            <Link
              href={`/result?date=${dayKey}`}
              className="inline-block flex items-center bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg h-10 font-bold text-gray-600 text-sm"
            >
              Voir les scores du jour
            </Link>
            <Link
              href="/calendrier"
              className="inline-block flex items-center bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg h-10 font-bold text-gray-600 text-sm"
            >
              Rattraper d&apos;autres jours
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      <header>
        <h1 className="font-black text-2xl">
          <span className="g-txt">{translations[lang].left}</span>{" "}
          {translations[lang].or as TranslationKeys}{" "}
          <span className="d-txt">{translations[lang].right}</span> ?
        </h1>
        {!isToday && (
          <div className="pt-1 font-bold text-gray-500 text-xs">
            Rattrapage du {formatDayLabel(dayKey)}
          </div>
        )}
        <div id="counter" className="pb-4 font-bold text-gray-500">
          {currentIndex + 1} / {items.length}
        </div>
      </header>
      <div id="app-container">
        <div className="card-container">
          {currentIndex < items.length && (
            <div
              ref={cardRef}
              className={`card card-game ${isVisible ? "visible" : ""} ${
                isExit ? "exit" : ""
              }`}
              style={
                isExit
                  ? {
                      transform: `translateX(${
                        exitDir === "right" ? 1000 : -1000
                      }px) rotate(${exitDir === "right" ? 45 : -45}deg)`,
                      opacity: 0,
                    }
                  : {}
              }
            >
              <div
                className="left stamp"
                style={{ opacity: exitDir === "left" ? 1 : 0 }}
              >
                {translations[lang].left}
              </div>
              <div
                className="right stamp"
                style={{ opacity: exitDir === "right" ? 1 : 0 }}
              >
                {translations[lang].right}
              </div>
              <h2 className="font-bold text-gray-800 text-2xl select-none">
                {items[currentIndex]}
              </h2>
            </div>
          )}
        </div>
      </div>
      <div className="flex-col gap-2 controls">
        <p className="text-gray-500 text-center">
          Ce site est un jeu humoristique et absurde. Toute ressemblance avec
          une analyse politique serait purement fortuite : aucun jugement,
          aucune prise de position, aucun mouvement politique n’est représenté
          ici.
        </p>
        <div className="flex items-center gap-4">
          <a href="https://www.buymeacoffee.com/m_platypus" target="_blank">
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png"
              alt="Buy Me A Coffee"
              height={40}
              width={147}
              style={{ height: "40px !important", width: "147px !important" }}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
