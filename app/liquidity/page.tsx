"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { LiquidityCard } from "@/components/liquidity-card"
import { PoolPositions } from "@/components/pool-positions"

export default function LiquidityPage() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>("0x1234...5678")
  const [showWalletConnect, setShowWalletConnect] = useState(false)
  const [activeTab, setActiveTab] = useState<"add" | "remove">("add")

  return (
    <div className="min-h-screen bg-background">
      <Header connectedWallet={connectedWallet} onConnect={() => setShowWalletConnect(true)} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Liquidity Pool</h1>
            <p className="text-muted-foreground">Earn fees by providing liquidity to token pairs</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("add")}
              className={`px-4 py-3 font-medium transition ${
                activeTab === "add"
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Add Liquidity
            </button>
            <button
              onClick={() => setActiveTab("remove")}
              className={`px-4 py-3 font-medium transition ${
                activeTab === "remove"
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Remove Liquidity
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {activeTab === "add" ? <LiquidityCard type="add" /> : <LiquidityCard type="remove" />}
            </div>

            <div>
              <PoolPositions />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
