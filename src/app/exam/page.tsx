'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import questionsData from '@/lib/uat-questions.json';
import ProctoringOverlay from '@/components/ProctoringOverlay';
import { CheckCircle, XCircle } from 'lucide-react';

type Question = {
  id: number;
  section: string;
  topic: string;
  passage?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const questions: Question[] = questionsData as Question[];

export default function ExamPage() {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const currentQuestion = questions[currentQuestionIdx];
  const selectedAnswer = answers[currentQuestion.id];
  const isRevealed = revealed[currentQuestion.id];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const progress = ((currentQuestionIdx + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const handleSelect = (option: string) => {
    // Don't allow changing answer after revealed
    if (isRevealed) return;
    const letter = option.charAt(0);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: letter }));
    // Immediately reveal explanation
    setRevealed(prev => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          timeTaken: 120 * 60 - timeLeft,
          totalQuestions: questions.length
        })
      });
      const data = await response.json();
      // Encode answers in URL for results page to use
      const encodedAnswers = encodeURIComponent(JSON.stringify(answers));
      router.push(`/results?resultId=${data.resultId || ''}&timeTaken=${120 * 60 - timeLeft}&answers=${encodedAnswers}`);
    } catch {
      const encodedAnswers = encodeURIComponent(JSON.stringify(answers));
      router.push(`/results?timeTaken=${120 * 60 - timeLeft}&answers=${encodedAnswers}`);
    }
  };

  const timerColor = timeLeft < 300 ? 'bg-red-100 text-red-700' : timeLeft < 600 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Image src="/aau-logo.jpg" alt="AAU Logo" width={36} height={36} className="rounded-full object-cover border border-gray-200" />
          <div>
            <h1 className="font-bold text-gray-800 text-sm leading-tight">AAU UAT Mock Exam</h1>
            <p className="text-xs text-gray-400">{currentQuestion.section}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 hidden sm:block">
            <span className="font-semibold text-gray-700">{answeredCount}</span>/{questions.length} answered
          </div>
          <div className={`font-mono text-lg font-bold px-3 py-1 rounded ${timerColor}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1">
        <div className="bg-blue-600 h-1 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Content */}
      <main className="flex-grow container mx-auto max-w-3xl py-6 px-4 flex flex-col gap-4">

        {/* Question Header */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {currentQuestion.section} · {currentQuestion.topic}
          </span>
          <span className="text-sm text-gray-500">
            Question {currentQuestionIdx + 1} of {questions.length}
          </span>
        </div>

        {/* Passage (if applicable) */}
        {currentQuestion.passage && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg text-sm text-gray-700 leading-relaxed italic">
            {currentQuestion.passage}
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-gray-900 text-lg leading-relaxed mb-6 font-medium">
            {currentQuestion.question}
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const letter = option.charAt(0);
              const isSelected = selectedAnswer === letter;
              const isCorrectOption = currentQuestion.correctAnswer === letter;

              let optionStyle = 'border-gray-200 hover:bg-gray-50 cursor-pointer';
              if (isRevealed) {
                if (isCorrectOption) {
                  optionStyle = 'border-green-500 bg-green-50 cursor-default';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'border-red-400 bg-red-50 cursor-default';
                } else {
                  optionStyle = 'border-gray-200 opacity-60 cursor-default';
                }
              } else if (isSelected) {
                optionStyle = 'border-blue-500 bg-blue-50 cursor-pointer';
              }

              return (
                <label
                  key={letter}
                  onClick={() => handleSelect(option)}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${optionStyle}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isRevealed && isCorrectOption ? 'bg-green-500 text-white' :
                    isRevealed && isSelected && !isCorrectOption ? 'bg-red-400 text-white' :
                    isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {letter}
                  </div>
                  <span className="text-gray-700 text-sm">{option.slice(3)}</span>
                  {isRevealed && isCorrectOption && <CheckCircle className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />}
                  {isRevealed && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-400 ml-auto flex-shrink-0" />}
                </label>
              );
            })}
          </div>
        </div>

        {/* Explanation Box - shown after answer */}
        {isRevealed && (
          <div className={`rounded-xl border-2 p-5 ${isCorrect ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect
                ? <CheckCircle className="w-5 h-5 text-green-600" />
                : <XCircle className="w-5 h-5 text-red-500" />
              }
              <span className={`font-bold text-sm ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                {isCorrect ? 'Correct!' : `Incorrect — The correct answer is ${currentQuestion.correctAnswer}`}
              </span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              <span className="font-semibold">Explanation: </span>
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => setCurrentQuestionIdx(idx => Math.max(0, idx - 1))}
            disabled={currentQuestionIdx === 0}
            className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border hover:bg-gray-50 disabled:opacity-40 text-sm"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {currentQuestionIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx(idx => idx + 1)}
                className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 text-sm"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 text-sm"
              >
                {isSubmitting ? 'Submitting...' : '✓ Submit Exam'}
              </button>
            )}
          </div>
        </div>
      </main>

      <ProctoringOverlay isExamActive={true} currentQuestionIndex={currentQuestionIdx} />
    </div>
  );
}