import { captureException } from '@alrehla/utils/sentry';

export const runtime = 'edge';

const isEmailSimulationEnabled = () =>
  process.env.NODE_ENV !== 'production' &&
  process.env.MARKETPLACE_EMAIL_SIMULATION_ENABLED === 'true';

export async function POST(request: Request) {
  if (!isEmailSimulationEnabled()) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body: unknown = await request.json();
    const { to, subject, html } =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>)
        : {};

    if (
      typeof to !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
      typeof subject !== 'string' ||
      subject.trim().length === 0 ||
      subject.length > 200 ||
      typeof html !== 'string' ||
      html.trim().length === 0 ||
      html.length > 20_000
    ) {
      return Response.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
    }

    return Response.json({ message: 'Email sent successfully (simulated)' });
  } catch (err) {
    captureException(err, {
      tags: {
        route: '/api/send-email',
        method: 'POST',
      },
    });
    return Response.json({ error: 'Failed to send email.' }, { status: 500 });
  }
}

export function GET() {
  return Response.json(
    { error: isEmailSimulationEnabled() ? 'Method not allowed' : 'Not found' },
    { status: isEmailSimulationEnabled() ? 405 : 404 },
  );
}
