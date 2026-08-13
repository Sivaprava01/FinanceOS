/**
 * Password Dialog Component
 * Prompts user for PDF password when a password-protected PDF is detected.
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Loader } from '@components/ui/Loader';

interface PasswordDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export const PasswordDialog: React.FC<PasswordDialogProps> = ({
  isOpen,
  isLoading,
  error,
  onSubmit,
  onCancel,
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (password.trim()) {
      onSubmit(password);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && password.trim()) {
      handleSubmit();
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>PDF is Password Protected</DialogTitle>
          <DialogDescription>
            This bank statement is password protected. Please enter the password to continue with the import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="pdf-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="pdf-password"
              type="password"
              placeholder="Enter PDF password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="mt-2"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error === 'PDF_PASSWORD_INCORRECT'
                ? 'Incorrect password. Please try again.'
                : error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !password.trim()}
              className="flex items-center gap-2"
            >
              {isLoading && <Loader size="sm" />}
              {isLoading ? 'Verifying...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
