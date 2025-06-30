"use client";
import { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import confetti from "canvas-confetti";
import QuizButton from "../components/QuizButton";
import TranscriptOverlay from "../components/TranscriptOverlay";
import { quizQuestions } from "../lib/quizQuestions";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameState, setGameState] = useState("idle"); // idle, playing, won, lost
  const [difficulty, setDifficulty] = useState("all");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  // Helper function to shuffle questions using Fisher-Yates algorithm
  const shuffleQuestions = (questions) => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize shuffled questions on mount and when difficulty changes
  useEffect(() => {
    const filteredQuestions =
      difficulty === "all"
        ? quizQuestions
        : quizQuestions.filter((q) => q.difficulty === difficulty);
    const shuffled = shuffleQuestions(filteredQuestions);
    const selected = shuffled.slice(0, 10);
    setShuffledQuestions(selected);
    console.log(
      "Initialized questions:",
      selected.map((q) => q.question),
    );
  }, [difficulty]);

  useEffect(() => {
    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));
    vapi.on("volume-level", (volume) => setVolumeLevel(volume));
    vapi.on("message", (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setTranscript((prev) => [
          ...prev,
          { role: message.role, text: message.transcript },
        ]);
      }
      if (
        message.type === "tool-call" &&
        message.toolCall.functionName === "update_score"
      ) {
        const { isCorrect, totalQuestionsAsked } = JSON.parse(
          message.toolCall.arguments,
        );
        console.log("Tool call received:", { isCorrect, totalQuestionsAsked });

        // Update score
        setScore((prev) => {
          const newScore = isCorrect ? prev + 1 : prev;
          console.log("New score:", newScore);
          return newScore;
        });

        // Update streak
        setStreak((prev) => {
          const newStreak = isCorrect ? prev + 1 : 0;
          console.log("New streak:", newStreak);
          return newStreak;
        });

        // Update game state using functional updates to ensure latest streak
        setGameState((prevState) => {
          const newStreak = isCorrect ? streak + 1 : 0; // Calculate based on latest streak
          if (isCorrect && prevState !== "won" && newStreak >= 10) {
            vapi.stop();
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            return "won";
          }

          if (totalQuestionsAsked >= 10 && prevState !== "won") {
            vapi.stop();
            return "lost";
          }

          return prevState;
        });

        setQuestionIndex(totalQuestionsAsked);
      }
    });
    vapi.on("call-end", () => {
      setIsCallActive(false);
      setIsSpeaking(false);
    });
    vapi.on("error", (e) => {
      console.error("Vapi error:", {
        message: e.message,
        status: e.status,
        response: e.response?.data,
        stack: e.stack,
      });
      setIsCallActive(false);
      setGameState("idle");
    });

    return () => vapi.removeAllListeners();
  }, []); // Removed `streak` from dependency array

  const startQuiz = async () => {
    if (gameState === "won" || gameState === "lost") {
      // Reset game
      setScore(0);
      setStreak(0);
      setQuestionIndex(0);
      setTranscript([]);
      setGameState("playing");
      // Reshuffle questions
      const filteredQuestions =
        difficulty === "all"
          ? quizQuestions
          : quizQuestions.filter((q) => q.difficulty === difficulty);
      const shuffled = shuffleQuestions(filteredQuestions);
      const selected = shuffled.slice(0, 10);
      setShuffledQuestions(selected);
      console.log(
        "Reset questions:",
        selected.map((q) => q.question),
      );
    }
    try {
      console.log("Sending to Vapi:", {
        questions: shuffledQuestions.map((q) => q.question),
        currentQuestionIndex: questionIndex,
      });
      await vapi.start(process.env.NEXT_PUBLIC_ASSISTANT_ID, {
        variableValues: {
          questions: shuffledQuestions,
          currentQuestionIndex: questionIndex,
          difficulty,
        },
      });
      setIsCallActive(true);
      setGameState("playing");
    } catch (error) {
      console.error("Failed to start quiz:", {
        message: error.message,
        status: error.status,
        response: error.response?.data,
        stack: error.stack,
      });
      setIsCallActive(false);
      setGameState("idle");
    }
  };

  const stopQuiz = () => {
    vapi.stop();
    setIsCallActive(false);
    setGameState("idle");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-12 text-white">
        Software Engineering Quiz
      </h1>
      {gameState !== "playing" && (
        <select
          className="mb-8 p-2 rounded bg-gray-800 text-white"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      )}
      <QuizButton
        isCallActive={isCallActive}
        isSpeaking={isSpeaking}
        volumeLevel={volumeLevel}
        startQuiz={startQuiz}
        stopQuiz={stopQuiz}
        gameState={gameState}
      />
      <TranscriptOverlay score={score} streak={streak} gameState={gameState} />
    </div>
  );
}
