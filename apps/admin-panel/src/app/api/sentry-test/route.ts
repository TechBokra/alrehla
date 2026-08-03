import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'uncaught';

  if (type === 'captured') {
    try {
      throw new Error('[Sentry Test] Handled Server API Route Error in Admin Panel');
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test_type: 'handled_server_api',
          app: 'admin-panel',
          route: '/api/sentry-test',
        },
        extra: {
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Handled admin server exception successfully sent to Sentry.',
      });
    }
  }

  if (type === 'message') {
    Sentry.captureMessage('[Sentry Test] Server-side info log message from Admin Panel', 'info');
    return NextResponse.json({
      success: true,
      message: 'Admin server-side info message sent to Sentry.',
    });
  }

  // Default: Uncaught server error
  throw new Error('[Sentry Test] Uncaught Server API Route Error in Admin Panel');
}
