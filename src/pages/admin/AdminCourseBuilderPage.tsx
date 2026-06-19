import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, ArrowLeft, Save, GripVertical, ChevronDown, ChevronUp, Video, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { http } from '../../lib/http';
import toast from 'react-hot-toast';

export default function AdminCourseBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [course, setCourse] = useState<any>({
    title: '',
    description: '',
    price: 0,
    status: 'DRAFT',
    thumbnailUrl: '',
    modules: []
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Modals state
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isNew) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await http.get(`/admin/courses/${id}`);
      setCourse(response.data);
      // Auto-expand all modules
      const expanded: Record<string, boolean> = {};
      response.data.modules?.forEach((m: any) => { expanded[m.id] = true; });
      setExpandedModules(expanded);
    } catch (error) {
      toast.error('Failed to load course details');
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async () => {
    if (!course.title) return toast.error('Course title is required');
    setSaving(true);
    try {
      const payload = {
        title: course.title,
        description: course.description,
        price: course.price,
        status: course.status,
        thumbnailUrl: course.thumbnailUrl
      };
      
      let response;
      if (isNew) {
        response = await http.post('/admin/courses', payload);
      } else {
        response = await http.put(`/admin/courses/${id}`, payload);
      }

      toast.success(isNew ? 'Course created successfully' : 'Course updated successfully');
      
      if (isNew) {
        navigate(`/admin/courses/builder/${response.data.id}`, { replace: true });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  // MODULE ACTIONS
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) return toast.error('Please save the course first before adding modules');
    
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    
    try {
      const payload = { 
        title, 
        orderIndex: editingModule ? editingModule.orderIndex : course.modules?.length || 0 
      };
      
      if (editingModule) {
        await http.put(`/admin/courses/modules/${editingModule.id}`, payload);
      } else {
        await http.post(`/admin/courses/${id}/modules`, payload);
      }

      toast.success('Module saved');
      setModuleModalOpen(false);
      setEditingModule(null);
      fetchCourse();
    } catch (error) {
      toast.error('Failed to save module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    try {
      await http.delete(`/admin/courses/modules/${moduleId}`);
      toast.success('Module deleted');
      fetchCourse();
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  // LESSON ACTIONS
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const videoUrl = formData.get('videoUrl') as string;
    const content = formData.get('content') as string;
    const isFreePreview = formData.get('isFreePreview') === 'on';

    try {
      const payload = { title, videoUrl, content, isFreePreview, orderIndex: editingLesson ? editingLesson.orderIndex : (course.modules?.find((m: any) => m.id === targetModuleId)?.lessons?.length || 0) };

      if (editingLesson) {
        await http.put(`/admin/courses/lessons/${editingLesson.id}`, payload);
      } else {
        await http.post(`/admin/courses/modules/${targetModuleId}/lessons`, payload);
      }

      toast.success('Lesson saved');
      setLessonModalOpen(false);
      setEditingLesson(null);
      setTargetModuleId(null);
      fetchCourse();
    } catch (error) {
      toast.error('Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await http.delete(`/admin/courses/lessons/${lessonId}`);
      toast.success('Lesson deleted');
      fetchCourse();
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/courses')} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isNew ? 'Create New Course' : 'Edit Course'}</h1>
            <p className="text-slate-500">{isNew ? 'Setup your course details before adding modules' : course.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveCourse} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Course'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col - Course Meta */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-slate-800">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <Input 
                value={course.title} 
                onChange={e => setCourse({...course, title: e.target.value})} 
                placeholder="e.g. Master Anxiety Management" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                className="w-full border-slate-200 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                rows={4}
                value={course.description || ''}
                onChange={e => setCourse({...course, description: e.target.value})}
                placeholder="Course summary..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
              <Input 
                type="number"
                value={course.price} 
                onChange={e => setCourse({...course, price: Number(e.target.value)})} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail URL</label>
              <Input 
                value={course.thumbnailUrl || ''} 
                onChange={e => setCourse({...course, thumbnailUrl: e.target.value})} 
                placeholder="https://..." 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select 
                className="w-full border-slate-200 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={course.status}
                onChange={e => setCourse({...course, status: e.target.value})}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </Card>
        </div>

        {/* Right Col - Modules & Lessons */}
        <div className="lg:col-span-2 space-y-6">
          {!isNew && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Curriculum</h3>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => { setEditingModule(null); setModuleModalOpen(true); }}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Module
                </Button>
              </div>

              <div className="p-4 space-y-4">
                {course.modules?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No modules yet. Click "Add Module" to start building your curriculum.
                  </div>
                ) : (
                  course.modules?.map((module: any, idx: number) => (
                    <div key={module.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                      {/* Module Header */}
                      <div 
                        className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200 cursor-pointer"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Module {idx + 1}</span>
                            <h4 className="font-medium text-slate-900">{module.title}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" size="sm" 
                            onClick={(e) => { e.stopPropagation(); setEditingModule(module); setModuleModalOpen(true); }}
                          >
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button 
                            variant="ghost" size="sm" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                          {expandedModules[module.id] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>

                      {/* Lessons List */}
                      {expandedModules[module.id] && (
                        <div className="p-2 space-y-2 bg-slate-50/50">
                          {module.lessons?.map((lesson: any, lIdx: number) => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded shadow-sm hover:border-slate-300 transition-colors">
                              <div className="flex items-center gap-3">
                                {lesson.videoUrl ? <Video className="w-4 h-4 text-indigo-500" /> : <FileText className="w-4 h-4 text-emerald-500" />}
                                <span className="font-medium text-slate-700 text-sm">{lIdx + 1}. {lesson.title}</span>
                                {lesson.isFreePreview && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium uppercase">Free Preview</span>}
                              </div>
                              <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" size="sm" 
                                  onClick={() => { setEditingLesson(lesson); setTargetModuleId(module.id); setLessonModalOpen(true); }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          <button 
                            className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-200 rounded text-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                            onClick={() => { setEditingLesson(null); setTargetModuleId(module.id); setLessonModalOpen(true); }}
                          >
                            <Plus className="w-4 h-4" /> Add Lesson
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Module Modal */}
      {moduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold">{editingModule ? 'Edit Module' : 'Add Module'}</h3>
            </div>
            <form onSubmit={handleSaveModule} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Module Title</label>
                <Input name="title" defaultValue={editingModule?.title} placeholder="e.g. Introduction to CBT" required autoFocus />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setModuleModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 text-white">Save Module</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h3>
            </div>
            <form onSubmit={handleSaveLesson} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lesson Title</label>
                <Input name="title" defaultValue={editingLesson?.title} placeholder="e.g. What is Anxiety?" required autoFocus />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Video URL (Vimeo/YouTube)</label>
                <Input name="videoUrl" defaultValue={editingLesson?.videoUrl || ''} placeholder="https://vimeo.com/..." />
                <p className="text-xs text-slate-500 mt-1">Leave blank if this is a text-only lesson.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Text Content</label>
                <textarea 
                  name="content"
                  className="w-full border-slate-200 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                  rows={6}
                  defaultValue={editingLesson?.content || ''}
                  placeholder="Add notes, transcript, or article content here..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isFreePreview" 
                  name="isFreePreview" 
                  defaultChecked={editingLesson?.isFreePreview}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isFreePreview" className="text-sm font-medium text-slate-700">Allow Free Preview</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setLessonModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 text-white">Save Lesson</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
