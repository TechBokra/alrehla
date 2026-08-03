'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';

export default function SentryExamplePage() {
  const [status, setStatus] = useState<string>('');

  // Sentry verification 1: trigger undefined function call
  const triggerUndefinedFunction = () => {
    try {
      // @ts-ignore
      myUndefinedFunction();
    } catch (err: any) {
      Sentry.captureException(err);
      setStatus(`Captured error: ${err.message}`);
    }
  };

  // Sentry verification 2: throw direct uncaught error
  const triggerUncaughtError = () => {
    throw new Error('Sentry Example Page Test Error: Uncaught Exception in marketplace-alrehla');
  };

  // Sentry verification 3: capture message
  const triggerCaptureMessage = () => {
    const eventId = Sentry.captureMessage(
      'Sentry verification test message from /sentry-example-page (marketplace-alrehla)',
      'info'
    );
    setStatus(`Sent test message to Sentry! Event ID: ${eventId}`);
  };

  // Sentry verification 4: trigger server API error
  const triggerServerError = async () => {
    setStatus('Calling server API /api/sentry-test?type=uncaught ...');
    try {
      const res = await fetch('/api/sentry-test?type=uncaught');
      const data = await res.json();
      setStatus(`Server API response: ${JSON.stringify(data)}`);
    } catch (err: any) {
      setStatus(`Server API call error: ${err.message}`);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-12 px-6" dir="ltr">
      <div className="bg-white rounded-xl shadow-md border p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sentry Verification Page</h1>
          <p className="text-sm text-gray-600 mt-1">
            Project: <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">marketplace-alrehla</code>
          </p>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Sentry Onboarding Instructions Verification:</p>
          <p>Click any button below to fire an error to your Sentry dashboard.</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={triggerUndefinedFunction}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors text-left flex justify-between items-center"
          >
            <span>1. Call myUndefinedFunction() (Sentry Default Test)</span>
            <code className="text-xs bg-red-800 px-2 py-0.5 rounded">myUndefinedFunction()</code>
          </button>

          <button
            onClick={triggerUncaughtError}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-sm transition-colors text-left"
          >
            2. Throw Uncaught Error (React Error Boundary)
          </button>

          <button
            onClick={triggerCaptureMessage}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors text-left"
          >
            3. Send Sentry.captureMessage() Test Info Log
          </button>

          <button
            onClick={triggerServerError}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-colors text-left"
          >
            4. Trigger Server API Error (/api/sentry-test?type=uncaught)
          </button>
        </div>

        {status && (
          <div className="p-4 bg-gray-100 rounded-lg border text-xs font-mono text-gray-800 break-all">
            {status}
          </div>
        )}

        <div className="border-t pt-4 flex justify-between items-center text-xs text-gray-500">
          <span>Full diagnostic suite also available:</span>
          <Link href="/sentry-test" className="text-blue-600 underline hover:text-blue-800">
            Go to /sentry-test page &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
