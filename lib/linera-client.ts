/**
 * Linera GraphQL Client
 * Connects to Linera node service and executes GraphQL operations
 */

export interface LineraConfig {
  rpcUrl: string;
  chainId: string;
  applicationId: string;
}

export interface PoolBalances {
  token0Balance: string;
  token1Balance: string;
}

export interface UserShares {
  shares: string;
}

export class LineraClient {
  private config: LineraConfig;
  private endpoint: string;

  constructor(config: LineraConfig) {
    this.config = config;
    this.endpoint = `${config.rpcUrl}/chains/${config.chainId}/applications/${config.applicationId}`;
  }

  /**
   * Execute a GraphQL query
   */
  private async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  /**
   * Get pool balances
   */
  async getPoolBalances(): Promise<PoolBalances> {
    const query = `
      query {
        token0Balance
        token1Balance
      }
    `;

    return this.query<PoolBalances>(query);
  }

  /**
   * Get user shares
   */
  async getUserShares(owner: string): Promise<UserShares> {
    const query = `
      query GetShares($owner: String!) {
        shares(owner: $owner)
      }
    `;

    return this.query<UserShares>(query, { owner });
  }

  /**
   * Calculate swap output amount
   */
  async calculateSwapOutput(inputTokenIdx: number, inputAmount: string): Promise<string> {
    const query = `
      query CalculateSwap($inputTokenIdx: Int!, $inputAmount: String!) {
        calculateSwapOutput(
          inputTokenIdx: $inputTokenIdx,
          inputAmount: $inputAmount
        )
      }
    `;

    const result = await this.query<{ calculateSwapOutput: string }>(query, {
      inputTokenIdx,
      inputAmount,
    });

    return result.calculateSwapOutput;
  }

  /**
   * Execute a swap operation
   */
  async swap(owner: string, inputTokenIdx: number, inputAmount: string): Promise<void> {
    const mutation = `
      mutation Swap($owner: String!, $inputTokenIdx: Int!, $inputAmount: String!) {
        swap(
          owner: $owner,
          inputTokenIdx: $inputTokenIdx,
          inputAmount: $inputAmount
        )
      }
    `;

    await this.query(mutation, { owner, inputTokenIdx, inputAmount });
  }

  /**
   * Add liquidity to the pool
   */
  async addLiquidity(
    owner: string,
    maxToken0Amount: string,
    maxToken1Amount: string
  ): Promise<void> {
    const mutation = `
      mutation AddLiquidity(
        $owner: String!,
        $maxToken0Amount: String!,
        $maxToken1Amount: String!
      ) {
        addLiquidity(
          owner: $owner,
          maxToken0Amount: $maxToken0Amount,
          maxToken1Amount: $maxToken1Amount
        )
      }
    `;

    await this.query(mutation, { owner, maxToken0Amount, maxToken1Amount });
  }

  /**
   * Remove liquidity from the pool
   */
  async removeLiquidity(
    owner: string,
    tokenToRemoveIdx: number,
    tokenToRemoveAmount: string
  ): Promise<void> {
    const mutation = `
      mutation RemoveLiquidity(
        $owner: String!,
        $tokenToRemoveIdx: Int!,
        $tokenToRemoveAmount: String!
      ) {
        removeLiquidity(
          owner: $owner,
          tokenToRemoveIdx: $tokenToRemoveIdx,
          tokenToRemoveAmount: $tokenToRemoveAmount
        )
      }
    `;

    await this.query(mutation, { owner, tokenToRemoveIdx, tokenToRemoveAmount });
  }

  /**
   * Get application parameters
   */
  async getParameters(): Promise<any> {
    const query = `
      query {
        parameters
      }
    `;

    const result = await this.query<{ parameters: string }>(query);
    return JSON.parse(result.parameters);
  }
}

/**
 * Create a Linera client instance
 */
export function createLineraClient(config?: Partial<LineraConfig>): LineraClient {
  const defaultConfig: LineraConfig = {
    rpcUrl: process.env.NEXT_PUBLIC_LINERA_RPC || 'http://localhost:8080',
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID || '',
    applicationId: process.env.NEXT_PUBLIC_DEX_APP_ID || '',
  };

  return new LineraClient({ ...defaultConfig, ...config });
}
