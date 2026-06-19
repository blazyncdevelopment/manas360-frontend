import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Lock, CheckCircle, ChevronDown, ChevronRight, Award, Loader2 } from 'lucide-react';
import { useEnrollmentStore } from '../../store/CertificationEnrollmentStore';
import { getPublishedCourses, Course } from '../../api/courses';

export default function LearnerCertificatePage() {
  const navigate = useNavigate();
  const { enrollments, loading: enrollmentsLoading } = useEnrollmentStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getPublishedCourses();
        setCourses(data);
      } catch (err) {
        console.error('Failed to fetch courses', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    void fetchCourses();
  }, []);

  const toggleCourse = (courseId: string) => {
    setExpandedCourseId(expandedCourseId === courseId ? null : courseId);
  };

  if (enrollmentsLoading || loadingCourses) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isEnrolled = (courseId: string) => {
    return enrollments.some((e: any) => e.certificationId === courseId);
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 pb-20 lg:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Certificate Courses</h1>
        <p className="mt-2 text-sm text-slate-500">
          Browse detailed course outlines and access your enrolled video lessons.
        </p>
      </div>

      <div className="space-y-6">
        {courses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No courses available</h3>
            <p className="mt-1 text-slate-500">Check back later for new certificate courses.</p>
          </div>
        ) : (
          courses.map(course => {
            const enrolled = isEnrolled(course.id);
            const isExpanded = expandedCourseId === course.id;

            return (
              <div
                key={course.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  enrolled ? 'border-emerald-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                {/* Course Header */}
                <div
                  onClick={() => toggleCourse(course.id)}
                  className="flex cursor-pointer items-center justify-between p-6 hover:bg-slate-50/80"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        enrolled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {enrolled ? <Award size={24} /> : <BookOpen size={24} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{course.title}</h2>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                        <span>{course.modules?.length || 0} Modules</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>₹{course.price}</span>
                        {enrolled && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                              <CheckCircle size={14} /> Enrolled
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {!enrolled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/learner/checkout/${course.id}`);
                        }}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Enroll Now
                      </button>
                    )}
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                    </div>
                  </div>
                </div>

                {/* Course Modules & Lessons (Expanded State) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                    {course.description && (
                      <p className="mb-6 text-sm text-slate-600 leading-relaxed">{course.description}</p>
                    )}

                    <div className="space-y-4">
                      {course.modules?.map((module, mIdx) => (
                        <div key={module.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <h3 className="font-semibold text-slate-800">
                            Module {mIdx + 1}: {module.title}
                          </h3>
                          <div className="mt-3 space-y-2">
                            {module.lessons?.map((lesson, lIdx) => (
                              <div
                                key={lesson.id}
                                className={`flex items-center justify-between rounded-lg border p-3 transition ${
                                  enrolled || lesson.isFreePreview
                                    ? 'border-slate-100 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/30'
                                    : 'border-slate-100 bg-slate-50/50 opacity-80'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                      enrolled || lesson.isFreePreview
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-slate-200 text-slate-400'
                                    }`}
                                  >
                                    {(enrolled || lesson.isFreePreview) ? <Play size={14} className="ml-0.5" /> : <Lock size={14} />}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium ${enrolled || lesson.isFreePreview ? 'text-slate-900' : 'text-slate-500'}`}>
                                      {lIdx + 1}. {lesson.title}
                                    </p>
                                    {lesson.isFreePreview && !enrolled && (
                                      <span className="mt-0.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                        Free Preview
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {(enrolled || lesson.isFreePreview) && lesson.videoUrl && (
                                  <a
                                    href={lesson.videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                                  >
                                    <Play size={12} /> Watch Video
                                  </a>
                                )}
                              </div>
                            ))}
                            {(!module.lessons || module.lessons.length === 0) && (
                              <p className="text-sm text-slate-400 italic">No lessons in this module yet.</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!course.modules || course.modules.length === 0) && (
                        <p className="text-center text-sm text-slate-500 italic">Course content is currently being prepared.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
