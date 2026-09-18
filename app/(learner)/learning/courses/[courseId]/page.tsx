import React from 'react';
import { CoursePlayer } from '@/components/learner/CoursePlayer';

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;

  return <CoursePlayer courseId={courseId} />;
}
