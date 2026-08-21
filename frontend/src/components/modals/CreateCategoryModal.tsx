import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  AlertCircle,
  Check,
  X,
  Apple,
  Coffee,
  Utensils,
  Zap,
  Fuel,
  Home,
  Heart,
  Glasses,
  BookOpen,
  Music,
  Gamepad2,
  ShoppingCart,
  Loader2,
} from 'lucide-react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Card } from '@components/ui/Card'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name must be 50 characters or less'),
  type: z.enum(['Expense', 'Income', 'Asset', 'Liability'] as const),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  icon: z.string().optional(),
  description: z.string().max(200, 'Description must be 200 characters or less').optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CreateCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (message?: string) => void
  onError?: (error: string) => void
  isLoading?: boolean
  onSubmit: (data: CategoryFormData) => Promise<void>
}

const PRESET_COLORS = [
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#d946ef', // Fuchsia
]

const ICON_OPTIONS = [
  { icon: Apple, label: 'Apple' },
  { icon: Coffee, label: 'Coffee' },
  { icon: Utensils, label: 'Food' },
  { icon: Zap, label: 'Energy' },
  { icon: Fuel, label: 'Fuel' },
  { icon: Home, label: 'Home' },
  { icon: Heart, label: 'Health' },
  { icon: Glasses, label: 'Shopping' },
  { icon: BookOpen, label: 'Education' },
  { icon: Music, label: 'Entertainment' },
  { icon: Gamepad2, label: 'Gaming' },
  { icon: ShoppingCart, label: 'Shopping Cart' },
]

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  isLoading = false,
  onSubmit,
}) => {
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState<string>('')
  const [customColor, setCustomColor] = useState(PRESET_COLORS[0])
  const [showCustomColor, setShowCustomColor] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type: 'Expense',
      color: PRESET_COLORS[0],
      description: '',
    },
  })

  const handleClose = () => {
    reset()
    setSelectedColor(PRESET_COLORS[0])
    setCustomColor(PRESET_COLORS[0])
    setSelectedIcon('')
    setShowCustomColor(false)
    setSubmitError('')
    onClose()
  }

  const onFormSubmit = handleSubmit(async (data) => {
    try {
      setSubmitError('')
      const finalColor = showCustomColor ? customColor : selectedColor
      await onSubmit({
        ...data,
        color: finalColor,
        icon: selectedIcon || undefined,
      })
      handleClose()
      onSuccess?.('Category created successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category'
      setSubmitError(message)
      onError?.(message)
    }
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Create Category</h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted rounded-md transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={onFormSubmit} className="space-y-4">
            {submitError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Category Name <span className="text-destructive">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="e.g., Groceries"
                maxLength={50}
                disabled={isLoading}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            {/* Category Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                {...register('type')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
              </select>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color)
                        setShowCustomColor(false)
                      }}
                      className="h-8 w-8 rounded-md border-2 transition-all"
                      style={{
                        backgroundColor: color,
                        borderColor: selectedColor === color && !showCustomColor ? '#000' : 'transparent',
                      }}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomColor(!showCustomColor)}
                  className="text-sm text-primary hover:underline"
                  disabled={isLoading}
                >
                  {showCustomColor ? 'Use Preset' : 'Use Custom Color'}
                </button>
                {showCustomColor && (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-10 w-10 rounded-md cursor-pointer"
                      disabled={isLoading}
                    />
                    <Input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#000000"
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium mb-2">Icon (Optional)</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIcon('')}
                  className={`h-10 flex items-center justify-center rounded-md border-2 transition-all ${
                    !selectedIcon
                      ? 'border-primary bg-primary/10'
                      : 'border-input hover:border-primary/50'
                  }`}
                  disabled={isLoading}
                  title="No icon"
                >
                  <X className="h-4 w-4" />
                </button>
                {ICON_OPTIONS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedIcon(label)}
                    className={`h-10 flex items-center justify-center rounded-md border-2 transition-all ${
                      selectedIcon === label
                        ? 'border-primary bg-primary/10'
                        : 'border-input hover:border-primary/50'
                    }`}
                    disabled={isLoading}
                    title={label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                {...register('description')}
                placeholder="Add notes about this category..."
                maxLength={200}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create
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

export default CreateCategoryModal
