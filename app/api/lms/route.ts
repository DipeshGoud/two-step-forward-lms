import { NextRequest, NextResponse } from 'next/server';
import { getBootstrap, LmsError, performMutation, requireLmsContext } from '@/lib/lms/server';

export const dynamic = 'force-dynamic';

function errorResponse(error: unknown): NextResponse {
  if (error instanceof LmsError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('LMS API error:', error);
  return NextResponse.json({ error: 'The LMS request could not be completed.' }, { status: 500 });
}

export async function GET() {
  try {
    const context = await requireLmsContext();
    const state = await getBootstrap(context);
    return NextResponse.json(state, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireLmsContext();
    const body = (await request.json()) as { action?: unknown; input?: unknown };
    if (typeof body.action !== 'string' || body.action.trim().length === 0) {
      throw new LmsError('An LMS operation is required.', 400);
    }

    const result = await performMutation(context, body.action, body.input);
    const state = await getBootstrap(context);
    return NextResponse.json({ state, result }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
