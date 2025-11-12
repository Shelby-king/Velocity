"use client"

import { ArrowRight, CheckCircle, Clock } from "lucide-react"

interface Opportunity {
  id: number
  pair: string
  pool1: string
  pool2: string
  pricePool1: number
  pricePool2: number
  diff: number
  profitPotential: string
  executed: boolean
  timestamp: Date
}

interface OpportunitiesListProps {
  opportunities: Opportunity[]
}

export function OpportunitiesList({ opportunities }: OpportunitiesListProps) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-6 gap-4 p-4 bg-background/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div>Pair</div>
        <div>Price Diff</div>
        <div>Pool 1 → Pool 2</div>
        <div className="text-right">Profit</div>
        <div className="text-right">Status</div>
        <div className="text-right">Time</div>
      </div>

      {/* Opportunities */}
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {opportunities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No arbitrage opportunities detected yet</div>
        ) : (
          opportunities.map((opp) => (
            <div key={opp.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-background/50 transition items-center">
              <div>
                <div className="font-semibold text-foreground">{opp.pair}</div>
                <div className="text-xs text-muted-foreground">
                  {opp.pool1} ↔ {opp.pool2}
                </div>
              </div>
              <div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    opp.diff > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {opp.diff > 0 ? "+" : ""}
                  {opp.diff.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-mono text-foreground">{opp.pricePool1.toFixed(4)}</div>
                <ArrowRight size={16} className="text-muted-foreground" />
                <div className="text-sm font-mono text-foreground">{opp.pricePool2.toFixed(4)}</div>
              </div>
              <div className="text-right font-semibold text-green-500">{opp.profitPotential}</div>
              <div className="text-right">
                {opp.executed ? (
                  <div className="flex items-center justify-end gap-1 text-green-500">
                    <CheckCircle size={16} />
                    <span className="text-xs font-semibold">Done</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1 text-yellow-500">
                    <Clock size={16} />
                    <span className="text-xs font-semibold">Pending</span>
                  </div>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">{formatTime(opp.timestamp)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
