import { NextResponse } from 'next/server';
import { getAuthContext, isAdminRole } from '@/lib/auth/server';
import { downloadObject } from '@/lib/lms/content';
import { LmsError } from '@/lib/lms/server';

export const dynamic = 'force-dynamic';

function contentTypeFromPath(path: string): string {
  if (/\.pdf$/i.test(path)) return 'application/pdf';
  if (/\.(png|webp|gif)$/i.test(path)) return `image/${path.split('.').pop()?.toLowerCase()}`;
  if (/\.(jpg|jpeg)$/i.test(path)) return 'image/jpeg';
  if (/\.webm$/i.test(path)) return 'video/webm';
  if (/\.(mov|qt)$/i.test(path)) return 'video/quicktime';
  if (/\.mp4$/i.test(path)) return 'video/mp4';
  return 'application/octet-stream';
}

export async function GET(request: Request) {
  try {
    const context = await getAuthContext();
    if (!context) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

    const path = new URL(request.url).searchParams.get('path');
    if (!path || path.includes('..') || !path.startsWith('lms-content/') && !/^(pdf|image|video|thumbnails|avatars)\//.test(path)) {
      throw new LmsError('Invalid content path.', 400);
    }

    // Course thumbnails and user avatars are accessible to all authenticated organization members
    const normalizedPath = path.replace(/^lms-content\//, '');
    const isPublicToOrg = normalizedPath.startsWith('thumbnails/') || normalizedPath.startsWith('avatars/');
    if (!isPublicToOrg && !isAdminRole(context.profile.role)) {
      return NextResponse.json({ error: 'Administrator access is required.' }, { status: 403 });
    }

    return await downloadObject({ path, contentType: contentTypeFromPath(path) });
  } catch (error) {
    if (error instanceof LmsError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Storage content error:', error);
    return NextResponse.json({ error: 'Content could not be loaded.' }, { status: 500 });
  }
}
