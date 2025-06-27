export default function TranscriptOverlay({ score, streak, gameState }) {
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 p-6 rounded-xl shadow-lg max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xl font-semibold text-blue-300">Score: {score}</p>
          <p className="text-xl font-semibold text-blue-300">
            Streak: {streak}
          </p>
        </div>
        {gameState === "won" && (
          <p className="text-2xl font-bold text-green-400 animate-pulse">
            You Won!
          </p>
        )}
        {gameState === "lost" && (
          <p className="text-2xl font-bold text-red-400 animate-pulse">
            Game Over!
          </p>
        )}
      </div>
    </div>
  );
}
