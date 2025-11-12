"use client"

import Link from "next/link"
import { Menu, X, Zap } from "lucide-react"
import { useState } from "react"

interface HeaderProps {
  connectedWallet: string | null
  onConnect: () => void
}

export function Header({ connectedWallet, onConnect }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap size={20} className="text-primary-foreground" />
          </div>
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="gradient-text">VELOCITY</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
          >
            Swap
          </Link>
          <Link
            href="/liquidity"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
          >
            Liquidity
          </Link>
          <Link
            href="/arbitrage"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
          >
            Bot
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          {connectedWallet ? (
            <div className="px-4 py-2 rounded-lg border border-accent/30 bg-accent/5 text-foreground text-sm font-medium">
              {shortenAddress(connectedWallet)}
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200 font-semibold text-sm"
            >
              Connect
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border/50 p-4 space-y-3 bg-card/50">
          <Link
            href="/"
            className="block px-4 py-2 text-foreground hover:text-accent transition-colors font-medium rounded-lg hover:bg-muted/30"
          >
            Swap
          </Link>
          <Link
            href="/liquidity"
            className="block px-4 py-2 text-foreground hover:text-accent transition-colors font-medium rounded-lg hover:bg-muted/30"
          >
            Liquidity
          </Link>
          <Link
            href="/arbitrage"
            className="block px-4 py-2 text-foreground hover:text-accent transition-colors font-medium rounded-lg hover:bg-muted/30"
          >
            Bot
          </Link>
        </nav>
      )}
    </header>
  )
}
