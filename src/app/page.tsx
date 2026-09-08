'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';

export default function LandingPage() {
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStartExam = async () => {
    if (!isConsentChecked) {
      setError('You must agree to the proctoring terms to continue.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Request camera permission upfront so the exam page starts cleanly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      // Stop the test stream — the exam page will open its own
      stream.getTracks().forEach(track => track.stop());

      router.push('/exam');
    } catch (err) {
      const camError = err as Error;
      if (camError.name === 'NotAllowedError') {
        setError('Camera access is required for proctoring. Please allow camera access and try again.');
      } else if (camError.name === 'NotFoundError') {
        setError('No camera detected on this device. A webcam is required to proceed.');
      } else {
        setError(`Could not access camera (${camError.name}). Please check your camera and try again.`);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/aau-logo.jpg"
              alt="AAU Logo"
              width={36}
              height={36}
              className="rounded-full object-cover border-2 border-blue-200 shadow"
            />
            <h1 className="text-xl font-bold text-blue-800">AAU UAT Mock Exam</h1>
          </div>
          <div className="text-sm text-gray-500">Addis Ababa University</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="bg-white rounded-2xl shadow-lg border p-8 md:p-12">

          {/* Welcome Section */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <Image
                src="/aau-logo.jpg"
                alt="AAU Logo"
                width={72}
                height={72}
                className="rounded-full object-cover border-4 border-blue-100 shadow-md"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to the AAU UAT Mock Exam
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              This platform simulates the timing and pacing of the actual digital SAT-style
              Undergraduate Admission Test administered by Addis Ababa University.
            </p>
          </div>

          {/* Exam Structure */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">📚 Exam Structure</h3>
            <ul className="space-y-1.5 text-sm text-blue-900">
              <li>• <strong>Total:</strong> 120 Questions · 144 Minutes (72 seconds/question)</li>
              <li>• <strong>Quantitative Reasoning (65 Qs):</strong> Algebra, Data Analysis, Advanced Math, Solid Geometry, Probability, Exponential &amp; Log Functions, Applied Trigonometry</li>
              <li>• <strong>Verbal Reasoning (55 Qs):</strong> Reading Comprehension, Vocabulary in Context, Writing &amp; Language</li>
            </ul>
          </div>

          {/* Proctoring Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">Proctoring Required</h4>
              <p className="text-sm text-amber-700">
                This exam uses automated proctoring. Your camera will be active during the exam
                to ensure academic integrity. A visible recording indicator will remain on screen
                throughout the session. Images are securely uploaded for compliance auditing.
              </p>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="border-t pt-6 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isConsentChecked}
                onChange={(e) => setIsConsentChecked(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-gray-700 text-sm leading-relaxed">
                I consent to transparent video recording and identity verification for the
                duration of this exam. I understand that a recording indicator will remain
                visible while the camera is active and that captures are securely stored.
                <span className="text-red-500 ml-1">*</span>
              </span>
            </label>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartExam}
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all ${
              isConsentChecked && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Accessing Camera...
              </span>
            ) : (
              'Start Exam & Enable Camera'
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-6">
            AAU UAT Mock Exam · Powered by Savvy Society Academic Team
          </p>
        </div>
      </main>
    </div>
  );
}
