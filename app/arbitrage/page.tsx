"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { BotStatus } from "@/components/bot-status"
import { OpportunitiesList } from "@/components/opportunities-list"
import { BotSettings } from "@/components/bot-settings"

export default function ArbitragePage() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>("0x1234...5678")
  const [botActive, setBotActive] = useState(false)
  const [opportunities, setOpportunities] = useState([
    {
      id: 1,
      pair: "TOKA/TOKB",
      pool1: "Pool A",
      pool2: "Pool B",
      pricePool1: 2.4532,
      pricePool2: 2.5124,
      diff: 2.42,
      profitPotential: "$156.80",
      executed: true,
      timestamp: new Date(Date.now() - 120000),
    },
  ])

  useEffect(() => {
    if (!botActive) return

    const interval = setInterval(() => {
      const newOpportunity = {
        id: Math.random(),
        pair: ["TOKA/TOKB", "TOKC/TOKD", "TOKE/TOKF"][Math.floor(Math.random() * 3)],
        pool1: `Pool ${["A", "B", "C"][Math.floor(Math.random() * 3)]}`,
        pool2: `Pool ${["B", "C", "A"][Math.floor(Math.random() * 3)]}`,
        pricePool1: 2.0 + Math.random() * 3,
        pricePool2: 2.0 + Math.random() * 3,
        diff: Math.random() * 5 - 2.5,
        profitPotential: `$${(Math.random() * 500).toFixed(2)}`,
        executed: Math.random() > 0.5,
        timestamp: new Date(),
      }

      if (Math.random() > 0.6) {
        setOpportunities((prev) => [newOpportunity, ...prev.slice(0, 19)])
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [botActive])

  return (
    <div className="min-h-screen bg-background">
      <Header connectedWallet={connectedWallet} onConnect={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Arbitrage Bot</h1>
            <p className="text-muted-foreground">Automated price monitoring and execution across pools</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Bot Status & Settings */}
            <div className="lg:col-span-1 space-y-4">
              <BotStatus active={botActive} onToggle={setBotActive} />
              <BotSettings />
            </div>

            {/* Opportunities List */}
            <div className="lg:col-span-3">
              <OpportunitiesList opportunities={opportunities} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
