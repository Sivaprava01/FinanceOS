import React from 'react'
import type { Transaction } from '@/types'
import { useDualCurrencyConversion } from '@hooks/useCurrencyConversion'
import { normalizeTransactionType } from '@lib/utils'

interface TransactionRowProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  isSelected?: boolean
  onSelect?: (id: string) => void
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
}) => {
  const normType = normalizeTransactionType(transaction.type)
  const isIncome = normType === 'income'
  const isAsset = normType === 'asset'
  const isLiability = normType === 'liability'
  const isImported = transaction.source === 'statement' || !!transaction.statementId

  const { convertTransaction } = useDualCurrencyConversion()
  const { primaryFormatted, preferredFormatted, inrFormatted, isForeign } = convertTransaction(
    transaction.amount || 0,
    transaction.currency
  )

  return (
    <tr
      className={`group border-b border-border/60 hover:bg-secondary/40 transition-colors ${
        isSelected ? 'bg-primary/5' : ''
      }`}
    >
      {/* Checkbox column */}
      {onSelect && (
        <td className="w-10 px-3 py-2.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(transaction._id)}
            className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer align-middle"
            aria-label={`Select ${transaction.merchant}`}
          />
        </td>
      )}

      {/* Date */}
      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap font-numeric">
        {new Date(transaction.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </td>

      {/* Type Badge */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            isIncome
              ? 'bg-success/15 text-success border border-success/30'
              : isAsset
              ? 'bg-primary/15 text-primary border border-primary/30'
              : isLiability
              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
              : 'bg-muted text-muted-foreground border border-border'
          }`}
        >
          {normType}
        </span>
      </td>

      {/* Merchant / Description */}
      <td className="px-3 py-2.5 min-w-[200px]">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${isImported ? 'bg-primary' : 'bg-muted-foreground/50'}`}
            title={isImported ? 'Imported from statement' : 'Manually created'}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate max-w-[220px]">
              {transaction.merchant}
            </p>
            {transaction.description && (
              <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                {transaction.description}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Category & Payment Method */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-secondary text-muted-foreground">
            {transaction.category || 'Uncategorized'}
          </span>
          {transaction.paymentMethod && (
            <span
              className="inline-flex items-center rounded bg-muted/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground uppercase"
              title={`Paid via ${transaction.paymentMethod.replace('_', ' ')}`}
            >
              {transaction.paymentMethod.replace('_', ' ')}
            </span>
          )}
        </div>
      </td>

      {/* Amount */}
      <td className="px-3 py-2.5 text-right font-numeric">
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`text-xs font-bold tabular-nums ${
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
            <span
              className="text-[11px] font-medium text-muted-foreground tabular-nums"
              title="Converted to your preferred currency"
            >
              ≈ {isIncome ? '+' : ''}{preferredFormatted}
            </span>
          )}
          {inrFormatted && (
            <span
              className="text-[10px] font-normal text-muted-foreground/80 tabular-nums"
              title="Secondary INR reference amount"
            >
              ≈ {isIncome ? '+' : ''}{inrFormatted}
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-secondary"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(transaction._id)}
            className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 rounded hover:bg-destructive/10"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
