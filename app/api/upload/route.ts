import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'lms-content';

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
}

function extractBucketPath(urlOrPath: string): string | null {
  if (!urlOrPath) return null;
  // If it's a full Supabase storage URL: .../storage/v1/object/public/lms-content/video/...
  const marker = `/${STORAGE_BUCKET}/`;
  if (urlOrPath.includes(marker)) {
    const parts = urlOrPath.split(marker);
    const afterMarker = parts[1] || '';
    const clean = afterMarker.split('?')[0].split('#')[0];
    return decodeURIComponent(clean);
  }
  // If it's already a relative path
  if (
    !urlOrPath.startsWith('http://') &&
    !urlOrPath.startsWith('https://') &&
    !urlOrPath.startsWith('blob:') &&
    !urlOrPath.startsWith('data:')
  ) {
    const clean = urlOrPath.split('?')[0].split('#')[0];
    return decodeURIComponent(clean);
  }
  return null;
}

/**
 * POST /api/upload — Upload binary files (video, pdf, image, thumbnail) to Supabase Storage
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'general';
    const lessonId = (formData.get('lessonId') as string) || `les-${Date.now()}`;
    const courseId = (formData.get('courseId') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Ensure storage bucket exists with public access
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 524288000, // 500MB
      });
    }

    const cleanName = sanitizeFileName(file.name);
    const timestamp = Date.now();
    const path = `${type}/${courseId}/${lessonId}_${timestamp}_${cleanName}`;

    // Convert file to ArrayBuffer / Buffer for server upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Server upload to Supabase storage error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      fileName: file.name,
      fileSize: formatBytes(file.size),
    });
  } catch (err: unknown) {
    console.error('API /api/upload exception:', err);
    const errMsg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/upload — Purges files from Supabase Storage Cloud using service_role credentials
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTargets: string[] = [];

    if (body.path) rawTargets.push(body.path);
    if (body.url) rawTargets.push(body.url);
    if (Array.isArray(body.paths)) rawTargets.push(...body.paths);
    if (Array.isArray(body.urls)) rawTargets.push(...body.urls);

    const validPaths = Array.from(
      new Set(
        rawTargets
          .map(extractBucketPath)
          .filter((p): p is string => Boolean(p && p.trim().length > 0))
      )
    );

    if (validPaths.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No valid storage paths to delete' });
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove(validPaths);

    if (error) {
      console.error('Error deleting files from Supabase storage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: data?.length || validPaths.length,
      deletedPaths: validPaths,
    });
  } catch (err: unknown) {
    console.error('API DELETE /api/upload exception:', err);
    const errMsg = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
