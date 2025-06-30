import React from "react";

export default function TranscriptOverlay({ score, streak, gameState }) {
  return (
    <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-75 text-white p-4 rounded shadow-lg">
      <p>Score: {score}</p>
      <p>Streak: {streak}</p>
      {gameState === "won" && <p className="text-green-400">You Won!</p>}
      {gameState === "lost" && <p className="text-red-400">Game Over!</p>}
      <p
        style={{ fontStyle: "italic", fontSize: "0.9rem", marginTop: "0.5rem" }}
      >
        Beginner questions: 10 points, Intermediate: 20 points, Advanced: 30
        points
      </p>
    </div>
  );
}
