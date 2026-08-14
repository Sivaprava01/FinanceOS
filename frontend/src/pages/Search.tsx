/**
 * Advanced Search Page
 * Global search across transactions, statements, categories, and family members.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Search, Wallet, FileText, Tag, Users } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'transaction' | 'statement' | 'category' | 'member';
  date?: string;
  amount?: number;
}

const AdvancedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'transactions' | 'statements' | 'categories' | 'members'>('all');

  // Mock search results - in real implementation, these would come from API calls
  const mockResults: SearchResult[] = [];

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];

    return mockResults.filter((result) => {
      const searchText = query.toLowerCase();
      if (activeTab === 'all') {
        return (
          result.title.toLowerCase().includes(searchText) ||
          result.subtitle.toLowerCase().includes(searchText)
        );
      } else {
        return (
          result.type === activeTab &&
          (result.title.toLowerCase().includes(searchText) ||
            result.subtitle.toLowerCase().includes(searchText))
        );
      }
    });
  }, [query, activeTab]);

  const typeIcon = {
    transaction: <Wallet className="h-4 w-4" />,
    statement: <FileText className="h-4 w-4" />,
    category: <Tag className="h-4 w-4" />,
    member: <Users className="h-4 w-4" />,
  };

  const typeLabel = {
    transaction: 'Transaction',
    statement: 'Statement',
    category: 'Category',
    member: 'Member',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Advanced Search</h1>
        <p className="text-muted-foreground">
          Search across transactions, statements, categories, and family members
        </p>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transactions, statements, categories, members..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 py-6 text-base"
              autoFocus
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {query.trim() && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </div>

          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">
                  No results found. Try a different search term.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1 text-muted-foreground">
                          {typeIcon[result.type]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{result.title}</p>
                          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                          {result.date && (
                            <p className="text-xs text-muted-foreground mt-1">{result.date}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs bg-muted px-2 py-1 rounded">
                          {typeLabel[result.type]}
                        </p>
                        {result.amount !== undefined && (
                          <p className="text-lg font-semibold mt-2">
                            ${result.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {!query.trim() && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-base">Search Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Search by merchant name to find transactions</p>
            <p>• Use category names to find expenses</p>
            <p>• Search for family member names</p>
            <p>• Use dates like "Dec 25" to find transactions</p>
            <p>• Search is case-insensitive</p>
            <p>• Results respect your privacy and family permissions</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;
