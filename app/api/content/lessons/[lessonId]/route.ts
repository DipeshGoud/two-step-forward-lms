import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { downloadObject, getAuthorizedLessonObject } from '@/lib/lms/content';
import { LmsError } from '@/lib/lms/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const context = await getAuthContext();
    if (!context) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    const { lessonId } = await params;
    const object = await getAuthorizedLessonObject(context, lessonId);
    return await downloadObject(object);
  } catch (error) {
    if (error instanceof LmsError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Lesson content error:', error);
    return NextResponse.json({ error: 'Content could not be loaded.' }, { status: 500 });
  }
}
