import { useState, useEffect } from 'react';
import { patientApi } from '../api/patient';

/**
 * Shared hook for therapy-related data that needs to be synchronized
 * across Dashboard and Daily Check-in pages.
 */
export function useTherapyData() {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshStreak = async () => {
    try {
<<<<<<< HEAD
      const statsRes = await patientApi.getMoodStats();
      const statsPayload = (statsRes as Record<string, unknown>)?.data ?? statsRes;
      const updatedStreak = Number((statsPayload as Record<string, any>)?.currentStreak || 0);
=======
      const dashboardRes = await patientApi.getDashboardV2();
      const dashboardPayload = (dashboardRes as Record<string, unknown>)?.data ?? dashboardRes;
      const updatedStreak = Number((dashboardPayload as Record<string, any>)?.streak || 0);
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
      setStreak(updatedStreak);
    } catch (error) {
      console.warn('Failed to refresh streak:', error);
    }
  };

  useEffect(() => {
    refreshStreak().finally(() => setLoading(false));
  }, []);

  return {
    streak,
    setStreak,
    refreshStreak,
    loading,
  };
}