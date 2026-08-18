import React, { useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { Card, CardContent } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { useNavigate } from 'react-router-dom'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Upload Bank Statements',
    description: 'Import transactions from your bank statement (PDF, CSV, or Excel format) to get started with tracking your finances.',
    icon: '📄',
  },
  {
    id: 2,
    title: 'Automatic Processing',
    description: 'FinanceOS automatically extracts and categorizes transactions from your statements using intelligent parsing.',
    icon: '⚙️',
  },
  {
    id: 3,
    title: 'Smart Categorization',
    description: 'Transactions are automatically categorized. You can edit and correct categories to match your preferences.',
    icon: '🏷️',
  },
  {
    id: 4,
    title: 'View Your Dashboard',
    description: 'See your financial overview with KPIs, charts, and spending trends at a glance on your personal dashboard.',
    icon: '📊',
  },
  {
    id: 5,
    title: 'Advanced Analytics',
    description: 'Dive deeper into your finances with detailed analytics, trends, and insights across income, expenses, and categories.',
    icon: '📈',
  },
  {
    id: 6,
    title: 'Family Finance',
    description: 'Invite family members to collaborate and share financial views. Manage household finances together.',
    icon: '👨‍👩‍👧',
  },
]

const Onboarding: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [neverShowAgain, setNeverShowAgain] = useState(false)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (neverShowAgain) {
      localStorage.setItem('onboarding_skipped', 'true')
    }
    navigate('/dashboard')
  }

  const handleFinish = () => {
    if (neverShowAgain) {
      localStorage.setItem('onboarding_completed', 'true')
    }
    navigate('/dashboard')
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome to FinanceOS</h1>
              <p className="mt-1 text-muted-foreground">Let's get you started with your personal financial dashboard</p>
            </div>
            <button
              onClick={handleSkip}
              className="rounded-lg p-2 hover:bg-secondary"
              aria-label="Close onboarding"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Content */}
          <div className="mb-8 text-center">
            <div className="mb-6 text-6xl">{step.icon}</div>
            <h2 className="text-2xl font-semibold">{step.title}</h2>
            <p className="mt-3 text-lg text-muted-foreground">{step.description}</p>
          </div>

          {/* Never show again */}
          <div className="mb-8 flex items-center gap-2">
            <input
              type="checkbox"
              id="never-show"
              checked={neverShowAgain}
              onChange={(e) => setNeverShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="never-show" className="text-sm text-muted-foreground">
              Don't show this again
            </label>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleFinish} className="gap-2">
                  Get Started <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="gap-2">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Onboarding
