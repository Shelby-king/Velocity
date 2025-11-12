"use client"

import { useState } from "react"

interface LiquidityCardProps {
  type: "add" | "remove"
}

export function LiquidityCard({ type }: LiquidityCardProps) {
  const [token1Amount, setToken1Amount] = useState("")
  const [token2Amount, setToken2Amount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMaxClick = (token: 1 | 2) => {
    if (token === 1) {
      setToken1Amount("100.00")
      setToken2Amount("50.00")
    } else {
      setToken2Amount("50.00")
      setToken1Amount("100.00")
    }
  }

  const handleSubmit = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsProcessing(false)
    setToken1Amount("")
    setToken2Amount("")
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{type === "add" ? "Add Liquidity" : "Remove Liquidity"}</h3>

      {/* Token 1 */}
      <div className="bg-background rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">Token A</label>
          <button onClick={() => handleMaxClick(1)} className="text-xs text-accent hover:underline">
            Max
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="0.00"
            value={token1Amount}
            onChange={(e) => setToken1Amount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="px-3 py-2 bg-secondary/20 rounded-lg border border-secondary/30 cursor-pointer hover:border-secondary/50 transition">
            <span className="font-semibold text-foreground">TOKA</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Balance: 100.00 TOKA</div>
      </div>

      {/* Add/Remove Indicator */}
      <div className="flex justify-center">
        <div className="px-3 py-2 bg-secondary/20 rounded-lg border border-secondary/30">
          <span className="text-muted-foreground">{type === "add" ? "+" : "-"}</span>
        </div>
      </div>

      {/* Token 2 */}
      <div className="bg-background rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">Token B</label>
          <button onClick={() => handleMaxClick(2)} className="text-xs text-accent hover:underline">
            Max
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="0.00"
            value={token2Amount}
            onChange={(e) => setToken2Amount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="px-3 py-2 bg-secondary/20 rounded-lg border border-secondary/30 cursor-pointer hover:border-secondary/50 transition">
            <span className="font-semibold text-foreground">TOKB</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Balance: 50.00 TOKB</div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!token1Amount || !token2Amount || isProcessing}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : type === "add" ? "Provide Liquidity" : "Remove Liquidity"}
      </button>

      {/* Fee Info */}
      {token1Amount && (
        <div className="bg-background rounded-lg p-3 text-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Your Share</span>
            <span>2.45%</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Pool Fee Tier</span>
            <span>0.3%</span>
          </div>
          <div className="flex items-center justify-between text-foreground font-semibold pt-2 border-t border-border">
            <span>Estimated LP Tokens</span>
            <span>42.50 LP</span>
          </div>
        </div>
      )}
    </div>
  )
}
