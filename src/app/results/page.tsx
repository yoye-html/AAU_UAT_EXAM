'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import questionsData from '@/lib/uat-questions.json';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

type Question = {
  id: number;
  section: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const questions: Question[] = questionsData as Question[];

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const params = useSearchParams();
  const timeTaken = parseInt(params.get('timeTaken') || '0');
  const answersParam = params.get('answers');
  const answers: Record<number, string> = answersParam ? JSON.parse(decodeURIComponent(answersParam)) : {};

  // Calculate score
  let score = 0;
  let verbalCorrect = 0, verbalTotal = 0, quantCorrect = 0, quantTotal = 0;

  questions.forEach(q => {
    if (q.section === 'Verbal Reasoning') verbalTotal++;
    else quantTotal++;

    if (answers[q.id] === q.correctAnswer) {
      score++;
      if (q.section === 'Verbal Reasoning') verbalCorrect++;
      else quantCorrect++;
    }
  });

  const percentage = Math.round((score / questions.length) * 100);
  const formatTime = (s: number) => `${Math.floor(s/60)}m ${s%60}s`;

  const scoreColor = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = percentage >= 70 ? 'bg-green-50 border-green-200' : percentage >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/aau-logo.jpg" alt="AAU Logo" width={64} height={64} className="rounded-full object-cover border-2 border-blue-200 shadow" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Exam Results</h1>
          <p className="text-gray-500 text-sm">AAU Undergraduate Admission Test — Mock Exam</p>
        </div>

        {/* Score Summary */}
        <div className={`rounded-xl border-2 p-6 mb-6 text-center ${scoreBg}`}>
          <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>{percentage}%</div>
          <div className="text-gray-700 font-semibold text-lg">{score} / {questions.length} correct</div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-4 h-4" />
              Time: {formatTime(timeTaken)}
            </div>
            <div className={`font-semibold ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
              {percentage >= 70 ? '🎉 Excellent!' : percentage >= 60 ? '👍 Good' : percentage >= 50 ? '📚 Keep Practicing' : '💪 More Study Needed'}
            </div>
          </div>
        </div>

        {/* Section Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-5 text-center shadow-sm">
            <div className="text-sm font-semibold text-gray-500 mb-1">Verbal Reasoning</div>
            <div className="text-3xl font-bold text-blue-600">{verbalCorrect}/{verbalTotal}</div>
            <div className="text-xs text-gray-400">{Math.round((verbalCorrect/verbalTotal)*100)}% correct</div>
          </div>
          <div className="bg-white rounded-xl border p-5 text-center shadow-sm">
            <div className="text-sm font-semibold text-gray-500 mb-1">Quantitative Reasoning</div>
            <div className="text-3xl font-bold text-purple-600">{quantCorrect}/{quantTotal}</div>
            <div className="text-xs text-gray-400">{Math.round((quantCorrect/quantTotal)*100)}% correct</div>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">Question-by-Question Review</h2>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {questions.map((q, idx) => {
              const userAnswer = answers[q.id];
              const correct = userAnswer === q.correctAnswer;
              return (
                <div key={q.id} className={`p-4 ${correct ? 'bg-white' : 'bg-red-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {correct
                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                        : <XCircle className="w-5 h-5 text-red-400" />
                      }
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex gap-2 text-xs text-gray-400 mb-1">
                        <span>Q{idx + 1}</span>
                        <span>·</span>
                        <span>{q.section}</span>
                        <span>·</span>
                        <span>{q.topic}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1 font-medium line-clamp-2">{q.question}</p>
                      <div className="flex gap-4 text-xs">
                        {userAnswer ? (
                          <span className={correct ? 'text-green-600 font-semibold' : 'text-red-500'}>
                            Your answer: {userAnswer}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not answered</span>
                        )}
                        {!correct && (
                          <span className="text-green-600 font-semibold">
                            Correct: {q.correctAnswer}
                          </span>
                        )}
                      </div>
                      {!correct && (
                        <p className="text-xs text-gray-600 mt-1 italic">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/" className="flex-1 text-center py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm">
            Return Home
          </Link>
          <Link href="/exam" className="flex-1 text-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm">
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}
