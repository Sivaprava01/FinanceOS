import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  AlertCircle,
  Check,
  X,
  Loader2,
  Home,
  Car,
  User,
  GraduationCap,
  Briefcase,
  Sparkles,
  Layers,
} from 'lucide-react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Card } from '@components/ui/Card'
import { useLoans } from '@hooks/useLoans'
import type { Loan, LoanType, LoanStatus, CreateLoanInput } from '@/types'

const loanSchema = z.object({
  loanName: z.string().min(1, 'Loan name is required').max(100, 'Name must be 100 characters or less'),
  loanType: z.enum([
    'Home Loan',
    'Car Loan',
    'Personal Loan',
    'Education Loan',
    'Business Loan',
    'Gold Loan',
    'Other',
  ] as const),
  lenderName: z.string().min(1, 'Lender / Bank name is required').max(100, 'Lender name must be 100 characters or less'),
  principalAmount: z.number().min(1, 'Principal amount must be greater than 0'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Cannot exceed 100%'),
  loanStartDate: z.string().min(1, 'Start date is required'),
  loanEndDate: z.string().min(1, 'End date is required'),
  emiAmount: z.number().min(1, 'EMI amount must be greater than 0'),
  emiDueDay: z.number().min(1, 'Must be between 1 and 31').max(31, 'Must be between 1 and 31'),
  outstandingBalance: z.number().min(0, 'Outstanding balance cannot be negative'),
  loanStatus: z.enum(['Active', 'Closed'] as const),
})

type LoanFormData = z.infer<typeof loanSchema>

interface LoanModalProps {
  isOpen: boolean
  onClose: () => void
  loanToEdit?: Loan | null
  onSuccess?: (message?: string) => void
}

export const LOAN_TYPE_ICONS: Record<LoanType, React.ComponentType<{ className?: string }>> = {
  'Home Loan': Home,
  'Car Loan': Car,
  'Personal Loan': User,
  'Education Loan': GraduationCap,
  'Business Loan': Briefcase,
  'Gold Loan': Sparkles,
  'Other': Layers,
}

const LOAN_TYPES: LoanType[] = [
  'Home Loan',
  'Car Loan',
  'Personal Loan',
  'Education Loan',
  'Business Loan',
  'Gold Loan',
  'Other',
]

const LoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  loanToEdit,
  onSuccess,
}) => {
  const { createLoan, updateLoan, isCreating, isUpdating } = useLoans()
  const [submitError, setSubmitError] = useState<string>('')

  const isEditMode = Boolean(loanToEdit)
  const isBusy = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      loanName: '',
      loanType: 'Home Loan',
      lenderName: '',
      principalAmount: 0,
      interestRate: 8.5,
      loanStartDate: new Date().toISOString().split('T')[0],
      loanEndDate: '',
      emiAmount: 0,
      emiDueDay: 5,
      outstandingBalance: 0,
      loanStatus: 'Active',
    },
  })

  const selectedType = watch('loanType')

  useEffect(() => {
    if (isOpen) {
      if (loanToEdit) {
        reset({
          loanName: loanToEdit.loanName,
          loanType: loanToEdit.loanType,
          lenderName: loanToEdit.lenderName,
          principalAmount: loanToEdit.principalAmount,
          interestRate: loanToEdit.interestRate,
          loanStartDate: loanToEdit.loanStartDate ? new Date(loanToEdit.loanStartDate).toISOString().split('T')[0] : '',
          loanEndDate: loanToEdit.loanEndDate ? new Date(loanToEdit.loanEndDate).toISOString().split('T')[0] : '',
          emiAmount: loanToEdit.emiAmount,
          emiDueDay: loanToEdit.emiDueDay,
          outstandingBalance: loanToEdit.outstandingBalance,
          loanStatus: loanToEdit.loanStatus,
        })
      } else {
        const today = new Date().toISOString().split('T')[0]
        reset({
          loanName: '',
          loanType: 'Home Loan',
          lenderName: '',
          principalAmount: 0,
          interestRate: 8.5,
          loanStartDate: today,
          loanEndDate: '',
          emiAmount: 0,
          emiDueDay: 5,
          outstandingBalance: 0,
          loanStatus: 'Active',
        })
      }
      setSubmitError('')
    }
  }, [isOpen, loanToEdit, reset])

  if (!isOpen) return null

  const onSubmit = handleSubmit(async (data) => {
    try {
      setSubmitError('')
      const payload: CreateLoanInput = {
        loanName: data.loanName.trim(),
        loanType: data.loanType,
        lenderName: data.lenderName.trim(),
        principalAmount: Number(data.principalAmount),
        interestRate: Number(data.interestRate),
        loanStartDate: new Date(data.loanStartDate).toISOString(),
        loanEndDate: new Date(data.loanEndDate).toISOString(),
        emiAmount: Number(data.emiAmount),
        emiDueDay: Number(data.emiDueDay),
        outstandingBalance: Number(data.outstandingBalance),
        loanStatus: data.loanStatus as LoanStatus,
      }

      if (isEditMode && loanToEdit) {
        await updateLoan({ id: loanToEdit._id, data: payload })
        onSuccess?.('Loan updated successfully!')
      } else {
        await createLoan(payload)
        onSuccess?.('Loan added successfully!')
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save loan'
      setSubmitError(msg)
    }
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-xl max-h-[92vh] overflow-y-auto border-border shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-lg font-serif font-bold text-foreground">
                {isEditMode ? 'Edit Loan / EMI' : 'Add Loan / EMI Obligation'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track principal, interest rates, tenure, and monthly EMI outflows.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isBusy}
              className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            {submitError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Loan Name & Lender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Loan Name <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register('loanName')}
                  placeholder="e.g., SBI Home Loan, HDFC Car Loan"
                  disabled={isBusy}
                  className="text-xs h-9"
                />
                {errors.loanName && (
                  <p className="text-[11px] text-destructive mt-1">{errors.loanName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Lender / Bank Name <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register('lenderName')}
                  placeholder="e.g., State Bank of India, ICICI Bank"
                  disabled={isBusy}
                  className="text-xs h-9"
                />
                {errors.lenderName && (
                  <p className="text-[11px] text-destructive mt-1">{errors.lenderName.message}</p>
                )}
              </div>
            </div>

            {/* Loan Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Loan Category <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LOAN_TYPES.map((type) => {
                  const Icon = LOAN_TYPE_ICONS[type]
                  const isSelected = selectedType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('loanType', type)}
                      disabled={isBusy}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{type}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Principal Amount */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Principal Amount (₹) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="1"
                  {...register('principalAmount', {
                    valueAsNumber: true,
                    onChange: (e) => {
                      if (!isEditMode && (!watch('outstandingBalance') || watch('outstandingBalance') === 0)) {
                        setValue('outstandingBalance', Number(e.target.value) || 0)
                      }
                    },
                  })}
                  placeholder="e.g. 2500000"
                  disabled={isBusy}
                  className="text-xs h-9 font-mono"
                />
                {errors.principalAmount && (
                  <p className="text-[11px] text-destructive mt-1">{errors.principalAmount.message}</p>
                )}
              </div>

              {/* Outstanding Balance */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Current Outstanding (₹) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="1"
                  {...register('outstandingBalance', { valueAsNumber: true })}
                  placeholder="e.g. 1850000"
                  disabled={isBusy}
                  className="text-xs h-9 font-mono"
                />
                {errors.outstandingBalance && (
                  <p className="text-[11px] text-destructive mt-1">{errors.outstandingBalance.message}</p>
                )}
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Interest Rate (% p.a.) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('interestRate', { valueAsNumber: true })}
                  placeholder="8.50"
                  disabled={isBusy}
                  className="text-xs h-9 font-mono"
                />
                {errors.interestRate && (
                  <p className="text-[11px] text-destructive mt-1">{errors.interestRate.message}</p>
                )}
              </div>
            </div>

            {/* EMI & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Monthly EMI */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Monthly EMI (₹) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="1"
                  {...register('emiAmount', { valueAsNumber: true })}
                  placeholder="e.g. 24500"
                  disabled={isBusy}
                  className="text-xs h-9 font-mono font-bold text-primary"
                />
                {errors.emiAmount && (
                  <p className="text-[11px] text-destructive mt-1">{errors.emiAmount.message}</p>
                )}
              </div>

              {/* EMI Due Day */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Monthly Due Day <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  {...register('emiDueDay', { valueAsNumber: true })}
                  placeholder="5"
                  disabled={isBusy}
                  className="text-xs h-9 font-mono"
                />
                {errors.emiDueDay && (
                  <p className="text-[11px] text-destructive mt-1">{errors.emiDueDay.message}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Loan Status <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('loanStatus')}
                  disabled={isBusy}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs h-9 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="Active">Active (Ongoing)</option>
                  <option value="Closed">Closed (Settled)</option>
                </select>
              </div>
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Loan Start Date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  {...register('loanStartDate')}
                  disabled={isBusy}
                  className="text-xs h-9"
                />
                {errors.loanStartDate && (
                  <p className="text-[11px] text-destructive mt-1">{errors.loanStartDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Maturity / End Date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  {...register('loanEndDate')}
                  disabled={isBusy}
                  className="text-xs h-9"
                />
                {errors.loanEndDate && (
                  <p className="text-[11px] text-destructive mt-1">{errors.loanEndDate.message}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isBusy}
                className="flex-1 text-xs h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isBusy} className="flex-1 text-xs h-9 font-semibold">
                {isBusy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    {isEditMode ? 'Update Loan' : 'Save Loan'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

export default LoanModal
