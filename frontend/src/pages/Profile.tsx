import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useAuth } from '@hooks/useAuth'
import { userService } from '@services/user.service'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            {profileError && (
              <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                Profile updated successfully.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Full Name</label>
                <Input {...profileForm.register('name')} className="mt-1" />
                {profileForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Email</label>
                <Input type="email" value={user.email} disabled className="mt-1" />
                <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium">Avatar URL</label>
                <Input {...profileForm.register('avatar')} placeholder="https://..." className="mt-1" />
                {profileForm.formState.errors.avatar && (
                  <p className="mt-1 text-sm text-destructive">{profileForm.formState.errors.avatar.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Preferred Currency</label>
                <Input
                  {...profileForm.register('preferredCurrency')}
                  placeholder="USD"
                  maxLength={3}
                  className="mt-1 uppercase"
                />
                {profileForm.formState.errors.preferredCurrency && (
                  <p className="mt-1 text-sm text-destructive">{profileForm.formState.errors.preferredCurrency.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Time Zone</label>
                <Input {...profileForm.register('timeZone')} placeholder="UTC" className="mt-1" />
                {profileForm.formState.errors.timeZone && (
                  <p className="mt-1 text-sm text-destructive">{profileForm.formState.errors.timeZone.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isProfileSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Account details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Email Verified</p>
            <p className="text-sm text-muted-foreground">
              {user.isEmailVerified ? '✓ Verified' : '○ Not verified'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Auth Provider</p>
            <p className="text-sm capitalize text-muted-foreground">{user.provider}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Member Since</p>
            <p className="text-sm text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {passwordError && (
              <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                Password changed successfully.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium">Current Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...passwordForm.register('oldPassword')}
                className="mt-1"
              />
              {passwordForm.formState.errors.oldPassword && (
                <p className="mt-1 text-sm text-destructive">{passwordForm.formState.errors.oldPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...passwordForm.register('newPassword')}
                className="mt-1"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1 text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Min 8 characters, one uppercase letter, one number
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={isPasswordSubmitting} variant="outline">
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile
