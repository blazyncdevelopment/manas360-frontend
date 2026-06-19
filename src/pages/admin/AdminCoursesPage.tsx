import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { http } from '../../lib/http';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  thumbnailUrl: string | null;
  modules: any[];
  createdAt: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await http.get('/admin/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      await http.delete(`/admin/courses/${id}`);
      toast.success('Course deleted successfully');
      setCourses(courses.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses Management</h1>
          <p className="text-slate-500 mt-1">Create and manage your educational courses and modules.</p>
        </div>
        <Button onClick={() => navigate('/admin/courses/builder/new')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4" />
          Create Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No courses yet</h3>
          <p className="text-slate-500 mb-4">Get started by creating your first course.</p>
          <Button onClick={() => navigate('/admin/courses/builder/new')} variant="secondary">
            Create First Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Card key={course.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="aspect-video bg-slate-100 relative">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                    <BookOpen className="w-8 h-8 text-indigo-200" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={course.status === 'PUBLISHED' ? 'success' : 'warning'}>
                    {course.status}
                  </Badge>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-slate-900 line-clamp-1 mb-1">{course.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                  {course.description || 'No description provided'}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>{course.modules?.length || 0} Modules</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-indigo-600">₹{course.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(course.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => navigate(`/admin/courses/builder/${course.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
