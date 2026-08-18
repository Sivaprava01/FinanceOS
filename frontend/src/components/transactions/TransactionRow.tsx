import React from 'react'
import type { Transaction } from '@/types'
import { useCurrency } from '@hooks/useCurrency'

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
  const { format, currency: userCurrency } = useCurrency()
  const isCredit = transaction.type === 'Credit'

  // Show foreign currency badge if this transaction has a different currency
  const isForeignCurrency =
    transaction.currency !== null &&
    transaction.currency !== undefined &&
    transaction.currency.toUpperCase() !== userCurrency.toUpperCase()

  return (
    <tr
      className={`border-b border-border hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-primary/5' : ''
      }`}
    >
      {/* Checkbox column */}
      {onSelect && (
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(transaction._id)}
            className="rounded border-border accent-primary cursor-pointer"
            aria-label={`Select ${transaction.merchant}`}
          />
        </td>
      )}

      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
        {new Date(transaction.date).toLocaleDateString()}
      </td>

      <td className="px-4 py-3">
        <p className="text-sm font-medium truncate max-w-[180px]">{transaction.merchant}</p>
        {transaction.description && (
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{transaction.description}</p>
        )}
      </td>

      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {transaction.category}
        </span>
      </td>

      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
            {isCredit ? '+' : '-'}{format(transaction.amount)}
          </span>
          {isForeignCurrency && (
            <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {transaction.currency}
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3 text-right">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isCredit ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {isCredit ? 'Income' : 'Expense'}
        </span>
      </td>

      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => onEdit(transaction)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(transaction._id)}
            className="text-xs font-medium text-destructive hover:underline"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
