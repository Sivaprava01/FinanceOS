import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  Zap,
  Tag,
  BarChart3,
  TrendingUp,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Badge } from '@components/ui/Badge'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Upload Bank Statements',
    description:
      'Import bank statements in PDF (password-protected supported), CSV, or Excel formats to automatically populate your finances.',
    icon: Upload,
  },
  {
    id: 2,
    title: 'Automatic Extraction',
    description:
      'FinanceOS automatically extracts merchants, amounts, transaction dates, and line items using intelligent parsing algorithms.',
    icon: Zap,
  },
  {
    id: 3,
    title: 'Smart Categorization',
    description:
      'Transactions are automatically categorized into system & custom spending tags. Edit or update merchant details at any time.',
    icon: Tag,
  },
  {
    id: 4,
    title: 'Real-time Dashboard',
    description:
      'Monitor your net worth, total income, monthly expenses, and financial balance in a single consolidated workspace.',
    icon: BarChart3,
  },
  {
    id: 5,
    title: 'Deep Cashflow Analytics',
    description:
      'Analyze spending patterns by merchant, category distribution pie charts, and month-over-month trend lines.',
    icon: TrendingUp,
  },
  {
    id: 6,
    title: 'Family & Shared Finance',
    description:
      'Invite household members, manage access roles, and track shared family transactions in real-time.',
    icon: Users,
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
  const Icon = step.icon
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-xl border border-border shadow-md overflow-hidden">
        {/* Progress Bar Top Edge */}
        <div className="h-1 w-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <button
              onClick={handleSkip}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Close onboarding"
              title="Skip onboarding"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step Hero Content */}
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold tracking-tight text-foreground">{step.title}</h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-1.5">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Checkbox */}
          <div className="flex items-center justify-center gap-2 pt-1 border-t border-border">
            <input
              type="checkbox"
              id="never-show"
              checked={neverShowAgain}
              onChange={(e) => setNeverShowAgain(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="never-show" className="text-xs text-muted-foreground cursor-pointer select-none">
              Don't show onboarding guide automatically on next login
            </label>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs text-muted-foreground">
                Skip All
              </Button>
              {currentStep === steps.length - 1 ? (
                <Button size="sm" onClick={handleFinish} className="text-xs gap-1 font-semibold">
                  Get Started <Sparkles className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleNext} className="text-xs gap-1 font-semibold">
                  Next <ChevronRight className="h-3.5 w-3.5" />
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
