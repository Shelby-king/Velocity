"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface WalletConnectProps {
  onConnect: (wallet: string) => void
  onClose: () => void
}

export function WalletConnect({ onConnect, onClose }: WalletConnectProps) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async (walletType: string) => {
    setConnecting(true)
    // Simulate wallet connection
    await new Promise((resolve) => setTimeout(resolve, 500))
    const mockAddress = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`
    onConnect(mockAddress)
  }

  const wallets = [
    { name: "MetaMask", icon: "🦊" },
    { name: "Linera Wallet", icon: "⚡" },
    { name: "WalletConnect", icon: "📱" },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Connect Wallet</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleConnect(wallet.name)}
              disabled={connecting}
              className="w-full p-4 border border-border rounded-lg hover:bg-muted/50 transition flex items-center gap-3 disabled:opacity-50"
            >
              <span className="text-2xl">{wallet.icon}</span>
              <span className="font-medium text-foreground">{wallet.name}</span>
              {connecting && <span className="ml-auto text-muted-foreground">...</span>}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}
