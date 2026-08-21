import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useAuth } from '@hooks/useAuth'
import { userService } from '@services/user.service'

// ─── Preferences form (language, theme, dateFormat, notifications) ─────────────

const preferencesSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  theme: z.enum(['light', 'dark', 'system']),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }),
})

type PreferencesFormData = z.infer<typeof preferencesSchema>

// ─── Currency form (preferredCurrency — stored on profile) ───────────────────

const currencySchema = z.object({
  preferredCurrency: z
    .string()
    .length(3, 'Must be a 3-letter ISO code')
    .regex(/^[A-Za-z]{3}$/, 'Must be letters only')
    .transform((v) => v.toUpperCase()),
})

type CurrencyFormData = z.infer<typeof currencySchema>

// ─── Password Change form ──────────────────────────────────────────────────────

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

const PasswordChangeCard: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true)
    setError('')
    setSuccess(false)
    try {
      await userService.changePassword(data.currentPassword, data.newPassword)
      setSuccess(true)
      form.reset()
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to change password.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}
          {success && <p className="rounded-lg bg-success/10 px-4 py-2 text-sm text-success">Password changed successfully.</p>}

          <div>
            <label className="block text-sm font-medium">Current Password</label>
            <Input
              type="password"
              placeholder="Enter current password"
              {...form.register('currentPassword')}
              className="mt-1"
            />
            {form.formState.errors.currentPassword && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">New Password</label>
            <Input
              type="password"
              placeholder="Enter new password"
              {...form.register('newPassword')}
              className="mt-1"
            />
            {form.formState.errors.newPassword && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <Input
              type="password"
              placeholder="Confirm new password"
              {...form.register('confirmPassword')}
              className="mt-1"
            />
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>Change Password</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

// ─── Settings Component ────────────────────────────────────────────────────────

const Settings: React.FC = () => {
  const { user, updateUser, logout } = useAuth()

  // Preferences form state
  const [prefSuccess, setPrefSuccess] = useState(false)
  const [prefError, setPrefError] = useState('')
  const [isPrefSubmitting, setIsPrefSubmitting] = useState(false)

  // Currency form state
  const [currSuccess, setCurrSuccess] = useState(false)
  const [currError, setCurrError] = useState('')
  const [isCurrSubmitting, setIsCurrSubmitting] = useState(false)

  const prefForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: user?.preferences?.language ?? 'en',
      theme: user?.preferences?.theme ?? 'system',
      dateFormat: user?.preferences?.dateFormat ?? 'DD/MM/YYYY',
      notifications: {
        email: user?.preferences?.notifications?.email ?? true,
        push: user?.preferences?.notifications?.push ?? false,
      },
    },
  })

  const currForm = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      preferredCurrency: user?.preferredCurrency ?? 'USD',
    },
  })

  const currentTheme = prefForm.watch('theme')
  const emailNotif = prefForm.watch('notifications.email')
  const pushNotif = prefForm.watch('notifications.push')

  const onPrefSubmit = async (data: PreferencesFormData) => {
    setIsPrefSubmitting(true)
    setPrefError('')
    setPrefSuccess(false)
    try {
      const updated = await userService.updatePreferences({
        language: data.language,
        theme: data.theme,
        dateFormat: data.dateFormat,
        notifications: { email: data.notifications.email, push: data.notifications.push },
      })
      updateUser(updated)
      setPrefSuccess(true)
    } catch (err) {
      setPrefError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to save preferences.'
      )
    } finally {
      setIsPrefSubmitting(false)
    }
  }

  const onCurrSubmit = async (data: CurrencyFormData) => {
    setIsCurrSubmitting(true)
    setCurrError('')
    setCurrSuccess(false)
    try {
      const updated = await userService.updateProfile({ preferredCurrency: data.preferredCurrency })
      updateUser(updated)
      setCurrSuccess(true)
    } catch (err) {
      setCurrError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to save currency.'
      )
    } finally {
      setIsCurrSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage application preferences</p>
      </div>

      {/* ── Currency & Format ─────────────────────────────────────────────── */}
      <form onSubmit={currForm.handleSubmit(onCurrSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>Set your preferred display currency (ISO 4217 code)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currError && <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{currError}</p>}
            {currSuccess && <p className="rounded-lg bg-success/10 px-4 py-2 text-sm text-success">Currency updated successfully.</p>}
            <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-4">
              <div className="flex-1 w-full sm:max-w-xs">
                <label className="block text-sm font-medium">Preferred Currency</label>
                <Input
                  {...currForm.register('preferredCurrency')}
                  placeholder="USD"
                  maxLength={3}
                  className="mt-1 uppercase"
                />
                {currForm.formState.errors.preferredCurrency && (
                  <p className="mt-1 text-sm text-destructive">{currForm.formState.errors.preferredCurrency.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Examples: USD, EUR, GBP, INR, JPY, CAD
                </p>
              </div>
              <Button type="submit" isLoading={isCurrSubmitting} className="w-full sm:w-auto">Save Currency</Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* ── Preferences form ──────────────────────────────────────────────── */}
      <form onSubmit={prefForm.handleSubmit(onPrefSubmit)} className="space-y-6">
        {prefError && (
          <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{prefError}</div>
        )}
        {prefSuccess && (
          <div className="rounded-lg bg-success/10 px-4 py-2 text-sm text-success">Preferences saved successfully.</div>
        )}

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>Choose your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium">Language</label>
              <select
                {...prefForm.register('language')}
                className="mt-1 w-full sm:w-48 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
              </select>
              {prefForm.formState.errors.language && (
                <p className="mt-1 text-sm text-destructive">{prefForm.formState.errors.language.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how FinanceOS looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium">Theme</label>
              <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => prefForm.setValue('theme', t)}
                    className={`rounded-lg border-2 px-3 sm:px-4 py-2 text-sm font-medium transition-all ${
                      currentTheme === t
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Format */}
        <Card>
          <CardHeader>
            <CardTitle>Date Format</CardTitle>
            <CardDescription>How dates are displayed across the app</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium">Date Format</label>
              <select
                {...prefForm.register('dateFormat')}
                className="mt-1 w-full sm:w-48 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailNotif}
                onClick={() => prefForm.setValue('notifications.email', !emailNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotif ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotif ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={pushNotif}
                onClick={() => prefForm.setValue('notifications.push', !pushNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushNotif ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotif ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isPrefSubmitting} className="w-full sm:w-auto">Save Preferences</Button>
        </div>
      </form>

      {/* Security - Password Change */}
      <PasswordChangeCard />

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Account management</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => logout()}>Logout</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
