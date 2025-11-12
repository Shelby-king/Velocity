"use client"

import { useState, useEffect } from "react"
import { ArrowDownUp, TrendingUp } from "lucide-react"

interface SwapCardProps {
  pool: string
}

export function SwapCard({ pool }: SwapCardProps) {
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [prices, setPrices] = useState({ from: 1.0, to: 1.0, rate: 1.0 })

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => ({
        ...prev,
        rate: prev.rate + (Math.random() - 0.5) * 0.1,
      }))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSwap = async () => {
    if (!fromAmount) return
    setIsSwapping(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSwapping(false)
    setFromAmount("")
    setToAmount("")
  }

  const handleAmountChange = (value: string) => {
    setFromAmount(value)
    if (value) {
      setToAmount((Number.parseFloat(value) * prices.rate).toFixed(6))
    } else {
      setToAmount("")
    }
  }

  const [token1, token2] = pool.split("/")

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6 glow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold tracking-tight">Swap Tokens</h3>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-semibold text-accent">Live</span>
        </div>
      </div>

      {/* From Token */}
      <div className="bg-background/50 rounded-xl p-5 space-y-3 border border-border/30">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</label>
          <span className="text-xs text-muted-foreground">Balance: 100.00</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="0.00"
            value={fromAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="flex-1 bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
          <div className="px-4 py-2 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-primary/30 backdrop-blur">
            <span className="font-bold text-foreground text-sm">{token1}</span>
          </div>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center">
        <button className="p-3 bg-accent/10 hover:bg-accent/20 rounded-full transition-all duration-200 border border-accent/30 hover:border-accent/50 group">
          <ArrowDownUp size={20} className="text-accent group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* To Token */}
      <div className="bg-background/50 rounded-xl p-5 space-y-3 border border-border/30">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To (estimated)</label>
          <span className="text-xs text-muted-foreground">Balance: 50.00</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="0.00"
            value={toAmount}
            disabled
            className="flex-1 bg-transparent text-3xl font-bold text-foreground/70 placeholder:text-muted-foreground/40 outline-none"
          />
          <div className="px-4 py-2 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-primary/30 backdrop-blur">
            <span className="font-bold text-foreground text-sm">{token2}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSwap}
        disabled={!fromAmount || isSwapping}
        className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {isSwapping ? "Processing..." : "Swap Now"}
      </button>

      {/* Trade Details */}
      {fromAmount && (
        <div className="bg-background/30 rounded-xl p-4 space-y-3 border border-border/30 backdrop-blur">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp size={16} />
              <span>Exchange Rate</span>
            </div>
            <span className="font-semibold text-foreground">
              1 {token1} = {prices.rate.toFixed(6)} {token2}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Slippage Tolerance</span>
            <span className="font-semibold text-foreground">0.5%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="font-semibold text-accent">~0.02 USDC</span>
          </div>
        </div>
      )}
    </div>
  )
}
