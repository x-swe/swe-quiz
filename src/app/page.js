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

  // Helper function to select a random subset of questions
  const getRandomQuestions = (questions, count) => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

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
        if (isCorrect) {
          setScore((prev) => prev + 1);
          setStreak((prev) => prev + 1);
          if (streak + 1 >= 10) {
            setGameState("won");
            vapi.stop();
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        } else {
          setStreak(0);
        }
        setQuestionIndex(totalQuestionsAsked);
        if (totalQuestionsAsked >= 10 && streak < 10) {
          setGameState("lost");
          vapi.stop();
        }
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
  }, [streak]);

  const startQuiz = async () => {
    if (gameState === "won" || gameState === "lost") {
      // Reset game
      setScore(0);
      setStreak(0);
      setQuestionIndex(0);
      setTranscript([]);
      setGameState("playing");
    }
    try {
      // Filter questions by difficulty
      const filteredQuestions =
        difficulty === "all"
          ? quizQuestions
          : quizQuestions.filter((q) => q.difficulty === difficulty);
      // Select only 10 random questions to reduce payload size
      const selectedQuestions = getRandomQuestions(filteredQuestions, 10);
      console.log("Sending questions:", selectedQuestions); // Debug payload
      await vapi.start(process.env.NEXT_PUBLIC_ASSISTANT_ID, {
        variableValues: {
          questions: selectedQuestions,
          currentQuestionIndex: questionIndex,
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
