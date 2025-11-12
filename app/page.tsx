"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { SwapCard } from "@/components/swap-card"
import { PoolSelector } from "@/components/pool-selector"
import { WalletConnect } from "@/components/wallet-connect"
import { ArrowRight, Zap } from "lucide-react"

export default function Home() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null)
  const [selectedPool, setSelectedPool] = useState("TOKA/TOKB")
  const [showWalletConnect, setShowWalletConnect] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header connectedWallet={connectedWallet} onConnect={() => setShowWalletConnect(true)} />

      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {connectedWallet ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                <span className="gradient-text">Instant Token Swaps</span>
              </h1>
              <p className="text-lg text-muted-foreground">Trade on Linera with real-time liquidity pools</p>
            </div>

            <PoolSelector selectedPool={selectedPool} onPoolChange={setSelectedPool} />
            <SwapCard pool={selectedPool} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-8">
            <div className="space-y-6">
              <div className="inline-block p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <Zap size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
                  <span className="gradient-text">Next-Gen Token Trading</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Swap tokens instantly with sub-second execution on the Linera blockchain. Experience the future of
                  decentralized trading.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWalletConnect(true)}
              className="px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-bold text-lg inline-flex items-center gap-2 hover:shadow-lg hover:shadow-primary/40 transition-all duration-200"
            >
              Connect Wallet
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </main>

      {showWalletConnect && (
        <WalletConnect
          onConnect={(wallet) => {
            setConnectedWallet(wallet)
            setShowWalletConnect(false)
          }}
          onClose={() => setShowWalletConnect(false)}
        />
      )}
    </div>
  )
}
