/**
 * Onboarding Flow
 * Optional first-time user onboarding with walkthrough and skip options.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronRight, X } from 'lucide-react';
import Walkthrough from './Walkthrough';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState<'intro' | 'walkthrough' | 'complete'>('intro');

  const handleStartWalkthrough = () => {
    setStep('walkthrough');
  };

  const handleWalkthroughComplete = () => {
    setStep('complete');
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleContinue = () => {
    onComplete();
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md shadow-lg">
          <CardHeader>
            <div className="mb-4 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <CardTitle className="text-2xl">Welcome to FinanceOS!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Your complete financial operating system. Let's get you set up with a quick tour of the key features.
            </p>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">What you'll learn:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ How to upload financial statements</li>
                <li>✓ How transactions are processed</li>
                <li>✓ How to organize and categorize</li>
                <li>✓ How to use the dashboard</li>
                <li>✓ How to analyze your finances</li>
                <li>✓ How to collaborate with family</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button onClick={handleStartWalkthrough} className="w-full">
                Start Tour
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={handleSkip} variant="outline" className="w-full">
                Skip for Now
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Takes about 5 minutes. You can revisit this anytime from the sidebar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'walkthrough') {
    return (
      <div className="relative">
        <Walkthrough
          onClose={handleWalkthroughComplete}
          autoplay={false}
        />
      </div>
    );
  }

  // Complete step
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md shadow-lg">
        <CardHeader>
          <div className="mb-4 text-center">
            <div className="text-6xl mb-4">✨</div>
            <CardTitle className="text-2xl">You're All Set!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            You now have a complete understanding of FinanceOS. Ready to start managing your finances?
          </p>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
            <p className="text-sm font-medium">Next Steps:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>📄 Upload your first statement</li>
              <li>📊 Review your dashboard</li>
              <li>👨‍👩‍👧 Invite family members (optional)</li>
            </ul>
          </div>

          <Button onClick={handleContinue} className="w-full">
            Go to Dashboard
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Access "How It Works" anytime from the sidebar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
