import React from 'react'
import type { Transaction } from '@/types'

interface TransactionRowProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, onEdit, onDelete }) => {
  const isCredit = transaction.type === 'Credit'

  return (
    <tr className="border-b border-border hover:bg-muted/50">
      <td className="px-4 py-3 text-sm">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium">{transaction.merchant}</p>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {transaction.category}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
          {isCredit ? '+' : '-'}${transaction.amount.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isCredit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {transaction.type}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(transaction)}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(transaction._id)}
            className="text-xs text-destructive hover:underline"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
