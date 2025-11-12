"use client"

import Link from "next/link"
import { TrendingUp, TrendingDown } from "lucide-react"

export function PoolsList() {
  const pools = [
    {
      id: 1,
      pair: "TOKA/TOKB",
      tvl: "$2,500,000",
      volume24h: "$450,000",
      fees24h: "$1,350",
      apr: "18.5%",
      change: 5.2,
      poolFee: "0.3%",
    },
    {
      id: 2,
      pair: "TOKC/TOKD",
      tvl: "$1,200,000",
      volume24h: "$280,000",
      fees24h: "$840",
      apr: "22.4%",
      change: -2.1,
      poolFee: "0.3%",
    },
    {
      id: 3,
      pair: "TOKE/TOKF",
      tvl: "$850,000",
      volume24h: "$120,000",
      fees24h: "$360",
      apr: "15.8%",
      change: 3.7,
      poolFee: "0.5%",
    },
    {
      id: 4,
      pair: "TOKG/TOKH",
      tvl: "$650,000",
      volume24h: "$85,000",
      fees24h: "$255",
      apr: "14.2%",
      change: -1.5,
      poolFee: "0.3%",
    },
  ]

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-6 gap-4 p-4 bg-background/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div>Pair</div>
        <div className="text-right">TVL</div>
        <div className="text-right">24h Volume</div>
        <div className="text-right">24h Fees</div>
        <div className="text-right">APR</div>
        <div className="text-right">Change</div>
      </div>

      {/* Pools */}
      <div className="divide-y divide-border">
        {pools.map((pool) => (
          <Link
            key={pool.id}
            href={`/pools/${pool.pair.toLowerCase()}`}
            className="grid grid-cols-6 gap-4 p-4 hover:bg-background/50 transition items-center"
          >
            <div>
              <div className="font-semibold text-foreground">{pool.pair}</div>
              <div className="text-xs text-muted-foreground">{pool.poolFee} fee</div>
            </div>
            <div className="text-right font-mono text-foreground">{pool.tvl}</div>
            <div className="text-right font-mono text-foreground">{pool.volume24h}</div>
            <div className="text-right font-mono text-foreground">{pool.fees24h}</div>
            <div className="text-right">
              <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-semibold">{pool.apr}</span>
            </div>
            <div className="text-right flex items-center justify-end gap-1">
              {pool.change >= 0 ? (
                <TrendingUp size={16} className="text-green-500" />
              ) : (
                <TrendingDown size={16} className="text-red-500" />
              )}
              <span className={pool.change >= 0 ? "text-green-500" : "text-red-500"}>
                {pool.change > 0 ? "+" : ""}
                {pool.change}%
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
