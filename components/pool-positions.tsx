"use client"

export function PoolPositions() {
  const positions = [
    {
      id: 1,
      pool: "TOKA/TOKB",
      lpTokens: "42.50",
      share: "2.45%",
      earned: "12.34 TOKB",
      value: "$6,234",
    },
    {
      id: 2,
      pool: "TOKC/TOKD",
      lpTokens: "28.30",
      share: "1.20%",
      earned: "8.56 TOKD",
      value: "$3,456",
    },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Your Positions</h3>

      <div className="space-y-3">
        {positions.map((position) => (
          <div key={position.id} className="bg-background rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">{position.pool}</div>
                <div className="text-xs text-muted-foreground">{position.lpTokens} LP tokens</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">{position.value}</div>
                <div className="text-xs text-muted-foreground">{position.share}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-sm">
                <span className="text-muted-foreground">Fees earned: </span>
                <span className="text-accent font-semibold">{position.earned}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border">
        <div className="text-sm">
          <span className="text-muted-foreground">Total Value Locked: </span>
          <span className="text-foreground font-semibold">$9,690</span>
        </div>
      </div>
    </div>
  )
}
