/**
 * Settings Page
 * Account settings and linked accounts management.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDeleteAccount, useUnlinkGoogle, useUpdateProfile } from '@/hooks/useUser';

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

const Settings: React.FC = () => {
  const { data: user } = useCurrentUser();
  const deleteAccountMutation = useDeleteAccount();
  const unlinkGoogleMutation = useUnlinkGoogle();
  const updateProfileMutation = useUpdateProfile();

  const [selectedCurrency, setSelectedCurrency] = useState(user?.preferredCurrency || 'USD');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.preferredCurrency) {
      setSelectedCurrency(user.preferredCurrency);
    }
  }, [user?.preferredCurrency]);

  const handleSaveCurrency = async () => {
    if (selectedCurrency === user?.preferredCurrency) {
      return; // No changes
    }

    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        preferredCurrency: selectedCurrency,
      });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and security</p>
      </div>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your FinanceOS experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="block">
              <p className="text-sm font-medium text-foreground mb-2">Preferred Currency</p>
              <div className="flex flex-col gap-3">
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
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedCurrency} ({currencySymbol})
                </div>
              </div>
            </label>
          </div>

          {selectedCurrency !== user?.preferredCurrency && (
            <Button
              onClick={handleSaveCurrency}
              disabled={isSaving || updateProfileMutation.isPending}
              className="w-full md:w-auto"
            >
              {isSaving || updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          )}

          {updateProfileMutation.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to update currency preference. Please try again.
            </div>
          )}

          {updateProfileMutation.isSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Currency preference updated successfully.
            </div>
          )}
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

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground mt-1">
              Protect your account with two-factor authentication
            </p>
            <Button size="sm" variant="outline" className="mt-4" disabled>
              Coming Soon
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Active Sessions</p>
            <p className="text-sm text-muted-foreground mt-1">
              Manage devices that have access to your account
            </p>
            <Button size="sm" variant="outline" className="mt-4" disabled>
              Coming Soon
            </Button>
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
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-800 mt-1">
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
      <Card className="bg-blue-50">
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
