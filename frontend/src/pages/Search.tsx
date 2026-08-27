import React, { useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Badge } from '@components/ui/Badge'
import { EmptyState } from '@components/ui/EmptyState'
import { useTransactions } from '@hooks/useTransactions'
import { useCurrencyConversion } from '@hooks/useCurrencyConversion'
import type { Transaction } from '@/types'

const Search: React.FC = () => {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ category: '', fromDate: '', toDate: '' })
  const { convertTransaction } = useCurrencyConversion()
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
  const activeFilterCount = (query ? 1 : 0) + (filters.category ? 1 : 0) + (filters.fromDate ? 1 : 0) + (filters.toDate ? 1 : 0)

  const clearAllFilters = () => {
    setQuery('')
    setFilters({ category: '', fromDate: '', toDate: '' })
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Transaction Search</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search across merchant names, descriptions, categories, and date ranges
          </p>
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto gap-1"
          >
            <X className="h-3.5 w-3.5" /> Clear Filters ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Filter Controls Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Main search bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by merchant, description, or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-9 pr-8 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Secondary Filter Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">From Date</label>
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">To Date</label>
              <Input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle>Results</CardTitle>
            <CardDescription className="text-xs">
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-muted/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={SearchIcon}
                title="No matching transactions"
                description={
                  activeFilterCount > 0
                    ? 'Try broadening your search query or clearing some filters.'
                    : 'No transactions are currently recorded.'
                }
                action={
                  activeFilterCount > 0
                    ? {
                        label: 'Reset Filters',
                        onClick: clearAllFilters,
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Merchant</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((t: Transaction) => {
                      const normType = (() => {
                        const raw = (t.type || 'expense').toLowerCase().trim()
                        if (raw === 'credit') return 'income'
                        if (raw === 'debit') return 'expense'
                        return raw
                      })()
                      const isIncome = normType === 'income'
                      const isAsset = normType === 'asset'
                      const isLiability = normType === 'liability'
                      const { isForeign, primaryFormatted, preferredFormatted } = convertTransaction(t.amount, t.currency)
                      return (
                        <tr key={t._id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap font-numeric">
                            {new Date(t.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  t.source === 'statement' ? 'bg-primary' : 'bg-muted-foreground/40'
                                }`}
                                title={t.source === 'statement' ? 'Imported from bank statement' : 'Manually created'}
                              />
                              <span className="truncate max-w-[180px]">{t.merchant}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            {t.category ? (
                              <Badge variant="outline" size="sm">
                                {t.category}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground truncate max-w-[240px]">
                            {t.description || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-numeric">
                            <div className="flex flex-col items-end gap-0.5">
                              <span
                                className={`text-xs font-semibold tabular-nums ${
                                  isIncome
                                    ? 'text-success'
                                    : isLiability
                                    ? 'text-amber-500'
                                    : isAsset
                                    ? 'text-primary'
                                    : 'text-foreground'
                                }`}
                              >
                                {isIncome ? '+' : '-'}{primaryFormatted}
                              </span>
                              {isForeign && preferredFormatted && (
                                <span className="text-[11px] font-medium text-muted-foreground tabular-nums" title="Converted using the latest available exchange rate">
                                  ≈ {isIncome ? '+' : ''}{preferredFormatted}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden divide-y divide-border">
                {filtered.map((t: Transaction) => {
                  const normType = (() => {
                    const raw = (t.type || 'expense').toLowerCase().trim()
                    if (raw === 'credit') return 'income'
                    if (raw === 'debit') return 'expense'
                    return raw
                  })()
                  const isIncome = normType === 'income'
                  const isAsset = normType === 'asset'
                  const isLiability = normType === 'liability'
                  const { isForeign, primaryFormatted, preferredFormatted } = convertTransaction(t.amount, t.currency)
                  return (
                    <div key={t._id} className="p-3.5 space-y-1.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                t.source === 'statement' ? 'bg-primary' : 'bg-muted-foreground/40'
                              }`}
                            />
                            <p className="font-medium text-xs text-foreground truncate">{t.merchant}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-numeric">
                            {new Date(t.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0 font-numeric">
                          <span
                            className={`text-xs font-semibold tabular-nums ${
                              isIncome
                                ? 'text-success'
                                : isLiability
                                ? 'text-amber-500'
                                : isAsset
                                ? 'text-primary'
                                : 'text-foreground'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{primaryFormatted}
                          </span>
                          {isForeign && preferredFormatted && (
                            <span className="text-[11px] font-medium text-muted-foreground tabular-nums" title="Converted using the latest available exchange rate">
                              ≈ {isIncome ? '+' : ''}{preferredFormatted}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        {t.category ? (
                          <Badge variant="outline" size="sm">
                            {t.category}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/50">—</span>
                        )}
                        {t.description && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Search
