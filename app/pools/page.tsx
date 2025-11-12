"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { PoolsList } from "@/components/pools-list"
import { CreatePoolModal } from "@/components/create-pool-modal"
import { Plus } from "lucide-react"

export default function PoolsPage() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>("0x1234...5678")
  const [showCreatePool, setShowCreatePool] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header connectedWallet={connectedWallet} onConnect={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Liquidity Pools</h1>
              <p className="text-muted-foreground">View all available trading pairs and create new pools</p>
            </div>
            <button
              onClick={() => setShowCreatePool(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
            >
              <Plus size={20} />
              Create Pool
            </button>
          </div>

          <PoolsList />
        </div>
      </main>

      {showCreatePool && <CreatePoolModal onClose={() => setShowCreatePool(false)} />}
    </div>
  )
}
