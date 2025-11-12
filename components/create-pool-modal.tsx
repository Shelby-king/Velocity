"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface CreatePoolModalProps {
  onClose: () => void
}

export function CreatePoolModal({ onClose }: CreatePoolModalProps) {
  const [token1, setToken1] = useState("")
  const [token2, setToken2] = useState("")
  const [fee, setFee] = useState("0.3")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsCreating(false)
    onClose()
  }

  const availableTokens = ["TOKA", "TOKB", "TOKC", "TOKD", "TOKE", "TOKF", "TOKG", "TOKH"]
  const feeOptions = ["0.1%", "0.3%", "0.5%", "1%"]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Create New Pool</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Token 1 Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Token A</label>
            <select
              value={token1}
              onChange={(e) => setToken1(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none hover:border-accent/50 focus:border-accent transition"
            >
              <option value="">Select token</option>
              {availableTokens.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </div>

          {/* Token 2 Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Token B</label>
            <select
              value={token2}
              onChange={(e) => setToken2(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none hover:border-accent/50 focus:border-accent transition"
            >
              <option value="">Select token</option>
              {availableTokens.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Pool Fee</label>
            <div className="grid grid-cols-4 gap-2">
              {feeOptions.map((feeOption) => (
                <button
                  key={feeOption}
                  onClick={() => setFee(feeOption)}
                  className={`py-2 rounded-lg border transition ${
                    fee === feeOption
                      ? "bg-accent/20 border-accent text-accent"
                      : "border-border hover:border-accent/50 text-foreground"
                  }`}
                >
                  {feeOption}
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          {token1 && token2 && (
            <div className="bg-background rounded-lg p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pair</span>
                <span className="text-foreground font-semibold">
                  {token1}/{token2}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fee Tier</span>
                <span className="text-foreground font-semibold">{fee}</span>
              </div>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={!token1 || !token2 || isCreating}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isCreating ? "Creating Pool..." : "Create Pool"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          You will need to provide initial liquidity after pool creation
        </p>
      </div>
    </div>
  )
}
