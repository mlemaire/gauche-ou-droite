import { Suspense } from "react";
import GameContainer from "@/components/GameContainer";

export default function Home() {
  return (
    <Suspense fallback={<div className="game-wrapper" />}>
      <GameContainer />
    </Suspense>
  );
}
