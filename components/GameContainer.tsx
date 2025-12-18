"use client";

import { useEffect, useState, useRef } from "react";
import { database } from "@/data/items";

export default function GameContainer() {
  const [items, setItems] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ item: string; choice: string }[]>(
    []
  );
  const [isFinished, setIsFinished] = useState(false);
  const [isExit, setIsExit] = useState(false);
  const [exitDir, setExitDir] = useState<"gauche" | "droite" | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems([...database].sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    if (items.length > 0 && !isFinished) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, items, isFinished]);

  const animateExit = (dir: "gauche" | "droite") => {
    setIsExit(true);
    setExitDir(dir);

    setResults((prev) => [...prev, { item: items[currentIndex], choice: dir }]);

    setTimeout(() => {
      setIsExit(false);
      setExitDir(null);
      setIsVisible(false);
      if (currentIndex >= 49) {
        setIsFinished(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 300);
  };

  const vote = (dir: "gauche" | "droite") => {
    if (isExit || isFinished) return;
    animateExit(dir);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") vote("gauche");
      if (e.key === "ArrowRight") vote("droite");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isExit, items]);

  useEffect(() => {
    if (cardRef.current && !isExit) {
      const Hammer = require("hammerjs");
      const mc = new Hammer(cardRef.current);

      mc.on("pan", (e: any) => {
        const x = e.deltaX;
        const rotation = x / 15;
        if (cardRef.current) {
          cardRef.current.style.transition = "none";
          cardRef.current.style.transform = `translateX(${x}px) rotate(${rotation}deg)`;

          const stampG = cardRef.current.querySelector(
            ".stamp.gauche"
          ) as HTMLElement;
          const stampD = cardRef.current.querySelector(
            ".stamp.droite"
          ) as HTMLElement;
          if (stampG)
            stampG.style.opacity =
              x < -50 ? Math.min(Math.abs(x) / 150, 1).toString() : "0";
          if (stampD)
            stampD.style.opacity =
              x > 50 ? Math.min(x / 150, 1).toString() : "0";
        }
      });

      mc.on("panend", (e: any) => {
        if (e.deltaX > 120) animateExit("droite");
        else if (e.deltaX < -120) animateExit("gauche");
        else if (cardRef.current) {
          cardRef.current.style.transition = "transform 0.3s ease";
          cardRef.current.style.transform = "";
          const stamps = cardRef.current.querySelectorAll(
            ".stamp"
          ) as NodeListOf<HTMLElement>;
          stamps.forEach((s) => (s.style.opacity = "0"));
        }
      });

      return () => mc.destroy();
    }
  }, [currentIndex, items, isExit]);

  if (isFinished) return <ResultsView results={results} />;

  return (
    <div className="game-wrapper">
      <header>
        <h1 className="font-black">
          <span className="g-txt">Gauche</span> ou{" "}
          <span className="d-txt">Droite</span> ?
        </h1>
        <div id="counter" className="font-bold text-gray-500">
          {currentIndex + 1} / 50
        </div>
      </header>
      <div id="app-container">
        <div className="card-container">
          {items.length > 0 && (
            <div
              ref={cardRef}
              className={`card ${isVisible ? "visible" : ""} ${
                isExit ? "exit" : ""
              }`}
              style={
                isExit
                  ? {
                      transform: `translateX(${
                        exitDir === "droite" ? 1000 : -1000
                      }px) rotate(${exitDir === "droite" ? 45 : -45}deg)`,
                      opacity: 0,
                    }
                  : {}
              }
            >
              <div
                className="stamp gauche"
                style={{ opacity: exitDir === "gauche" ? 1 : 0 }}
              >
                GAUCHE
              </div>
              <div
                className="stamp droite"
                style={{ opacity: exitDir === "droite" ? 1 : 0 }}
              >
                DROITE
              </div>
              <h2 className="font-bold text-gray-800 text-2xl select-none">
                {items[currentIndex]}
              </h2>
            </div>
          )}
        </div>
      </div>
      <div className="controls">
        <button className="btn btn-g" onClick={() => vote("gauche")}>
          <i className="fa-arrow-left fas"></i>
        </button>
        <button className="btn btn-d" onClick={() => vote("droite")}>
          <i className="fa-arrow-right fas"></i>
        </button>
      </div>
    </div>
  );
}

function ResultsView({ results }: { results: any[] }) {
  const dCount = results.filter((r) => r.choice === "droite").length;
  return (
    <div id="results" style={{ display: "block" }}>
      <div className="stat-banner">
        <h2>Verdict</h2>
        <p style={{ fontSize: "1.2rem", marginTop: "10px" }}>
          Vous êtes à{" "}
          <span className="d-txt">{(dCount / 50) * 100}% de Droite</span> et{" "}
          <span className="g-txt">{100 - (dCount / 50) * 100}% de Gauche</span>.
        </p>
      </div>
      <div id="res-list">
        {results.map((r, i) => (
          <div key={i} className="res-row">
            <span style={{ fontWeight: 600 }}>{r.item}</span>
            <span
              className="badge"
              style={{
                background:
                  r.choice === "droite"
                    ? "var(--droite-color)"
                    : "var(--gauche-color)",
              }}
            >
              {r.choice.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          width: "100%",
          padding: "15px",
          marginTop: "20px",
          background: "#333",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        REJOUER
      </button>
    </div>
  );
}
