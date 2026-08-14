/**
 * Settings Page
 * Account settings, preferences, and security management.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDeleteAccount, useUnlinkGoogle, useUpdateProfile } from '@/hooks/useUser';
import { useTheme } from '@/hooks/useTheme';

// Common currencies supported by the system
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
];

// Date format options
const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/25/2024)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (25/12/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-25)' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Dec 25, 2024)' },
];

// Number format options
const NUMBER_FORMATS = [
  { value: '1,000.00', label: '1,000.00 (US)' },
  { value: '1.000,00', label: '1.000,00 (EU)' },
  { value: '1 000,00', label: '1 000,00 (FR/IN)' },
];

const Settings: React.FC = () => {
  const { data: user } = useCurrentUser();
  const deleteAccountMutation = useDeleteAccount();
  const unlinkGoogleMutation = useUnlinkGoogle();
  const updateProfileMutation = useUpdateProfile();
  const { theme, setTheme } = useTheme();

  // Appearance state
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(theme || 'system');

  // Preferences state
  const [selectedCurrency, setSelectedCurrency] = useState(user?.preferredCurrency || 'USD');
  const [selectedDateFormat, setSelectedDateFormat] = useState<string>(
    user?.preferences?.dateFormat || 'MM/DD/YYYY'
  );
  const [selectedNumberFormat, setSelectedNumberFormat] = useState<string>(
    user?.preferences?.numberFormat || '1,000.00'
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.preferredCurrency) {
      setSelectedCurrency(user.preferredCurrency);
    }
    if (user?.preferences?.dateFormat) {
      setSelectedDateFormat(user.preferences.dateFormat);
    }
    if (user?.preferences?.numberFormat) {
      setSelectedNumberFormat(user.preferences.numberFormat);
    }
    setSelectedTheme(theme || 'system');
  }, [user, theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
  };

  const handleSavePreferences = async () => {
    const hasChanges =
      selectedCurrency !== user?.preferredCurrency ||
      selectedDateFormat !== user?.preferences?.dateFormat ||
      selectedNumberFormat !== user?.preferences?.numberFormat;

    if (!hasChanges) {
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfileMutation.mutateAsync({
        preferredCurrency: selectedCurrency,
        preferences: {
          dateFormat: selectedDateFormat,
          numberFormat: selectedNumberFormat,
          theme: selectedTheme,
          notifications: user?.preferences?.notifications || { email: false, push: false },
          language: user?.preferences?.language || 'en',
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be lost.'
      )
    ) {
      deleteAccountMutation.mutate();
    }
  };

  const currencySymbol =
    CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || selectedCurrency;

  const hasPreferenceChanges =
    selectedCurrency !== user?.preferredCurrency ||
    selectedDateFormat !== user?.preferences?.dateFormat ||
    selectedNumberFormat !== user?.preferences?.numberFormat;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and security</p>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how FinanceOS looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block">
              <p className="text-sm font-medium text-foreground mb-3">Theme</p>
              <div className="flex gap-3 flex-wrap">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={`px-4 py-2 rounded-lg border transition-colors capitalize ${
                      selectedTheme === t
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-foreground hover:border-primary'
                    }`}
                  >
                    {t === 'light' && '☀️ Light'}
                    {t === 'dark' && '🌙 Dark'}
                    {t === 'system' && '🖥️ System'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedTheme === 'system'
                  ? 'Follows your system settings'
                  : `Currently set to ${selectedTheme}`}
              </p>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your FinanceOS experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency */}
          <div className="space-y-3">
            <label className="block">
              <p className="text-sm font-medium text-foreground mb-2">Preferred Currency</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => setSelectedCurrency(currency.code)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedCurrency === currency.code
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-foreground hover:border-primary'
                    }`}
                  >
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-xs opacity-75">{currency.symbol}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {selectedCurrency} ({currencySymbol})
              </p>
            </label>
          </div>

          {/* Date Format */}
          <div className="space-y-3">
            <label className="block">
              <p className="text-sm font-medium text-foreground mb-2">Date Format</p>
              <select
                value={selectedDateFormat}
                onChange={(e) => setSelectedDateFormat(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
              >
                {DATE_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Number Format */}
          <div className="space-y-3">
            <label className="block">
              <p className="text-sm font-medium text-foreground mb-2">Number Format</p>
              <select
                value={selectedNumberFormat}
                onChange={(e) => setSelectedNumberFormat(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
              >
                {NUMBER_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasPreferenceChanges && (
            <Button
              onClick={handleSavePreferences}
              disabled={isSaving || updateProfileMutation.isPending}
              className="w-full md:w-auto"
            >
              {isSaving || updateProfileMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          )}

          {updateProfileMutation.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to update preferences. Please try again.
            </div>
          )}

          {saveSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-400">
              Preferences updated successfully.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Notification preferences and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
              <input
                type="checkbox"
                disabled
                defaultChecked={user?.preferences?.notifications?.email || false}
                className="h-4 w-4 rounded"
              />
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
              <input
                type="checkbox"
                disabled
                defaultChecked={user?.preferences?.notifications?.push || false}
                className="h-4 w-4 rounded"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Full notification settings coming soon
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="font-medium">Password</p>
            <p className="text-sm text-muted-foreground mt-1">
              Change your account password
            </p>
            <Button size="sm" variant="outline" className="mt-4" disabled>
              Change Password
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground mt-1">
              Protect your account with two-factor authentication
            </p>
            <Button size="sm" variant="outline" className="mt-4" disabled>
              Enable 2FA
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Active Sessions</p>
            <p className="text-sm text-muted-foreground mt-1">
              Manage devices that have access to your account
            </p>
            <Button size="sm" variant="outline" className="mt-4" disabled>
              View Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>Connect external accounts to your FinanceOS account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Google Account</p>
              <p className="text-sm text-muted-foreground">
                {user?.provider === 'google' ? 'Connected via Google' : 'Link your Google account'}
              </p>
            </div>
            <div className="space-x-2">
              {user?.provider === 'google' ? (
                <>
                  <Badge variant="default">Connected</Badge>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => unlinkGoogleMutation.mutate()}
                    disabled={unlinkGoogleMutation.isPending}
                  >
                    Unlink
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  Coming Soon
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>Control your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="font-medium">Export Your Data</p>
            <p className="text-sm text-muted-foreground mt-1">
              Download a copy of your personal data in JSON format
            </p>
            <Button size="sm" variant="outline" className="mt-4" disabled>
              Export Data
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Download Transactions</p>
            <p className="text-sm text-muted-foreground mt-1">
              Export your transaction history as CSV
            </p>
            <Button size="sm" variant="outline" className="mt-4" disabled>
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
        <CardHeader>
          <CardTitle className="text-red-900 dark:text-red-400">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-red-900 dark:text-red-400">Delete Account</p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-blue-50 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Contact our support team for assistance</p>
          <p>
            Email:{' '}
            <a href="mailto:support@financeos.com" className="text-blue-600 hover:underline">
              support@financeos.com
            </a>
          </p>
          <p>
            Documentation:{' '}
            <a href="/how-it-works" className="text-blue-600 hover:underline">
              How It Works
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
