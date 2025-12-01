"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp, Wallet, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineraClient } from "@/lib/linera";

export default function DexPage() {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [token0Balance, setToken0Balance] = useState("0");
  const [token1Balance, setToken1Balance] = useState("0");
  const [poolToken0, setPoolToken0] = useState("0");
  const [poolToken1, setPoolToken1] = useState("0");

  // Swap state
  const [swapInputAmount, setSwapInputAmount] = useState("");
  const [swapOutputAmount, setSwapOutputAmount] = useState("");
  const [swapInputToken, setSwapInputToken] = useState(0);

  // Liquidity state
  const [liquidityToken0, setLiquidityToken0] = useState("");
  const [liquidityToken1, setLiquidityToken1] = useState("");
  const [removeAmount, setRemoveAmount] = useState("");
  const [removeTokenIdx, setRemoveTokenIdx] = useState(0);

  const lineraClient = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_LINERA_RPC || "http://localhost:8080";
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || "";
    const appId = process.env.NEXT_PUBLIC_DEX_APP_ID || "";
    if (!chainId || !appId) return null;
    return new LineraClient(rpcUrl, chainId, appId);
  }, []);

  const connectWallet = async () => {
    if (!lineraClient) {
      toast({
        title: "Configuration Missing",
        description: "Please configure NEXT_PUBLIC_CHAIN_ID and NEXT_PUBLIC_DEX_APP_ID",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real wallet integration, we would request the account here.
      // For now, we assume the configured chain ID is the user's chain.
      // We'll use a placeholder owner or fetch it if possible.
      // For this wave, we'll just set connected to true.
      setConnected(true);

      // We can try to fetch the owner from the chain if we had an endpoint, 
      // but for now we'll just use a placeholder or the chain ID as the "address"
      setWalletAddress(process.env.NEXT_PUBLIC_CHAIN_ID || "Connected");

      fetchPoolBalances();

      toast({
        title: "Wallet Connected",
        description: "Connected to Linera node",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const fetchPoolBalances = async () => {
    if (!lineraClient || !connected) return;
    try {
      const balances = await lineraClient.getPoolBalances();
      setPoolToken0(balances.token0Balance);
      setPoolToken1(balances.token1Balance);
    } catch (error) {
      console.error("Failed to fetch pool balances:", error);
    }
  };

  const calculateSwapOutput = async () => {
    if (!swapInputAmount || swapInputAmount === "0" || !lineraClient) {
      setSwapOutputAmount("");
      return;
    }

    try {
      // We could query the contract for exact output, but for responsiveness we can estimate locally
      // or use a query if the contract supports it.
      // The contract has `calculate_swap_output` query!
      const query = `
        query CalculateSwap($inputTokenIdx: Int!, $inputAmount: String!) {
          calculateSwapOutput(inputTokenIdx: $inputTokenIdx, inputAmount: $inputAmount)
        }
      `;
      const result = await lineraClient.query<{ calculateSwapOutput: string }>(query, {
        inputTokenIdx: swapInputToken,
        inputAmount: swapInputAmount
      });
      setSwapOutputAmount(result.calculateSwapOutput);
    } catch (error) {
      console.error("Failed to calculate output:", error);
    }
  };

  useEffect(() => {
    if (connected) {
      fetchPoolBalances();
      const interval = setInterval(fetchPoolBalances, 5000);
      return () => clearInterval(interval);
    }
  }, [connected]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateSwapOutput();
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [swapInputAmount, swapInputToken, poolToken0, poolToken1]);

  const handleSwap = async () => {
    if (!connected || !lineraClient) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!swapInputAmount || swapInputAmount === "0") {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // We need the owner. In this local setup, we might need to pass the owner explicitly.
      // If the node service is running as the owner, we can use the chain's owner.
      // But we don't know it easily.
      // However, the `linera-dex` service might not strictly enforce the owner check if we are just calling it?
      // Actually, the contract checks `check_account_permission(owner)`.
      // So we need the correct owner.
      // For local dev, if we use the chain ID as owner (which is wrong, it should be AccountOwner), it might fail.
      // But wait, `linera service` runs on behalf of the chain.
      // If we send a mutation, it's signed by the node.
      // The `owner` argument in the mutation is who is swapping.
      // We need to fetch the owner of the chain.
      // For now, let's assume the user puts the owner in .env or we query it?
      // Let's try to query `chain { executionState { system { ownership { superOwners } } } }`?
      // That's a system query.

      // FALLBACK: For now, we will use a hardcoded owner from .env or prompt user.
      const owner = process.env.NEXT_PUBLIC_OWNER_ID;
      if (!owner) {
        toast({
          title: "Configuration Error",
          description: "NEXT_PUBLIC_OWNER_ID is missing",
          variant: "destructive",
        });
        return;
      }

      await lineraClient.swap(owner, swapInputToken, swapInputAmount);

      toast({
        title: "Swap Initiated",
        description: `Swapping ${swapInputAmount} Token${swapInputToken}`,
      });

      setSwapInputAmount("");
      setSwapOutputAmount("");
      // Wait a bit for block to be processed
      setTimeout(fetchPoolBalances, 1000);
    } catch (error: any) {
      toast({
        title: "Swap Failed",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });
    }
  };

  const handleAddLiquidity = async () => {
    if (!connected || !lineraClient) return;

    if (!liquidityToken0 || !liquidityToken1) {
      toast({
        title: "Invalid Amounts",
        description: "Please enter valid amounts for both tokens",
        variant: "destructive",
      });
      return;
    }

    try {
      const owner = process.env.NEXT_PUBLIC_OWNER_ID;
      if (!owner) throw new Error("Owner ID not configured");

      await lineraClient.addLiquidity(owner, liquidityToken0, liquidityToken1);

      toast({
        title: "Liquidity Added",
        description: `Added ${liquidityToken0} Token0 and ${liquidityToken1} Token1`,
      });

      setLiquidityToken0("");
      setLiquidityToken1("");
      setTimeout(fetchPoolBalances, 1000);
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to add liquidity",
        variant: "destructive",
      });
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!connected || !lineraClient) return;

    if (!removeAmount) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const owner = process.env.NEXT_PUBLIC_OWNER_ID;
      if (!owner) throw new Error("Owner ID not configured");

      await lineraClient.removeLiquidity(owner, removeTokenIdx, removeAmount);

      toast({
        title: "Liquidity Removed",
        description: `Removed ${removeAmount} Token${removeTokenIdx}`,
      });

      setRemoveAmount("");
      setTimeout(fetchPoolBalances, 1000);
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to remove liquidity",
        variant: "destructive",
      });
    }
  };

  const [createToken0, setCreateToken0] = useState("");
  const [createToken1, setCreateToken1] = useState("");

  const handleCreatePool = async () => {
    if (!connected || !lineraClient) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!createToken0 || !createToken1) {
      toast({
        title: "Invalid Tokens",
        description: "Please enter valid application IDs for both tokens",
        variant: "destructive",
      });
      return;
    }

    try {
      await lineraClient.createPool(createToken0, createToken1);
      toast({
        title: "Pool Created",
        description: `Created pool for ${createToken0} and ${createToken1}`,
      });
      setCreateToken0("");
      setCreateToken1("");
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to create pool",
        variant: "destructive",
      });
    }
  };

  const switchTokens = () => {
    setSwapInputToken(1 - swapInputToken);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Velocity DEX
            </h1>
            <p className="text-muted-foreground">
              Simple token swaps on Linera
            </p>
          </div>

          {/* Wallet Connection */}
          <Card>
            <CardContent className="pt-6">
              {!connected ? (
                <Button onClick={connectWallet} className="w-full" size="lg">
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Connected</span>
                    <span className="text-sm font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                  {/* Balances would need to be fetched from token contracts, skipping for now */}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pool Stats */}
          {connected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pool Liquidity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Token 0 Pool</div>
                    <div className="text-2xl font-bold">{poolToken0}</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Token 1 Pool</div>
                    <div className="text-2xl font-bold">{poolToken1}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Interface */}
          <Tabs defaultValue="swap" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="swap">Swap</TabsTrigger>
              <TabsTrigger value="add">Add Liquidity</TabsTrigger>
              <TabsTrigger value="remove">Remove Liquidity</TabsTrigger>
              <TabsTrigger value="pools">Pools</TabsTrigger>
            </TabsList>

            {/* Swap Tab */}
            <TabsContent value="swap">
              <Card>
                <CardHeader>
                  <CardTitle>Swap Tokens</CardTitle>
                  <CardDescription>
                    Exchange tokens instantly with 0.3% fee
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="swap-input">
                      You Pay (Token {swapInputToken})
                    </Label>
                    <Input
                      id="swap-input"
                      type="number"
                      placeholder="0.0"
                      value={swapInputAmount}
                      onChange={(e) => setSwapInputAmount(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={switchTokens}
                      className="rounded-full"
                    >
                      <ArrowDownUp className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="swap-output">
                      You Receive (Token {1 - swapInputToken})
                    </Label>
                    <Input
                      id="swap-output"
                      type="text"
                      placeholder="0.0"
                      value={swapOutputAmount}
                      disabled
                    />
                  </div>

                  {swapOutputAmount && (
                    <div className="text-sm text-muted-foreground text-center">
                      Rate: 1 Token{swapInputToken} ≈{" "}
                      {(parseFloat(swapOutputAmount) / parseFloat(swapInputAmount || "1")).toFixed(6)}{" "}
                      Token{1 - swapInputToken}
                    </div>
                  )}

                  <Button onClick={handleSwap} className="w-full" size="lg">
                    <ArrowDownUp className="mr-2 h-5 w-5" />
                    Swap
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add Liquidity Tab */}
            <TabsContent value="add">
              <Card>
                <CardHeader>
                  <CardTitle>Add Liquidity</CardTitle>
                  <CardDescription>
                    Provide liquidity and earn trading fees
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="liquidity-token0">Token 0 Amount</Label>
                    <Input
                      id="liquidity-token0"
                      type="number"
                      placeholder="0.0"
                      value={liquidityToken0}
                      onChange={(e) => setLiquidityToken0(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liquidity-token1">Token 1 Amount</Label>
                    <Input
                      id="liquidity-token1"
                      type="number"
                      placeholder="0.0"
                      value={liquidityToken1}
                      onChange={(e) => setLiquidityToken1(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleAddLiquidity} className="w-full" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Liquidity
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Remove Liquidity Tab */}
            <TabsContent value="remove">
              <Card>
                <CardHeader>
                  <CardTitle>Remove Liquidity</CardTitle>
                  <CardDescription>
                    Withdraw your liquidity from the pool
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="remove-token">Select Token</Label>
                    <select
                      id="remove-token"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={removeTokenIdx}
                      onChange={(e) => setRemoveTokenIdx(parseInt(e.target.value))}
                    >
                      <option value={0}>Token 0</option>
                      <option value={1}>Token 1</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remove-amount">Amount to Remove</Label>
                    <Input
                      id="remove-amount"
                      type="number"
                      placeholder="0.0"
                      value={removeAmount}
                      onChange={(e) => setRemoveAmount(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleRemoveLiquidity} className="w-full" size="lg">
                    <Minus className="mr-2 h-5 w-5" />
                    Remove Liquidity
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pools Tab */}
            <TabsContent value="pools">
              <Card>
                <CardHeader>
                  <CardTitle>Create Pool</CardTitle>
                  <CardDescription>
                    Create a new liquidity pool for a token pair
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pool-token0">Token 0 Application ID</Label>
                    <Input
                      id="pool-token0"
                      placeholder="e.g. e476..."
                      value={createToken0}
                      onChange={(e) => setCreateToken0(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pool-token1">Token 1 Application ID</Label>
                    <Input
                      id="pool-token1"
                      placeholder="e.g. a892..."
                      value={createToken1}
                      onChange={(e) => setCreateToken1(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" size="lg" onClick={handleCreatePool}>
                    <Plus className="mr-2 h-5 w-5" />
                    Create Pool
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
