"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { database, getDailyWords } from "@/data/items";
import { translations, TranslationKeys } from "@/lib/translations";
import Link from "next/link";

type Scores = {
  [key: string]: {
    left: number;
    right: number;
  };
};

const lang: keyof typeof translations = "fr";
const totalWordsPerDay = 20;

export default function GameContainer() {
  const [items] = useState<string[]>(() => getDailyWords(database));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<
    { item: string; choice: "left" | "right" }[]
  >([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isExit, setIsExit] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scores, setScores] = useState<Scores>({});

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchScores = async () => {
      const response = await fetch("/api/scores", { cache: "no-store" });
      const data = await response.json();
      setScores(data);
    };
    fetchScores();
  }, []);

  useEffect(() => {
    if (isFinished) {
      const sendResults = async () => {
        if (results.length === 0) return;

        // Store votes in localStorage
        localStorage.setItem("daily-votes", JSON.stringify(results));

        try {
          const response = await fetch("/api/scores", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ votes: results }),
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
  }, [isFinished, results]);

  useEffect(() => {
    console.log("scores", scores);
  }, [scores]);

  useEffect(() => {
    if (items.length > 0 && !isFinished) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, items, isFinished]);

  const animateExit = useCallback(
    (dir: "left" | "right") => {
      console.log("exit", dir);
      if (isExit) return;
      setIsExit(true);
      setExitDir(dir);

      const currentItem = items[currentIndex];
      setResults((prev) => [...prev, { item: currentItem, choice: dir }]);

      setTimeout(() => {
        setIsExit(false);
        setExitDir(null);
        setIsVisible(false);
        if (currentIndex >= totalWordsPerDay - 1) {
          setIsFinished(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 300);
    },
    [currentIndex, isExit, items, setResults]
  );

  const vote = useCallback(
    (dir: "left" | "right") => {
      if (isExit || isFinished) return;
      animateExit(dir);
    },
    [animateExit, isExit, isFinished]
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
    if (cardRef.current && !isExit) {
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
              ".stamp.left"
            ) as HTMLElement;
            const stampD = cardRef.current.querySelector(
              ".stamp.right"
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
              ".stamp"
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
  }, [animateExit, isExit]);

  if (isFinished) {
    return (
      <div className="game-wrapper">
        <header>
          <h1 className="font-black text-2xl">Résultats</h1>
        </header>
        <div className="results-container">
          <ul className="space-y-4">
            {results.map((result, index) => {
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
                rightPercentage
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
        <div className="controls">
          <button
            onClick={() => window.location.reload()}
            className="btn-left btn"
          >
            <i className="fa-arrow-rotate-left fa-solid"></i>
          </button>
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
        <div id="counter" className="pb-4 font-bold text-gray-500">
          {currentIndex + 1} / {totalWordsPerDay}
        </div>
      </header>
      <div id="app-container">
        <div className="card-container">
          {items.length > 0 && (
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
        <Link
          href="/result"
          className="inline-block mt-2 font-bold hover:underline"
        >
          Voir les scores du jour
        </Link>
        {/* <button className="btn-left btn" onClick={() => vote("left")}>
          <i className="fa-arrow-left fas"></i>
        </button>
        <button className="btn-right btn" onClick={() => vote("right")}>
          <i className="fa-arrow-right fas"></i>
        </button> */}
      </div>
    </div>
  );
}
