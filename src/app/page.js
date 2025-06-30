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
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0);
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
    setQuestionIndex(0); // Reset questionIndex when difficulty changes
  }, [difficulty]);

  useEffect(() => {
    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));
    vapi.on("volume-level", (volume) => setVolumeLevel(volume));
    vapi.on("message", (message) => {
      if (
        message.type === "transcript" &&
        message.transcriptType === "final" &&
        message.role === "user"
      ) {
        setTranscript((prev) => [
          ...prev,
          { role: message.role, text: message.transcript },
        ]);
      }
      if (
        message.type === "transcript" &&
        message.transcriptType === "final" &&
        message.role === "assistant"
      ) {
        const transcriptText = message.transcript.toLowerCase();

        if (transcriptText.includes("correct for a")) {
          let points = 0;
          if (transcriptText.includes("beginner question")) {
            points = 10;
          } else if (transcriptText.includes("intermediate question")) {
            points = 20;
          } else if (transcriptText.includes("advanced question")) {
            points = 30;
          }

          const newScore = score + points;
          const newStreak = streak + 1;
          const updatedTotalQuestionsAsked = totalQuestionsAsked + 1;

          setScore(newScore);
          setStreak(newStreak);
          setTotalQuestionsAsked(updatedTotalQuestionsAsked);
          setQuestionIndex((prev) => prev + 1);

          setGameState((prevState) => {
            if (newStreak >= 10 && prevState !== "won") {
              vapi.stop();
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              return "won";
            }
            if (updatedTotalQuestionsAsked >= 10 && prevState !== "won") {
              vapi.stop();
              return "lost";
            }
            return prevState;
          });
        } else if (transcriptText.includes("incorrect for a")) {
          const updatedTotalQuestionsAsked = totalQuestionsAsked + 1;

          setStreak(0);
          setTotalQuestionsAsked(updatedTotalQuestionsAsked);
          setQuestionIndex((prev) => prev + 1);

          setGameState((prevState) => {
            if (updatedTotalQuestionsAsked >= 10 && prevState !== "won") {
              vapi.stop();
              return "lost";
            }
            return prevState;
          });
        }
        // Fallback for unexpected feedback: do nothing to prevent score changes
      }
    });
    vapi.on("call-end", () => {
      setIsCallActive(false);
      setIsSpeaking(false);
    });
    vapi.on("error", (e) => {
      setIsCallActive(false);
      setGameState("idle");
    });

    return () => vapi.removeAllListeners();
  }, [score, streak, totalQuestionsAsked, questionIndex, shuffledQuestions]);

  const startQuiz = async () => {
    if (gameState === "won" || gameState === "lost") {
      // Reset game
      setScore(0);
      setStreak(0);
      setQuestionIndex(0);
      setTotalQuestionsAsked(0);
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
    }
    try {
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
      <TranscriptOverlay
        key={`${score}-${streak}`}
        score={score}
        streak={streak}
        gameState={gameState}
      />
    </div>
  );
}
