"use client"

import { Settings } from "lucide-react"
import { useState } from "react"

export function BotSettings() {
  const [minProfit, setMinProfit] = useState("50")
  const [maxSlippage, setMaxSlippage] = useState("1.5")
  const [gasLimit, setGasLimit] = useState("500000")

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Settings size={18} className="text-accent" />
        <h3 className="text-lg font-semibold text-foreground">Settings</h3>
      </div>

      <div className="space-y-3">
        {/* Min Profit */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase">Min Profit ($)</label>
          <input
            type="number"
            value={minProfit}
            onChange={(e) => setMinProfit(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none hover:border-accent/50 focus:border-accent transition"
            min="0"
            step="10"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Only execute if profit {">"}= ${minProfit}
          </div>
        </div>

        {/* Max Slippage */}
        <div className="pt-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">Max Slippage (%)</label>
          <input
            type="number"
            value={maxSlippage}
            onChange={(e) => setMaxSlippage(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none hover:border-accent/50 focus:border-accent transition"
            min="0.1"
            step="0.1"
          />
          <div className="text-xs text-muted-foreground mt-1">Maximum acceptable slippage: {maxSlippage}%</div>
        </div>

        {/* Gas Limit */}
        <div className="pt-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">Gas Limit</label>
          <input
            type="number"
            value={gasLimit}
            onChange={(e) => setGasLimit(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none hover:border-accent/50 focus:border-accent transition"
            min="100000"
            step="50000"
          />
          <div className="text-xs text-muted-foreground mt-1">Transaction gas limit</div>
        </div>
      </div>

      <button className="w-full py-2 mt-3 bg-secondary/20 text-accent rounded-lg hover:bg-secondary/30 transition font-medium text-sm">
        Save Settings
      </button>
    </div>
  )
}
