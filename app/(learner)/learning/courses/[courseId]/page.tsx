import React from 'react';
import { CoursePlayer } from '@/components/learner/CoursePlayer';

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export default async function CourseDetailPage({ params, searchParams }: CourseDetailPageProps) {
  const { courseId } = await params;
  const sParams = searchParams ? await searchParams : {};
  const isPreview = sParams.preview === 'true';

  return <CoursePlayer courseId={courseId} isPreviewInitial={isPreview} />;
}
