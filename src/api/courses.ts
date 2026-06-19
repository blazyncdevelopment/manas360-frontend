import client from './client';

export type CourseLesson = {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  mediaUrl: string | null;
  isFreePreview: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type CourseModule = {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  lessons: CourseLesson[];
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  status: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
  modules: CourseModule[];
};

export const getPublishedCourses = async (): Promise<Course[]> => {
  const response = await client.get<Course[]>('/v1/courses');
  return response.data;
};

export const getPublishedCourseById = async (id: string): Promise<Course> => {
  const response = await client.get<Course>(`/v1/courses/${id}`);
  return response.data;
};
