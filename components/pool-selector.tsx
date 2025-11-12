"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface PoolSelectorProps {
  selectedPool: string
  onPoolChange: (pool: string) => void
}

export function PoolSelector({ selectedPool, onPoolChange }: PoolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const pools = [
    { name: "TOKA/TOKB", tvl: "$2.5M", volume24h: "$450K" },
    { name: "TOKC/TOKD", tvl: "$1.2M", volume24h: "$280K" },
    { name: "TOKE/TOKF", tvl: "$850K", volume24h: "$120K" },
  ]

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-accent/50 transition"
      >
        <div className="text-left">
          <div className="text-sm text-muted-foreground">Current Pool</div>
          <div className="text-lg font-semibold text-foreground">{selectedPool}</div>
        </div>
        <ChevronDown size={20} className={`transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {pools.map((pool) => (
            <button
              key={pool.name}
              onClick={() => {
                onPoolChange(pool.name)
                setIsOpen(false)
              }}
              className={`w-full p-4 text-left hover:bg-background/50 transition border-b border-border last:border-b-0 ${
                selectedPool === pool.name ? "bg-background/50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">{pool.name}</span>
                {selectedPool === pool.name && <span className="text-accent">✓</span>}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>TVL: {pool.tvl}</div>
                <div>24h Volume: {pool.volume24h}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
