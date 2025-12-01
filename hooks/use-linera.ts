/**
 * React hooks for Linera DEX integration
 */

import { useState, useEffect, useCallback } from 'react';
import { createLineraClient, LineraConfig } from '@/lib/linera-client';

export interface UseLineraOptions extends Partial<LineraConfig> {
  autoConnect?: boolean;
  pollInterval?: number;
}

export function useLinera(options: UseLineraOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ReturnType<typeof createLineraClient> | null>(null);

  useEffect(() => {
    if (options.autoConnect) {
      connect();
    }
  }, [options.autoConnect]);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const lineraClient = createLineraClient(options);
      
      // Test connection by fetching parameters
      await lineraClient.getParameters();
      
      setClient(lineraClient);
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const disconnect = useCallback(() => {
    setClient(null);
    setConnected(false);
    setError(null);
  }, []);

  return {
    client,
    connected,
    loading,
    error,
    connect,
    disconnect,
  };
}

export function usePoolBalances(options: UseLineraOptions = {}) {
  const { client, connected } = useLinera(options);
  const [balances, setBalances] = useState({ token0: '0', token1: '0' });
  const [loading, setLoading] = useState(false);
  const pollInterval = options.pollInterval || 5000;

  const fetchBalances = useCallback(async () => {
    if (!client || !connected) return;

    setLoading(true);
    try {
      const data = await client.getPoolBalances();
      setBalances({
        token0: data.token0Balance,
        token1: data.token1Balance,
      });
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setLoading(false);
    }
  }, [client, connected]);

  useEffect(() => {
    if (connected) {
      fetchBalances();
      const interval = setInterval(fetchBalances, pollInterval);
      return () => clearInterval(interval);
    }
  }, [connected, fetchBalances, pollInterval]);

  return {
    balances,
    loading,
    refetch: fetchBalances,
  };
}

export function useSwap(options: UseLineraOptions = {}) {
  const { client, connected } = useLinera(options);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateOutput = useCallback(
    async (inputTokenIdx: number, inputAmount: string) => {
      if (!client || !connected) return null;

      try {
        return await client.calculateSwapOutput(inputTokenIdx, inputAmount);
      } catch (err) {
        console.error('Failed to calculate output:', err);
        return null;
      }
    },
    [client, connected]
  );

  const executeSwap = useCallback(
    async (owner: string, inputTokenIdx: number, inputAmount: string) => {
      if (!client || !connected) {
        throw new Error('Not connected to Linera');
      }

      setLoading(true);
      setError(null);

      try {
        await client.swap(owner, inputTokenIdx, inputAmount);
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Swap failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [client, connected]
  );

  return {
    calculateOutput,
    executeSwap,
    loading,
    error,
  };
}

export function useLiquidity(options: UseLineraOptions = {}) {
  const { client, connected } = useLinera(options);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLiquidity = useCallback(
    async (owner: string, token0Amount: string, token1Amount: string) => {
      if (!client || !connected) {
        throw new Error('Not connected to Linera');
      }

      setLoading(true);
      setError(null);

      try {
        await client.addLiquidity(owner, token0Amount, token1Amount);
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add liquidity';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [client, connected]
  );

  const removeLiquidity = useCallback(
    async (owner: string, tokenIdx: number, amount: string) => {
      if (!client || !connected) {
        throw new Error('Not connected to Linera');
      }

      setLoading(true);
      setError(null);

      try {
        await client.removeLiquidity(owner, tokenIdx, amount);
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to remove liquidity';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [client, connected]
  );

  return {
    addLiquidity,
    removeLiquidity,
    loading,
    error,
  };
}
