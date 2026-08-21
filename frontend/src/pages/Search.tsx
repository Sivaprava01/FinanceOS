import React, { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useTransactions } from '@hooks/useTransactions'
import { useCurrency } from '@hooks/useCurrency'
import type { Transaction } from '@/types'

const Search: React.FC = () => {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ category: '', fromDate: '', toDate: '' })
  const { format } = useCurrency()
  const { data: result, isLoading } = useTransactions()
  const allTransactions = result?.transactions ?? []

  const filtered = allTransactions.filter((t: Transaction) => {
    const matchesQuery =
      query === '' ||
      t.merchant.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(query.toLowerCase()))

    const matchesCategory = filters.category === '' || t.category === filters.category

    const txDate = new Date(t.date).getTime()
    const fromMatch = filters.fromDate === '' || txDate >= new Date(filters.fromDate).getTime()
    const toMatch = filters.toDate === '' || txDate <= new Date(filters.toDate).getTime()

    return matchesQuery && matchesCategory && fromMatch && toMatch
  })

  const categories = Array.from(new Set(allTransactions.map((t: Transaction) => t.category).filter(Boolean)))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Search Transactions</h1>
        <p className="text-muted-foreground text-sm">Find transactions by merchant, description, or category</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <Input
              placeholder="Search by merchant, description, or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <Input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setQuery('')
              setFilters({ category: '', fromDate: '', toDate: '' })
            }}
            className="w-full sm:w-auto"
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>{filtered.length} transactions found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Desktop table - hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Merchant</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t: Transaction) => (
                      <tr key={t._id} className="border-b border-border/50">
                        <td className="py-3">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="py-3 font-medium">{t.merchant}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t.category || '—'}</span>
                        </td>
                        <td className="py-3 text-muted-foreground">{t.description}</td>
                        <td className={`py-3 text-right font-semibold ${t.type === 'Debit' ? 'text-destructive' : 'text-success'}`}>
                          {t.type === 'Debit' ? '-' : '+'}{format(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout - shown on mobile */}
              <div className="md:hidden space-y-3">
                {filtered.map((t: Transaction) => (
                  <div key={t._id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{t.merchant}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                      <p className={`text-sm font-semibold whitespace-nowrap ${t.type === 'Debit' ? 'text-destructive' : 'text-success'}`}>
                        {t.type === 'Debit' ? '-' : '+'}{format(t.amount)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
                      <span className="rounded-full bg-muted px-2 py-0.5">{t.category || '—'}</span>
                      <span className="text-xs">{t.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Search
