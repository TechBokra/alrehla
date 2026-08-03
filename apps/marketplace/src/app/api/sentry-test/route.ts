import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { areDiagnosticsEnabled } from '@/lib/server/diagnostics';

export async function GET(request: Request) {
  if (!areDiagnosticsEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'uncaught';

  if (type === 'captured') {
    try {
      throw new Error('[Sentry Test] Handled Server API Route Error in Marketplace');
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test_type: 'handled_server_api',
          route: '/api/sentry-test',
        },
        extra: {
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Handled server exception successfully sent to Sentry.',
      });
    }
  }

  if (type === 'message') {
    Sentry.captureMessage('[Sentry Test] Server-side info log message from Marketplace', 'info');
    return NextResponse.json({
      success: true,
      message: 'Server-side info message sent to Sentry.',
    });
  }

  // Default: Uncaught server error
  throw new Error('[Sentry Test] Uncaught Server API Route Error in Marketplace');
}
