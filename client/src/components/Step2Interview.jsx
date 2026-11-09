import React from "react";
import maleVideo from "../assets/videos/male-ai.mp4";

import Timer from "./Timer";
import { motion } from "motion/react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { useState } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import axios from "axios";
import { ServerUrl } from "../App";
import { BsArrowRight } from "react-icons/bs";


function Step2Interview({ interviewData, onFinish }) {
  
  const { interviewId, questions: initialQuestions, userName } = interviewData;

  const [questions, setQuestions] = useState(initialQuestions);
  const [isIntroPhase, setIsIntroPhase] = useState(true);

  const [isMicOn, setIsMicOn] = useState(true);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);
  const isMicOnRef = useRef(true);
  const isAIPlayingRef = useRef(false);
  const isIntroPhaseRef = useRef(true);
  const [isAIPlaying, setIsAIPlaying] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  
  const [subtitle, setSubtitle] = useState("");

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const currentQuestion = questions[currentIndex];
  
  const videoSource = maleVideo;

  /* ---------------- SPEAK FUNCTION ---------------- */
  const speakText = async (text) => {

    return new Promise(async (resolve, reject) => {
      
      if (!text) {
        resolve();
        return;
      }
  
      try {
        isAIPlayingRef.current = true;
        setIsAIPlaying(true);

        stopMic();

        videoRef.current?.play();

        setSubtitle(text);

        const response = await axios.post(
          ServerUrl + "/api/tts",
          { text },
          {
            responseType: "blob",
            withCredentials: true,
          }
        );

        const audioBlob = response.data;
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);

          videoRef.current?.pause();
          if (videoRef.current) videoRef.current.currentTime = 0;

          isAIPlayingRef.current = false;
          setIsAIPlaying(false);

          setTimeout(() => {
            setSubtitle("");
            if (isMicOnRef.current && !isIntroPhaseRef.current) {
              startMic();
            }
            resolve();
          }, 300);
        };

        audio.onerror = () => {
          isAIPlayingRef.current = false;
          setIsAIPlaying(false);
          if (isMicOnRef.current && !isIntroPhaseRef.current) {
            startMic();
          }
          reject();
        };

        await audio.play();
      } catch (err) {
        console.warn("Backend TTS unavailable, falling back to Web Speech Synthesis:", err);

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onend = () => {
              videoRef.current?.pause();
              if (videoRef.current) videoRef.current.currentTime = 0;

              isAIPlayingRef.current = false;
              setIsAIPlaying(false);

              setTimeout(() => {
                setSubtitle("");
                if (isMicOnRef.current && !isIntroPhaseRef.current) {
                  startMic();
                }
                resolve();
              }, 300);
            };

            utterance.onerror = () => {
              videoRef.current?.pause();
              if (videoRef.current) videoRef.current.currentTime = 0;

              isAIPlayingRef.current = false;
              setIsAIPlaying(false);

              if (isMicOnRef.current && !isIntroPhaseRef.current) {
                startMic();
              }
              resolve();
            };

            window.speechSynthesis.speak(utterance);
            return;
          } catch (speechErr) {
            console.error("SpeechSynthesis fallback error:", speechErr);
          }
        }

        isAIPlayingRef.current = false;
        setIsAIPlaying(false);
        if (isMicOnRef.current && !isIntroPhaseRef.current) {
          startMic();
        }
        resolve();
      }
  
    });
  
  };


  

  useEffect(() => {
  

   
    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`,
        );

        await speakText(
          "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin.",
        );

        isIntroPhaseRef.current = false;
        setIsIntroPhase(false);
        return;
      } else if (currentQuestion) {
        await new Promise((r) => setTimeout(r, 600));

        await speakText(followUpQuestion || currentQuestion.question);

        // Auto-start microphone as soon as the question finishes speaking
        if (isMicOnRef.current && !isAIPlayingRef.current) {
          startMic();
        }
      }
    };

    runIntro();
  }, [
  
    isIntroPhase,
    currentIndex,
    followUpQuestion,
    currentQuestion,
  ]);

  useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isIntroPhase, currentIndex]);

  useEffect(() => {
    if (!isIntroPhase && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit || 60);
    }
  }, [currentIndex]);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    isAIPlayingRef.current = isAIPlaying;
  }, [isAIPlaying]);

  useEffect(() => {
    isIntroPhaseRef.current = isIntroPhase;
  }, [isIntroPhase]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalChunk = "";
      let liveInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript + " ";
        } else {
          liveInterim += result[0].transcript + " ";
        }
      }

      const trimmedChunk = finalChunk.trim();
      if (trimmedChunk) {
        setAnswer((prev) => {
          const prevTrimmed = (prev || "").trim();
          if (!prevTrimmed) return trimmedChunk;
          // Guard against appending the exact same phrase if repeated by the engine
          if (prevTrimmed.endsWith(trimmedChunk)) {
            return prevTrimmed;
          }
          return `${prevTrimmed} ${trimmedChunk}`;
        });
      }

      setInterimText(liveInterim.trim());
    };

    recognition.onstart = () => {
      console.log("🎤 Recognition Started");
    };

    recognition.onend = () => {
      console.log("🛑 Recognition Ended");
      setInterimText("");
      // Auto-restart continuous recognition if mic is enabled, AI isn't speaking, and not in intro
      if (isMicOnRef.current && !isAIPlayingRef.current && !isIntroPhaseRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore if already active
        }
      }
    };

    recognition.onerror = (event) => {
      console.log("❌ Recognition Error:", event.error);
      if (event.error === "no-speech") {
        setInterimText("");
      }
    };

    recognition.onnomatch = () => {
      console.log("⚠️ No speech matched");
    };

    recognitionRef.current = recognition;

    // If interview is already past intro on mount, start listening
    if (isMicOnRef.current && !isAIPlayingRef.current && !isIntroPhaseRef.current) {
      try {
        recognition.start();
      } catch (e) {}
    }

    return () => {
      try {
        recognition.stop();
        recognition.abort();
      } catch (e) {}
    };
  }, []);

  const startMic = () => {
    if (recognitionRef.current && !isAIPlayingRef.current && !isIntroPhaseRef.current) {
      try {
        console.log("🎤 Starting microphone...");
        recognitionRef.current.start();
      } catch (err) {
        // Recognition already running or initializing
        if (err.name !== "InvalidStateError") {
          console.warn("Mic start notice:", err.message || err);
        }
      }
    }
  };

  const stopMic = () => {
    setInterimText("");
    if (recognitionRef.current) {
      try {
        console.log("🛑 Stopping microphone...");
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const toggleMic = () => {
    if (isMicOn) {
      isMicOnRef.current = false;
      setIsMicOn(false);
      stopMic();
    } else {
      isMicOnRef.current = true;
      setIsMicOn(true);
      startMic();
    }
  };

  const submitAnswer = async () => {
    if (isSubmitting) return;

    stopMic();
    setIsSubmitting(true);

    try {
      const finalAnswer = answer.trim();

      const result = await axios.post(
        ServerUrl + "/api/interview/submit-answer",
        {
          interviewId,
          questionIndex: currentIndex,
          answer: finalAnswer,
          skipped: finalAnswer.length === 0,
          timeTaken: currentQuestion.timeLimit - timeLeft,
          isFollowUp,
        },
        {
          withCredentials: true,
        }
      );

      

      // Follow-up logic
      if (result.data.needsFollowUp) {
        setIsFollowUp(true);
      
        setFollowUpQuestion(result.data.followUpQuestion);
      
        setAnswer("");
      
        // Reset timer for the follow-up question
        setTimeLeft(currentQuestion.timeLimit || 60);
      
        setIsSubmitting(false);
        return;
      } else {
        setIsFollowUp(false);

       

        // Interview Finished
        if (result.data.interviewCompleted) {
          setIsSubmitting(false);

          finishInterview();

          return;
        }

        setFeedback(result.data.feedback);

        await speakText(result.data.feedback);

        // New Question Generated
        if (result.data.nextQuestion) {
          const newQuestion = {
            question: result.data.nextQuestion.question,
            difficulty: result.data.nextQuestion.difficulty,
            type: questions[currentIndex].type,
            timeLimit: questions[currentIndex].timeLimit,
          };

          setQuestions((prev) => [...prev, newQuestion]);

          setTimeLeft(newQuestion.timeLimit);

          setCurrentIndex(result.data.nextQuestion.index);

          setAnswer("");

          setFeedback("");

          setFollowUpQuestion("");

          setIsFollowUp(false);

          
        }
      }

      setIsSubmitting(false);
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {

    setAnswer("");
    setFeedback("");

    if (isFollowUp) {

        setIsFollowUp(false);
        setFollowUpQuestion("");

        return;
    }

    await speakText("Let's continue.");
};

  const finishInterview = async () => {
    stopMic();
    setIsMicOn(false);
    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/finish",
        { interviewId },
        { withCredentials: true },
      );

      console.log(result.data);
      onFinish(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;
  
    if (
      timeLeft === 0 &&
      !isSubmitting &&
      !feedback &&
      !isFollowUp
    ) {
      submitAnswer();
    }
  }, [timeLeft, isSubmitting, feedback, isFollowUp]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }

      audioRef.current?.pause();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-350 min-h-[80vh] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:flex-row overflow-hidden">
        {/* video section */}
        <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            <video
              src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* subtitle */}
          {subtitle && (
            <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed">
                {subtitle}
              </p>
            </div>
          )}

          {/* timer Area */}
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Interview Status</span>
              {isAIPlaying && (
                <span className="text-sm font-semibold text-emerald-600">
                  {isAIPlaying ? "AI Speaking" : ""}
                </span>
              )}
            </div>

            <div className="h-px bg-gray-200"></div>

            <div className="flex justify-center">
              <Timer
                timeLeft={timeLeft}
                totalTime={currentQuestion?.timeLimit}
              />
            </div>

            <div className="h-px bg-gray-200"></div>

            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <span className="text-2xl font-semibold text-emerald-600">
                  {currentIndex + 1}
                </span>
                <span className="text-xs text-gray-400 block">Current Question</span>
              </div>

              <div>
                <span className="text-2xl font-semibold text-emerald-600">
                  {questions.length}
                </span>
                <span className="text-xs text-gray-400 block">Total Questions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Text section */}

        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 tracking-tight">
            AI Smart Interview
          </h2>

          {!isIntroPhase && (
            <div className="relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-400 mb-2">
                Question {currentIndex + 1} of {questions.length}
              </p>

              <div className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed ">
                {followUpQuestion || currentQuestion?.question}
              </div>
            </div>
          )}
          <textarea
            placeholder="Type your answer here..."
            onChange={(e) => setAnswer(e.target.value)}
            value={answer}
            className="flex-1 bg-gray-50 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-150 text-gray-800"
          />

          {isMicOn && !isAIPlaying && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 mt-2 px-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {interimText ? (
                <span className="italic text-gray-500 truncate">
                  "{interimText}..."
                </span>
              ) : (
                <span>Listening... speak your answer</span>
              )}
            </div>
          )}

          {(!feedback || isFollowUp) ?  (
            <div className="flex items-center gap-4 mt-6">
              <motion.button
                onClick={toggleMic}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 transition-colors duration-150"
              >
                {isMicOn ? (
                  <FaMicrophone size={20} />
                ) : (
                  <FaMicrophoneSlash size={20} />
                )}
              </motion.button>

              <motion.button
                onClick={submitAnswer}
                disabled={isSubmitting}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 sm:py-4 rounded-2xl shadow-sm transition-colors duration-150 font-semibold disabled:bg-gray-300"
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </motion.button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm"
            >
              <p className="text-emerald-700 font-medium mb-4">{feedback}</p>

          
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Step2Interview;
