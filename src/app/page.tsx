'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  const [consent, setConsent] = useState(false);
  const router = useRouter();

  const handleStart = () => {
    if (consent) {
      router.push('/exam');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/aau-logo.jpg" alt="AAU Logo" width={48} height={48} className="rounded-full object-cover border-2 border-blue-200 shadow" />
          <h1 className="text-3xl font-bold text-gray-900">AAU UAT Mock Exam</h1>
        </div>
        
        <div className="space-y-6 text-gray-600">
          <p>
            Welcome to the AAU Undergraduate Admission Test (UAT) Mock Exam. This platform simulates the 
            timing and pacing of the actual digital SAT-style entrance exam.
          </p>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">Exam Structure</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
              <li>120 Minutes Total (simulated here as 60 minutes for demo)</li>
              <li>Verbal Reasoning: Reading Comprehension, Syntax, Contextual Vocabulary</li>
              <li>Quantitative Reasoning: Algebra, Data Analysis, Advanced Math</li>
            </ul>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Mandatory Security & Proctoring</h3>
              <p className="text-sm text-red-800">
                This examination is strictly proctored. To proceed, you must grant permission for webcam access.
                A recording indicator will be visible on your screen, and automated captures will be uploaded 
                securely for compliance auditing. Covert or hidden recording is strictly prohibited by our policy.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 mt-8">
            <input 
              type="checkbox" 
              id="consent" 
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <label htmlFor="consent" className="text-sm font-medium text-gray-700">
              I consent to transparent video recording and identity verification for the duration of this exam. 
              I understand a recording indicator will remain visible while the camera is active.
            </label>
          </div>

          <button
            onClick={handleStart}
            disabled={!consent}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${
              consent 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Start Exam & Enable Camera
          </button>
        </div>
      </div>
    </main>
  );
}

