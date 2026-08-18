import React from 'react'
import { Upload, Zap, Tag, BarChart2, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent } from '@components/ui/Card'

interface Step {
  number: number
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

const steps: Step[] = [
  {
    number: 1,
    icon: <Upload className="h-6 w-6" />,
    title: 'Upload Your Bank Statement',
    description:
      'Export your bank statement as PDF, CSV, or Excel. Upload it to FinanceOS using the Statements page. We support most major bank formats.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    number: 2,
    icon: <Zap className="h-6 w-6" />,
    title: 'Automatic Transaction Processing',
    description:
      'FinanceOS reads your statement and extracts every transaction automatically. Merchants, amounts, and dates are all captured and normalized.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    number: 3,
    icon: <Tag className="h-6 w-6" />,
    title: 'Review and Categorize',
    description:
      'Browse your extracted transactions. FinanceOS suggests categories based on merchant names. You can edit merchant names, categories, and add personal notes.',
    color: 'bg-green-100 text-green-600',
  },
  {
    number: 4,
    icon: <BarChart2 className="h-6 w-6" />,
    title: 'Understand Your Dashboard',
    description:
      'Your dashboard shows this month\'s income, expenses, net balance, and net worth. Charts update automatically every time new transactions are added.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    number: 5,
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Analyze Your Spending',
    description:
      'The Analytics section breaks down spending by category, tracks monthly trends, compares income vs expenses, and highlights your top merchants.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    number: 6,
    icon: <Users className="h-6 w-6" />,
    title: 'Manage Family Finances',
    description:
      'Create a family workspace and invite household members. Manage roles, send invitations, and get a combined financial view for your family.',
    color: 'bg-pink-100 text-pink-600',
  },
]

const HowItWorks: React.FC = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold">How FinanceOS Works</h1>
      <p className="mt-2 text-muted-foreground">
        Your complete guide to managing finances with FinanceOS
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((step) => (
        <Card key={step.number} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {step.number}
                </span>
                <div className={`rounded-xl p-3 ${step.color}`}>{step.icon}</div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold leading-snug">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card className="bg-muted/40">
      <CardContent className="py-6 text-center">
        <p className="text-sm text-muted-foreground">
          You can revisit this guide at any time from the sidebar.
        </p>
      </CardContent>
    </Card>
  </div>
)

export default HowItWorks
