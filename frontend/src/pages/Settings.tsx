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
      setTimeout(() => setPrefSuccess(false), 3000)
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings & Preferences</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage interface appearance, regional preferences, and security</p>
      </div>

      {/* ── Preferences form ──────────────────────────────────────────────── */}
      <form onSubmit={prefForm.handleSubmit(onPrefSubmit)} className="space-y-6">
        {prefError && (
          <div className="rounded-lg bg-destructive/10 px-3.5 py-2 text-xs text-destructive">{prefError}</div>
        )}
        {prefSuccess && (
          <div className="rounded-lg bg-success/10 px-3.5 py-2 text-xs text-success">Preferences saved successfully.</div>
        )}

        {/* Language & Date Format */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Regional & Formatting</CardTitle>
            <CardDescription>Language and calendar presentation</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Language</label>
              <select
                {...prefForm.register('language')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date Format</label>
              <select
                {...prefForm.register('dateFormat')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/12/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/31/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Theme & Appearance</CardTitle>
            <CardDescription>Select color mode preference</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => prefForm.setValue('theme', t)}
                  className={`rounded-lg border px-4 py-2 text-xs font-semibold capitalize transition-all ${
                    currentTheme === t
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}
                >
                  {t} Theme
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Configure alerts and system updates</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            <div className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
              <div>
                <p className="text-xs font-semibold text-foreground">Email Notifications</p>
                <p className="text-[11px] text-muted-foreground">Receive digest statements and transaction summaries</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailNotif}
                onClick={() => prefForm.setValue('notifications.email', !emailNotif)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  emailNotif ? 'bg-primary' : 'bg-secondary border border-border'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-0.5 ${
                  emailNotif ? 'translate-x-4.5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
              <div>
                <p className="text-xs font-semibold text-foreground">Push Notifications</p>
                <p className="text-[11px] text-muted-foreground">Real-time alerts for imports and budget limits</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={pushNotif}
                onClick={() => prefForm.setValue('notifications.push', !pushNotif)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  pushNotif ? 'bg-primary' : 'bg-secondary border border-border'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-0.5 ${
                  pushNotif ? 'translate-x-4.5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-1">
          <Button type="submit" size="sm" isLoading={isPrefSubmitting} className="text-xs">
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Security - Password Change */}
      <PasswordChangeCard />

      {/* Account */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm text-destructive">Account Session</CardTitle>
          <CardDescription>Sign out of your active workspace</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">Signed in as <span className="font-semibold">{user?.email}</span></p>
            <p className="text-[11px] text-muted-foreground">Terminate session tokens on this browser</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => logout()} className="text-xs">
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
