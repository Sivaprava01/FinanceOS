import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { useAuth } from '@hooks/useAuth'
import { userService } from '@services/user.service'

const preferencesSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  theme: z.enum(['light', 'dark', 'system']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }),
})

type PreferencesFormData = z.infer<typeof preferencesSchema>

const Settings: React.FC = () => {
  const { user, updateUser, logout } = useAuth()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: user?.preferences?.language ?? 'en',
      theme: user?.preferences?.theme ?? 'system',
      notifications: {
        email: user?.preferences?.notifications?.email ?? true,
        push: user?.preferences?.notifications?.push ?? false,
      },
    },
  })

  const currentTheme = watch('theme')
  const emailNotif = watch('notifications.email')
  const pushNotif = watch('notifications.push')

  const onSubmit = async (data: PreferencesFormData) => {
    setIsSubmitting(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      const updated = await userService.updatePreferences({
        language: data.language,
        theme: data.theme,
        notifications: {
          email: data.notifications.email,
          push: data.notifications.push,
        },
      })
      updateUser(updated)
      setSaveSuccess(true)
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to save preferences.'
      setSaveError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage application preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {saveError && (
          <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
            Preferences saved successfully.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>Choose your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium">Language</label>
              <select
                {...register('language')}
                className="mt-1 w-48 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
              </select>
              {errors.language && (
                <p className="mt-1 text-sm text-destructive">{errors.language.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how FinanceOS looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium">Theme</label>
              <div className="mt-3 flex gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue('theme', t)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
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
                onClick={() => setValue('notifications.email', !emailNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotif ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotif ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
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
                onClick={() => setValue('notifications.push', !pushNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushNotif ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pushNotif ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting}>
            Save Preferences
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Account management</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => logout()}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
