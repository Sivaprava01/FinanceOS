/**
 * FinanceOS Walkthrough
 * Interactive tour explaining key features with elegant cards.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FinanceOS',
    description:
      'Your complete financial operating system. Let's walk through the key features to help you get started.',
    icon: '🚀',
    tips: [
      'This walkthrough explains all major features',
      'You can revisit it anytime from the sidebar',
      'Takes about 5 minutes to complete',
    ],
  },
  {
    id: 'statements',
    title: 'Upload Statements',
    description:
      'Import your financial statements from banks and credit cards. We support PDF, CSV, and Excel formats.',
    icon: '📄',
    tips: [
      'Click "Upload Statement" in the sidebar',
      'Select your PDF, CSV, or Excel file',
      'We automatically extract transactions',
      'You can upload multiple statements at once',
    ],
  },
  {
    id: 'processing',
    title: 'Transaction Processing',
    description:
      'Uploaded statements are automatically scanned and transactions are extracted with intelligent merchant recognition.',
    icon: '⚙️',
    tips: [
      'Processing happens in the background',
      'Large files may take a few moments',
      'You\'ll see a status update when complete',
      'Review transactions before they\'re added to your account',
    ],
  },
  {
    id: 'categorization',
    title: 'Smart Categorization',
    description:
      'Transactions are automatically categorized. Create custom categories as needed for your personal finance system.',
    icon: '🏷️',
    tips: [
      'Categories are created automatically',
      'Add custom categories for any transaction',
      'Change categories anytime',
      'Categories help with spending analysis',
    ],
  },
  {
    id: 'dashboard',
    title: 'Financial Dashboard',
    description:
      'Your personal dashboard shows income, expenses, net worth, and recent transactions at a glance.',
    icon: '📊',
    tips: [
      'See your spending breakdown by category',
      'Monitor income and expenses trends',
      'Check your net worth calculation',
      'View your 5 most recent transactions',
    ],
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    description:
      'Deep dive into comprehensive financial insights with interactive charts and detailed breakdowns.',
    icon: '📈',
    tips: [
      'View income and expense trends',
      'Analyze spending by category',
      'Track cash flow monthly',
      'Monitor your financial health score',
      'Get personalized financial insights',
    ],
  },
  {
    id: 'family',
    title: 'Family Finance',
    description:
      'Collaborate with family members on household finances. Share accounts, set roles, and track shared expenses.',
    icon: '👨‍👩‍👧‍👦',
    tips: [
      'Create or join a family account',
      'Invite family members via email',
      'Set roles: Owner, Admin, Member',
      'View combined family finances',
      'Share transactions with family',
    ],
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description:
      'You now understand FinanceOS. Start by uploading a statement to begin tracking your finances.',
    icon: '✨',
    tips: [
      'Your financial data is encrypted',
      'Access your data anytime from anywhere',
      'Share with trusted family members',
      'Enjoy complete financial transparency',
    ],
  },
];

interface WalkthroughProps {
  onClose?: () => void;
  autoplay?: boolean;
}

const Walkthrough: React.FC<WalkthroughProps> = ({ onClose, autoplay = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(autoplay);

  const step = WALKTHROUGH_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleJumpTo = (stepId: string) => {
    const index = WALKTHROUGH_STEPS.findIndex((s) => s.id === stepId);
    if (index !== -1) {
      setCurrentStep(index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-primary/5 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Close button */}
        {onClose && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              aria-label="Close walkthrough"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Main card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4 text-6xl">{step.icon}</div>
            <CardTitle className="text-2xl">{step.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <p className="text-center text-lg text-muted-foreground">{step.description}</p>

            {/* Tips */}
            {step.tips.length > 0 && (
              <div className="rounded-lg bg-muted p-4">
                <p className="mb-3 text-sm font-semibold">Key Points:</p>
                <ul className="space-y-2">
                  {step.tips.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 text-sm">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                {WALKTHROUGH_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => handleJumpTo(s.id)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep
                        ? 'w-6 bg-primary'
                        : 'w-2 bg-muted hover:bg-muted-foreground'
                    }`}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>

              <Button
                variant={currentStep === WALKTHROUGH_STEPS.length - 1 ? 'default' : 'outline'}
                size="sm"
                onClick={handleNext}
                disabled={currentStep === WALKTHROUGH_STEPS.length - 1}
              >
                {currentStep === WALKTHROUGH_STEPS.length - 1 ? 'Done' : 'Next'}
                {currentStep !== WALKTHROUGH_STEPS.length - 1 && (
                  <ChevronRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Step counter */}
            <div className="text-center text-xs text-muted-foreground">
              Step {currentStep + 1} of {WALKTHROUGH_STEPS.length}
            </div>
          </CardContent>
        </Card>

        {/* Quick navigation */}
        {currentStep === 0 && (
          <Card className="text-center">
            <CardContent className="pt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Or jump directly to a topic:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {WALKTHROUGH_STEPS.slice(1, -1).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleJumpTo(s.id)}
                    className="rounded-full bg-muted px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {s.icon} {s.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Walkthrough;
