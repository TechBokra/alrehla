'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Separator,
} from '@alrehla/ui';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Activity,
  Server,
  Monitor,
  Send,
  Info,
  ShieldCheck,
} from 'lucide-react';

export default function SentryTestPage() {
  const [apiResult, setApiResult] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const [clientMessageStatus, setClientMessageStatus] = useState<string>('');

  const dsnConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
  const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';
  const debugMode = process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true';

  // 1. Uncaught Client Error (caught by error boundary)
  const triggerUncaughtClientError = () => {
    throw new Error('[Sentry Test] Uncaught Client Error in Marketplace UI');
  };

  // 2. Handled Client Exception
  const triggerHandledClientError = () => {
    try {
      throw new Error('[Sentry Test] Handled Client Exception captured via Sentry.captureException');
    } catch (error) {
      const eventId = Sentry.captureException(error, {
        tags: {
          test_type: 'handled_client',
          page: '/sentry-test',
        },
        extra: {
          timestamp: new Date().toISOString(),
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        },
      });
      setClientMessageStatus(`Captured Exception Sent! Sentry Event ID: ${eventId}`);
    }
  };

  // 3. Client Log Message
  const triggerClientLogMessage = () => {
    const eventId = Sentry.captureMessage(
      '[Sentry Test] Manual client log message from Marketplace Sentry Test Page',
      'info'
    );
    setClientMessageStatus(`Log Message Sent! Sentry Event ID: ${eventId}`);
  };

  // 4. Server API Tests
  const callServerApi = async (type: 'uncaught' | 'captured' | 'message') => {
    setApiResult({ status: 'loading', message: 'Calling server API...' });
    try {
      const res = await fetch(`/api/sentry-test?type=${type}`);
      const data = await res.json();
      if (!res.ok) {
        setApiResult({
          status: 'error',
          message: `Server returned HTTP ${res.status}: ${data.message || 'Error occurred (captured by Sentry)'}`,
        });
      } else {
        setApiResult({
          status: 'success',
          message: data.message || 'Server request succeeded',
        });
      }
    } catch (err: any) {
      setApiResult({
        status: 'error',
        message: `Network/API call failed: ${err.message || String(err)}`,
      });
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 space-y-8" dir="ltr">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Sentry Diagnostic & Test Page
            </h1>
            <Badge variant="outline" className="flex items-center gap-1 text-sm font-medium">
              <Bug className="w-3.5 h-3.5 text-red-500" /> Marketplace
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Test and verify real-time Sentry client-side and server-side error capturing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={dsnConfigured ? 'default' : 'destructive'}
            className="px-3 py-1 text-xs font-semibold"
          >
            {dsnConfigured ? 'DSN Configured' : 'DSN Missing'}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase">
            Env: {environment}
          </Badge>
        </div>
      </div>

      {/* Environment Status Alert */}
      {!dsnConfigured && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>NEXT_PUBLIC_SENTRY_DSN is not set</AlertTitle>
          <AlertDescription>
            Please add <code className="font-mono bg-red-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SENTRY_DSN</code> and <code className="font-mono bg-red-100 px-1 py-0.5 rounded">SENTRY_DSN</code> to your environment variables to send telemetry events to Sentry.
          </AlertDescription>
        </Alert>
      )}

      {environment === 'development' && !debugMode && (
        <Alert>
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Local Development Mode Notice</AlertTitle>
          <AlertDescription className="text-amber-700">
            In local development, Sentry event sending is muted by default to prevent dashboard clutter. To deliver local test errors to Sentry, set <code className="font-mono bg-amber-100 text-amber-900 px-1 py-0.5 rounded">NEXT_PUBLIC_SENTRY_DEBUG=true</code> and <code className="font-mono bg-amber-100 text-amber-900 px-1 py-0.5 rounded">SENTRY_DEBUG=true</code> in your <code className="font-mono bg-amber-100 text-amber-900 px-1 py-0.5 rounded">.env.local</code>.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid of Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Error Testing Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              <CardTitle>Client-Side Error Testing</CardTitle>
            </div>
            <CardDescription>
              Test browser exceptions, unhandled crashes, and manual Sentry event reporting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border bg-gray-50/50 space-y-2">
                <p className="text-sm font-medium text-gray-800">1. Uncaught React Exception</p>
                <p className="text-xs text-muted-foreground">
                  Throws an unhandled error inside React render/event loop. Triggers App Router <code className="font-mono">error.tsx</code> boundary.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={triggerUncaughtClientError}
                  className="w-full flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" /> Trigger Uncaught Client Error
                </Button>
              </div>

              <div className="p-3 rounded-lg border bg-gray-50/50 space-y-2">
                <p className="text-sm font-medium text-gray-800">2. Handled Client Exception</p>
                <p className="text-xs text-muted-foreground">
                  Catches error in a try/catch block and explicitly invokes <code className="font-mono">Sentry.captureException()</code>.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={triggerHandledClientError}
                  className="w-full flex items-center gap-2"
                >
                  <Bug className="w-4 h-4 text-amber-600" /> Capture Client Exception
                </Button>
              </div>

              <div className="p-3 rounded-lg border bg-gray-50/50 space-y-2">
                <p className="text-sm font-medium text-gray-800">3. Custom Sentry Log Message</p>
                <p className="text-xs text-muted-foreground">
                  Sends a non-error diagnostic log message using <code className="font-mono">Sentry.captureMessage()</code>.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerClientLogMessage}
                  className="w-full flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-blue-600" /> Send Info Log Message
                </Button>
              </div>
            </div>

            {clientMessageStatus && (
              <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Client Action Executed</AlertTitle>
                <AlertDescription className="font-mono break-all">{clientMessageStatus}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Server Error Testing Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-600" />
              <CardTitle>Server-Side Error Testing</CardTitle>
            </div>
            <CardDescription>
              Test API route server crashes, request instrumentation, and server-side logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border bg-gray-50/50 space-y-2">
                <p className="text-sm font-medium text-gray-800">1. Uncaught API Route Error</p>
                <p className="text-xs text-muted-foreground">
                  Calls <code className="font-mono">/api/sentry-test?type=uncaught</code>. The API route throws an uncaught error handled by Next.js <code className="font-mono">onRequestError</code>.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => callServerApi('uncaught')}
                  className="w-full flex items-center gap-2"
                  disabled={apiResult.status === 'loading'}
                >
                  <AlertTriangle className="w-4 h-4" /> Call Uncaught Server API
                </Button>
              </div>

              <div className="p-3 rounded-lg border bg-gray-50/50 space-y-2">
                <p className="text-sm font-medium text-gray-800">2. Handled Server API Exception</p>
                <p className="text-xs text-muted-foreground">
                  Calls <code className="font-mono">/api/sentry-test?type=captured</code>. The API route catches the error and sends it to Sentry via <code className="font-mono">Sentry.captureException</code>.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => callServerApi('captured')}
                  className="w-full flex items-center gap-2"
                  disabled={apiResult.status === 'loading'}
                >
                  <Bug className="w-4 h-4 text-purple-600" /> Call Handled Server API
                </Button>
              </div>

              <div className="p-3 rounded-lg border bg-gray-50/50 space-y-2">
                <p className="text-sm font-medium text-gray-800">3. Server Info Message</p>
                <p className="text-xs text-muted-foreground">
                  Calls <code className="font-mono">/api/sentry-test?type=message</code> to capture a server-side log message.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => callServerApi('message')}
                  className="w-full flex items-center gap-2"
                  disabled={apiResult.status === 'loading'}
                >
                  <Send className="w-4 h-4 text-purple-600" /> Call Server Info Log
                </Button>
              </div>
            </div>

            {apiResult.status !== 'idle' && (
              <Alert
                variant={apiResult.status === 'error' ? 'destructive' : 'default'}
                className="text-xs"
              >
                {apiResult.status === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                <AlertTitle>Server Response Status</AlertTitle>
                <AlertDescription className="font-mono break-all">
                  {apiResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sentry Configuration Overview Box */}
      <Card className="border shadow-sm bg-gray-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-lg">Active Sentry Configuration Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-white border rounded-lg space-y-1">
              <span className="text-xs text-muted-foreground font-medium uppercase">Browser Instrument</span>
              <p className="font-mono text-xs text-gray-900 font-semibold">src/instrumentation-client.ts</p>
            </div>
            <div className="p-3 bg-white border rounded-lg space-y-1">
              <span className="text-xs text-muted-foreground font-medium uppercase">Node / Edge Instrument</span>
              <p className="font-mono text-xs text-gray-900 font-semibold">src/instrumentation.ts</p>
            </div>
            <div className="p-3 bg-white border rounded-lg space-y-1">
              <span className="text-xs text-muted-foreground font-medium uppercase">Build Hook</span>
              <p className="font-mono text-xs text-gray-900 font-semibold">next.config.mjs (withSentryConfig)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
