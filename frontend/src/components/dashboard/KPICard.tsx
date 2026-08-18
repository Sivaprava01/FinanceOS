import React from 'react'
import { Card, CardContent } from '@components/ui/Card'
import { cn, formatCurrency } from '@lib/utils'
import { useCurrency } from '@hooks/useCurrency'

interface KPICardProps {
  title: string
  value: number
  icon: React.ReactNode
  prefix?: string
  suffix?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  prefix,
  suffix,
  trend,
  className,
}) => {
  const { currency } = useCurrency()

  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-muted-foreground'

  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {prefix && <span>{prefix}</span>}
              {formatCurrency(value, currency)}
              {suffix && <span className="text-base font-medium"> {suffix}</span>}
            </p>
            {trend && (
              <p className={cn('mt-1 text-xs font-medium', trendColor)}>
                {trendSymbol} {trend.charAt(0).toUpperCase() + trend.slice(1)}
              </p>
            )}
          </div>
          <div className="ml-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
