"use client";
import { useEffect, useRef } from "react";

export default function QuizButton({
  isCallActive,
  isSpeaking,
  volumeLevel,
  startQuiz,
  stopQuiz,
  gameState,
}) {
  const buttonRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    let hue = 0;

    const animateGlow = () => {
      if (isSpeaking && buttonRef.current) {
        hue = (hue + 1) % 360; // Cycle through hues for RGB effect
        const scale = 1 + volumeLevel * 0.3; // Larger scale based on volume
        buttonRef.current.style.transform = `scale(${scale})`;
        buttonRef.current.style.backgroundColor = `hsl(${hue}, 70%, 50%)`; // RGB color cycle
        buttonRef.current.style.boxShadow = `0 0 ${20 + volumeLevel * 15}px 5px hsl(${hue}, 70%, 50%), 0 0 40px 10px rgba(255, 255, 255, 0.3)`;
      } else if (buttonRef.current) {
        buttonRef.current.style.transform = "scale(1)";
        buttonRef.current.style.backgroundColor = isCallActive
          ? "#ef4444"
          : "#3b82f6"; // Red when active, blue when idle
        buttonRef.current.style.boxShadow =
          "0 0 15px 5px rgba(59, 130, 246, 0.6), 0 0 30px 10px rgba(255, 255, 255, 0.2)";
      }
      animationFrame = requestAnimationFrame(animateGlow);
    };

    animationFrame = requestAnimationFrame(animateGlow);

    return () => cancelAnimationFrame(animationFrame);
  }, [isSpeaking, volumeLevel, isCallActive]);

  return (
    <button
      ref={buttonRef}
      onClick={isCallActive ? stopQuiz : startQuiz}
      className={`w-32 h-32 rounded-full text-white font-bold flex items-center justify-center transition-all duration-100 text-lg
        ${isCallActive ? "bg-red-500" : "bg-blue-500"}`}
    >
      {isCallActive
        ? "Stop"
        : gameState === "won" || gameState === "lost"
          ? "Restart"
          : "Start"}
    </button>
  );
}
