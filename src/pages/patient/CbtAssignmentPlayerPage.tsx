import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientApi } from '../../api/patient';
import CBTActivityPlayer from '../../components/patient/CBTActivityPlayer';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CbtAssignmentPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activity, setActivity] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const plan = await patientApi.getTherapyPlan();
        let found = null;
        if (plan?.cbtExercises) {
          found = plan.cbtExercises.find((e: any) => e.id === id);
        }
        if (!found) {
          // If not in the base plan, try fetching active assignments
          const assignments = await patientApi.getActiveCbtAssignments();
          const assignment = assignments.find((a: any) => a.id === id);
          if (assignment) {
             found = {
               id: assignment.id,
               title: assignment.title,
               templateType: assignment.templateType,
               status: assignment.status,
               description: assignment.description,
               isCbtAssignment: true
             };
          }
        }
        
        if (!found) {
          toast.error('Exercise not found');
          navigate('/patient/dashboard');
          return;
        }
        
        setActivity(found);
      } catch (err) {
        toast.error('Failed to load activity');
        navigate('/patient/dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  const handleSubmit = async (answers: any) => {
    if (!id) return;
    setSubmitting(true);
    try {
      if (activity.isCbtAssignment) {
        await patientApi.updateCbtAssignment(id, { status: 'COMPLETED', responses: answers.answers || answers });
      } else {
        await patientApi.completeTherapyPlanTask(id);
      }
      toast.success('Exercise completed successfully! 🎉');
      navigate('/patient/dashboard');
    } catch (err) {
      toast.error('Failed to submit exercise. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/patient/dashboard');
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-charcoal/50" />
      </div>
    );
  }

  if (!activity) {
    return null;
  }

  // Map backend title/templateType to frontend template string if needed.
  // The player accepts 'thought-record', 'exposure-ladder', 'activity-scheduling', 'behavioral-experiment'.
  let template = 'thought-record';
  const typeStr = String(activity.templateType || activity.type || activity.title).toLowerCase();
  
  if (typeStr.includes('exposure') || typeStr.includes('ladder')) template = 'exposure-ladder';
  else if (typeStr.includes('activity') || typeStr.includes('scheduling')) template = 'activity-scheduling';
  else if (typeStr.includes('behavioral') || typeStr.includes('experiment')) template = 'behavioral-experiment';

  return (
    <div className="mx-auto max-w-4xl pb-20 pt-6">
      <CBTActivityPlayer
        templateType={template as any}
        assignmentTitle={activity.title}
        instructions={activity.description}
        onSubmit={handleSubmit}
        onClose={handleCancel}
      />
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-charcoal" />
        </div>
      )}
    </div>
  );
}
