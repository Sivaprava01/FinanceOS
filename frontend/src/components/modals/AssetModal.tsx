import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  AlertCircle,
  Check,
  X,
  Loader2,
  Landmark,
  Banknote,
  Sparkles,
  TrendingUp,
  PieChart,
  Home,
  Car,
  Coins,
  Folder,
} from 'lucide-react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Card } from '@components/ui/Card'
import { useAssets } from '@hooks/useAssets'
import type { Asset, AssetCategory, CreateAssetInput } from '@/types'

const assetSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required').max(100, 'Name must be 100 characters or less'),
  assetCategory: z.enum([
    'Cash',
    'Bank Account',
    'Gold',
    'Real Estate',
    'Vehicle',
    'Stocks',
    'Mutual Funds',
    'Cryptocurrency',
    'Others',
  ] as const),
  currentValue: z.number().min(0, 'Current value cannot be negative'),
  purchaseValue: z.number().min(0, 'Purchase value cannot be negative').optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional().nullable(),
})

type AssetFormData = z.infer<typeof assetSchema>

interface AssetModalProps {
  isOpen: boolean
  onClose: () => void
  assetToEdit?: Asset | null
  onSuccess?: (message?: string) => void
}

export const CATEGORY_ICONS: Record<AssetCategory, React.ComponentType<{ className?: string }>> = {
  'Bank Account': Landmark,
  'Cash': Banknote,
  'Gold': Sparkles,
  'Stocks': TrendingUp,
  'Mutual Funds': PieChart,
  'Real Estate': Home,
  'Vehicle': Car,
  'Cryptocurrency': Coins,
  'Others': Folder,
}

const CATEGORIES: AssetCategory[] = [
  'Bank Account',
  'Cash',
  'Gold',
  'Stocks',
  'Mutual Funds',
  'Real Estate',
  'Vehicle',
  'Cryptocurrency',
  'Others',
]

const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  assetToEdit,
  onSuccess,
}) => {
  const { createAsset, updateAsset, isCreating, isUpdating } = useAssets()
  const [submitError, setSubmitError] = useState<string>('')

  const isEditMode = Boolean(assetToEdit)
  const isBusy = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      assetName: '',
      assetCategory: 'Bank Account',
      currentValue: 0,
      purchaseValue: null,
      purchaseDate: '',
      notes: '',
    },
  })

  const selectedCategory = watch('assetCategory')

  useEffect(() => {
    if (isOpen) {
      if (assetToEdit) {
        reset({
          assetName: assetToEdit.assetName,
          assetCategory: assetToEdit.assetCategory,
          currentValue: assetToEdit.currentValue,
          purchaseValue: assetToEdit.purchaseValue ?? null,
          purchaseDate: assetToEdit.purchaseDate ? new Date(assetToEdit.purchaseDate).toISOString().split('T')[0] : '',
          notes: assetToEdit.notes ?? '',
        })
      } else {
        reset({
          assetName: '',
          assetCategory: 'Bank Account',
          currentValue: 0,
          purchaseValue: null,
          purchaseDate: '',
          notes: '',
        })
      }
      setSubmitError('')
    }
  }, [isOpen, assetToEdit, reset])

  if (!isOpen) return null

  const onSubmit = handleSubmit(async (data) => {
    try {
      setSubmitError('')
      const payload: CreateAssetInput = {
        assetName: data.assetName.trim(),
        assetCategory: data.assetCategory,
        currentValue: Number(data.currentValue),
        purchaseValue: data.purchaseValue ? Number(data.purchaseValue) : null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString() : null,
        notes: data.notes?.trim() || null,
      }

      if (isEditMode && assetToEdit) {
        await updateAsset({ id: assetToEdit._id, data: payload })
        onSuccess?.('Asset updated successfully!')
      } else {
        await createAsset(payload)
        onSuccess?.('Asset added successfully!')
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save asset'
      setSubmitError(msg)
    }
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[92vh] overflow-y-auto border-border shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-lg font-serif font-bold text-foreground">
                {isEditMode ? 'Edit Asset' : 'Add New Asset'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track your liquid bank balances, investments, or physical assets.
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

            {/* Asset Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Asset Name <span className="text-destructive">*</span>
              </label>
              <Input
                {...register('assetName')}
                placeholder="e.g., HDFC Savings Account, Sovereign Gold Bond, Nifty 50 Index"
                disabled={isBusy}
                className="text-xs h-9"
              />
              {errors.assetName && (
                <p className="text-[11px] text-destructive mt-1">{errors.assetName.message}</p>
              )}
            </div>

            {/* Asset Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Category <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat]
                  const isSelected = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setValue('assetCategory', cat)}
                      disabled={isBusy}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{cat}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Current Value */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Current Market Value (₹) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('currentValue', { valueAsNumber: true })}
                  placeholder="0.00"
                  disabled={isBusy}
                  className="text-xs h-9 font-mono"
                />
                {errors.currentValue && (
                  <p className="text-[11px] text-destructive mt-1">{errors.currentValue.message}</p>
                )}
              </div>

              {/* Purchase Value */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Original Purchase Value (₹) <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('purchaseValue', {
                    setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
                  })}
                  placeholder="e.g. 50000"
                  disabled={isBusy}
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Purchase / Acquisition Date <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Input
                type="date"
                {...register('purchaseDate')}
                disabled={isBusy}
                className="text-xs h-9"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Notes &amp; Details <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Account number, locker location, folios, or valuation assumptions..."
                disabled={isBusy}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 resize-none"
              />
              {errors.notes && (
                <p className="text-[11px] text-destructive mt-1">{errors.notes.message}</p>
              )}
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
                    {isEditMode ? 'Update Asset' : 'Save Asset'}
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

export default AssetModal
