/**
 * Create Family Dialog
 * Dialog for creating a new family workspace.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface CreateFamilyDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateFamilyDialog: React.FC<CreateFamilyDialogProps> = ({ onClose, onSuccess }) => {
  const [familyName, setFamilyName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // API call would go here
      // For now, just simulate success
      setTimeout(() => {
        setIsLoading(false);
        onSuccess();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Create Family Workspace</CardTitle>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Family Name *
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g., Smith Family"
                required
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Our household finances"
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!familyName.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Family'}
              </Button>
            </div>
          </form>

          <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-sm">
            <p className="font-medium mb-2">What happens next:</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li>✓ You become the family owner</li>
              <li>✓ You can invite family members</li>
              <li>✓ Set up roles and permissions</li>
              <li>✓ Start sharing finances</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateFamilyDialog;
