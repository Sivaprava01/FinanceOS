import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, ShieldCheck, Clock, Globe } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Badge } from '@components/ui/Badge'
import { useAuth } from '@hooks/useAuth'
import { userService } from '@services/user.service'
import { SUPPORTED_CURRENCIES } from '@lib/utils'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  preferredCurrency: z.string().length(3, 'Currency code must be 3 characters'),
  timeZone: z.string().min(1, 'Time zone is required'),
})

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain one uppercase letter')
    .regex(/[0-9]/, 'Must contain one number'),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

const FormField: React.FC<{
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}> = ({ label, hint, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    {hint && !error && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
  </div>
)

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      avatar: user?.avatar ?? '',
      preferredCurrency: user?.preferredCurrency ?? 'USD',
      timeZone: user?.timeZone ?? 'UTC',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsProfileSubmitting(true)
    setProfileError('')
    setProfileSuccess(false)
    try {
      const updated = await userService.updateProfile({
        name: data.name,
        avatar: data.avatar || undefined,
        preferredCurrency: data.preferredCurrency,
        timeZone: data.timeZone,
      })
      updateUser(updated)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to update profile.'
      setProfileError(message)
    } finally {
      setIsProfileSubmitting(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsPasswordSubmitting(true)
    setPasswordError('')
    setPasswordSuccess(false)
    try {
      await userService.changePassword(data.oldPassword, data.newPassword)
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
      passwordForm.reset()
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to change password.'
      setPasswordError(message)
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Account Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your personal information and security credentials</p>
      </div>

      {/* Avatar + Account Info Snapshot */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold select-none">
              {user.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={user.isEmailVerified ? 'success' : 'warning'} size="sm" dot>
                {user.isEmailVerified ? 'Verified' : 'Unverified'}
              </Badge>
              <Badge variant="secondary" size="sm">
                {user.preferredCurrency}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Edit your display name, avatar, and account preferences</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {profileError && (
              <div className="rounded-lg bg-destructive/10 px-3.5 py-2 text-xs text-destructive">{profileError}</div>
            )}
            {profileSuccess && (
              <div className="rounded-lg bg-success/10 px-3.5 py-2 text-xs text-success">Profile updated successfully.</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full Name"
                error={profileForm.formState.errors.name?.message}
              >
                <Input {...profileForm.register('name')} placeholder="Your name" />
              </FormField>

              <FormField
                label="Email Address"
                hint="Email cannot be changed after registration"
              >
                <Input type="email" value={user.email} disabled className="opacity-60" />
              </FormField>

              <FormField
                label="Avatar URL"
                error={profileForm.formState.errors.avatar?.message}
                hint="Link to a profile image (optional)"
              >
                <Input {...profileForm.register('avatar')} placeholder="https://example.com/avatar.png" />
              </FormField>

              <FormField
                label="Preferred Currency"
                error={profileForm.formState.errors.preferredCurrency?.message}
                hint="Global currency for totals, balances, and charts"
              >
                <select
                  {...profileForm.register('preferredCurrency')}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Time Zone"
                error={profileForm.formState.errors.timeZone?.message}
                hint="e.g. UTC, America/New_York, Asia/Kolkata"
              >
                <Input {...profileForm.register('timeZone')} placeholder="UTC" />
              </FormField>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" isLoading={isProfileSubmitting} className="text-xs">
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Account Information */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Account metadata and provider information</CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Email Status</span>
            </div>
            <Badge variant={user.isEmailVerified ? 'success' : 'warning'} size="sm">
              {user.isEmailVerified ? 'Verified' : 'Not Verified'}
            </Badge>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Auth Provider</span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{user.provider}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Time Zone</span>
            </div>
            <span className="text-xs text-muted-foreground">{user.timeZone || 'UTC'}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Member Since</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your login credentials</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {passwordError && (
              <div className="rounded-lg bg-destructive/10 px-3.5 py-2 text-xs text-destructive">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="rounded-lg bg-success/10 px-3.5 py-2 text-xs text-success">Password changed successfully.</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Current Password"
                error={passwordForm.formState.errors.oldPassword?.message}
              >
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...passwordForm.register('oldPassword')}
                />
              </FormField>

              <FormField
                label="New Password"
                error={passwordForm.formState.errors.newPassword?.message}
                hint="Min 8 characters, one uppercase letter, one number"
              >
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...passwordForm.register('newPassword')}
                />
              </FormField>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" variant="outline" isLoading={isPasswordSubmitting} className="text-xs">
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export default Profile
