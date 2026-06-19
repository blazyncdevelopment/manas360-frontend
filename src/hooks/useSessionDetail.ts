import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyTherapistSessionDetail } from '../api/therapistSessions.api';
import { useAuth } from '../context/AuthContext';
import { patientApi } from '../api/patient';

export const useSessionDetail = (sessionId?: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useQuery(['sessionDetail', sessionId], async () => {
    const isPatient = user?.role === 'patient' || window.location.pathname.startsWith('/patient');
    if (isPatient) {
      return patientApi.getSessionDetail(sessionId as string);
    }
    return getMyTherapistSessionDetail(sessionId as string);
  }, {
    enabled: !!sessionId && !!user,
    staleTime: 1000 * 30,
    onSuccess: (data) => {
      // prefetch related patient or other sessions if useful
      if (data?.patient?.id) qc.prefetchQuery(['patient', data.patient.id], () => Promise.resolve(data.patient));
    },
  });
};
