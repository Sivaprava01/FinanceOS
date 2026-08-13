/**
 * Profile Page
 * User profile management, preferences, and account settings.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Loader } from '@components/ui/Loader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUpdateProfile, useUpdatePreferences } from '@/hooks/useUser';
import { useChangePassword } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form schemas
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  country: z.string().optional(),
  timeZone: z.string().optional(),
});

const preferencesSchema = z.object({
  language: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const Profile: React.FC = () => {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const updatePreferencesMutation = useUpdatePreferences();
  const changePasswordMutation = useChangePassword();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      email: user?.email || '',
      country: user?.country || '',
      timeZone: user?.timeZone || '',
    },
  });

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    values: {
      language: user?.preferences?.language || 'en',
      theme: user?.preferences?.theme || 'system',
      emailNotifications: user?.preferences?.notifications?.email || false,
      pushNotifications: user?.preferences?.notifications?.push || false,
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data: ProfileFormData) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const onUpdatePreferences = async (data: PreferencesFormData) => {
    await updatePreferencesMutation.mutateAsync({
      language: data.language,
      theme: data.theme,
      notifications: {
        email: data.emailNotifications,
        push: data.pushNotifications,
      },
    });
  };

  const onChangePassword = async (data: PasswordFormData) => {
    await changePasswordMutation.mutateAsync({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
    passwordForm.reset();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input {...profileForm.register('name')} className="mt-1" />
              {profileForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {profileForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input {...profileForm.register('email')} type="email" className="mt-1" />
              {profileForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {profileForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input
                  {...profileForm.register('country')}
                  className="mt-1"
                  placeholder="e.g., USA"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time Zone</label>
                <Input
                  {...profileForm.register('timeZone')}
                  className="mt-1"
                  placeholder="e.g., UTC-5"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Preferred Currency</label>
              <Input value={user?.preferredCurrency || 'USD'} disabled className="mt-1 bg-muted" />
            </div>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={preferencesForm.handleSubmit(onUpdatePreferences)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Language</label>
              <select
                {...preferencesForm.register('language')}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Theme</label>
              <select
                {...preferencesForm.register('theme')}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...preferencesForm.register('emailNotifications')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Email Notifications</span>
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Receive email updates about your account
              </p>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...preferencesForm.register('pushNotifications')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Push Notifications</span>
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Receive push notifications on your device
              </p>
            </div>
            <Button type="submit" disabled={updatePreferencesMutation.isPending}>
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password regularly for security</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Password</label>
              <Input {...passwordForm.register('oldPassword')} type="password" className="mt-1" />
              {passwordForm.formState.errors.oldPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordForm.formState.errors.oldPassword.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input {...passwordForm.register('newPassword')} type="password" className="mt-1" />
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                {...passwordForm.register('confirmPassword')}
                type="password"
                className="mt-1"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email Status</span>
            <Badge variant={user?.isEmailVerified ? 'default' : 'secondary'}>
              {user?.isEmailVerified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Auth Provider</span>
            <Badge variant="outline">
              {user?.provider === 'local' ? 'Email/Password' : 'Google'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Account Created</span>
            <span className="text-sm">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
