
import { useMemo } from 'react';
import { ProfileData } from './types';
import { validateProfileStep } from '../utils/sharedValidation';

export const useProfileValidation = (activeStep: number, profileData: ProfileData) => {
  const isCurrentStepValid = useMemo(() => {
    return validateProfileStep(activeStep, profileData);
  }, [activeStep, profileData]);

  return { isCurrentStepValid };
};
