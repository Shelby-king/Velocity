"use client"

import { Power, AlertCircle, CheckCircle } from "lucide-react"

interface BotStatusProps {
  active: boolean
  onToggle: (active: boolean) => void
}

export function BotStatus({ active, onToggle }: BotStatusProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Bot Status</h3>

      {/* Status Indicator */}
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border ${
          active ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
        }`}
      >
        {active ? (
          <>
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 font-semibold">Active</span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-red-500 font-semibold">Inactive</span>
          </>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => onToggle(!active)}
        className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
          active ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
        }`}
      >
        <Power size={18} />
        {active ? "Disable Bot" : "Enable Bot"}
      </button>

      {/* Stats */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Today's Trades</span>
          <span className="font-semibold text-foreground">24</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Profit</span>
          <span className="font-semibold text-green-500">$2,450.32</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Success Rate</span>
          <span className="font-semibold text-accent">94.2%</span>
        </div>
      </div>

      {/* Activity */}
      <div className="pt-3 border-t border-border space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase">Recent Activity</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
            <span className="text-muted-foreground">Trade executed 2m ago</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle size={14} className="text-yellow-500 flex-shrink-0" />
            <span className="text-muted-foreground">Opportunity detected</span>
          </div>
        </div>
      </div>
    </div>
  )
}
