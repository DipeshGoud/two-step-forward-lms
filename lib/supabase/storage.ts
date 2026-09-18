export const STORAGE_BUCKET = 'lms-content';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
}

/**
 * Uploads a lesson media file through the authenticated server API.
 */
export async function uploadLessonMedia(
  file: File,
  type: 'pdf' | 'image' | 'video',
  lessonId: string,
  courseId = 'general'
): Promise<{ url: string; path: string; fileName: string; fileSize: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('lessonId', lessonId);
    formData.append('courseId', courseId);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed with status ${res.status}`);
    }

    const data = await res.json();
    return {
      url: data.url,
      path: data.path,
      fileName: data.fileName || file.name,
      fileSize: data.fileSize || formatBytes(file.size),
    };
  } catch (err) {
    console.error('Server upload failed:', err);
    throw err;
  }
}

/**
 * Uploads a course thumbnail via secure Server API route /api/upload.
 */
export async function uploadCourseThumbnail(
  file: File,
  courseId: string
): Promise<{ url: string; path: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'thumbnails');
    formData.append('lessonId', 'thumb');
    formData.append('courseId', courseId);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Thumbnail upload failed with status ${res.status}`);
    return {
      url: data.url,
      path: data.path,
    };
  } catch (err) {
    console.error('Thumbnail server upload failed:', err);
    throw err;
  }
}

/**
 * Resolves a storage path to a full public URL.
 */
export function getStoragePublicUrl(storagePath: string): string {
  if (!storagePath) return '';
  if (
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('data:') ||
    storagePath.startsWith('blob:')
  ) {
    return storagePath;
  }
  return `/api/content/files?path=${encodeURIComponent(storagePath)}`;
}

/**
 * Deletes a file from Supabase Storage by path or full URL.
 */
export async function deleteStorageFile(urlOrPath?: string): Promise<boolean> {
  if (!urlOrPath) return true;
  if (urlOrPath.startsWith('blob:') || urlOrPath.startsWith('data:')) return true;

  try {
    const res = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlOrPath, path: urlOrPath }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to delete file from Supabase storage:', err);
    return false;
  }
}

/**
 * Deletes multiple files from Supabase Storage in a single call.
 */
export async function deleteStorageFiles(urlsOrPaths: (string | undefined)[]): Promise<boolean> {
  const valid = urlsOrPaths.filter((u): u is string => Boolean(u && !u.startsWith('blob:') && !u.startsWith('data:')));
  if (valid.length === 0) return true;

  try {
    const res = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: valid, paths: valid }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to batch delete files from Supabase storage:', err);
    return false;
  }
}
