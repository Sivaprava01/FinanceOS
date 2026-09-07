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
      ? 'text-success bg-success/10'
      : trend === 'down'
        ? 'text-destructive bg-destructive/10'
        : 'text-muted-foreground bg-muted'

  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'

  return (
    <Card className={cn('overflow-hidden transition-all duration-150 hover:border-border/80', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">{title}</p>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {prefix && <span>{prefix}</span>}
              {formatCurrency(value, currency)}
              {suffix && <span className="text-xs font-medium text-muted-foreground"> {suffix}</span>}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold', trendColor)}>
                  {trendSymbol} {trend.charAt(0).toUpperCase() + trend.slice(1)}
                </span>
                <span className="text-[11px] text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
