/**
 * useOnboarding Hook
 * Manages onboarding state and detection for first-time users.
 */

import { useState, useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';

interface OnboardingState {
  showOnboarding: boolean;
  hasSeenOnboarding: boolean;
  isFirstTimeUser: boolean;
  isLoading: boolean;
}

export const useOnboarding = (): OnboardingState & {
  completeOnboarding: () => void;
  skipOnboarding: () => void;
} => {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    if (userLoading) return;

    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem('financeos-onboarding-completed');
    const onboardingSkipped = localStorage.getItem('financeos-onboarding-skipped');

    // Show onboarding only if:
    // 1. User is logged in
    // 2. User hasn't completed or skipped onboarding
    // 3. This is their first visit (createdAt is recent - within 1 minute)
    if (user) {
      if (onboardingCompleted || onboardingSkipped) {
        setHasSeenOnboarding(true);
        setShowOnboarding(false);
      } else {
        // Check if this is a newly created account (within 1 minute)
        const createdAt = new Date(user.createdAt).getTime();
        const now = new Date().getTime();
        const minutesOld = (now - createdAt) / (1000 * 60);

        // Show onboarding for new users (within 1 minute of account creation)
        if (minutesOld < 1) {
          setShowOnboarding(true);
          setHasSeenOnboarding(false);
        } else {
          setShowOnboarding(false);
          setHasSeenOnboarding(true);
        }
      }
    }
  }, [user, userLoading]);

  const completeOnboarding = () => {
    localStorage.setItem('financeos-onboarding-completed', 'true');
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  const skipOnboarding = () => {
    localStorage.setItem('financeos-onboarding-skipped', 'true');
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  return {
    showOnboarding,
    hasSeenOnboarding,
    isFirstTimeUser: showOnboarding,
    isLoading: userLoading,
    completeOnboarding,
    skipOnboarding,
  };
};
