"use client"

interface PriceDisplayProps {
  rate: number
  from: string
  to: string
}

export function PriceDisplay({ rate, from, to }: PriceDisplayProps) {
  const isPositive = rate > 1

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-lg border border-border">
      <span className={`text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
        {rate.toFixed(4)}
      </span>
      <span className="text-xs text-muted-foreground">
        {from}/{to}
      </span>
    </div>
  )
}
