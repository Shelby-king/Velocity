
export class LineraClient {
  private rpcUrl: string;
  private chainId: string;
  private applicationId: string;

  constructor(rpcUrl: string, chainId: string, applicationId: string) {
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
    this.applicationId = applicationId;
  }

  async query<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const response = await fetch(`${this.rpcUrl}/chains/${this.chainId}/applications/${this.applicationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    return result.data;
  }

  async mutation<T>(mutation: string, variables: Record<string, any> = {}): Promise<T> {
    return this.query<T>(mutation, variables);
  }

  async getPoolBalances(): Promise<{ token0Balance: string; token1Balance: string }> {
    const query = `
      query {
        token0Balance
        token1Balance
      }
    `;
    return this.query(query);
  }

  async swap(owner: string, inputTokenIdx: number, inputAmount: string): Promise<void> {
    const mutation = `
      mutation Swap($owner: AccountOwner!, $inputTokenIdx: Int!, $inputAmount: String!) {
        swap(owner: $owner, inputTokenIdx: $inputTokenIdx, inputAmount: $inputAmount)
      }
    `;
    await this.mutation(mutation, { owner, inputTokenIdx, inputAmount });
  }

  async addLiquidity(owner: string, maxToken0Amount: string, maxToken1Amount: string): Promise<void> {
    const mutation = `
      mutation AddLiquidity($owner: AccountOwner!, $maxToken0Amount: String!, $maxToken1Amount: String!) {
        addLiquidity(owner: $owner, maxToken0Amount: $maxToken0Amount, maxToken1Amount: $maxToken1Amount)
      }
    `;
    await this.mutation(mutation, { owner, maxToken0Amount, maxToken1Amount });
  }

  async removeLiquidity(owner: string, tokenToRemoveIdx: number, tokenToRemoveAmount: string): Promise<void> {
    const mutation = `
      mutation RemoveLiquidity($owner: AccountOwner!, $tokenToRemoveIdx: Int!, $tokenToRemoveAmount: String!) {
        removeLiquidity(owner: $owner, tokenToRemoveIdx: $tokenToRemoveIdx, tokenToRemoveAmount: $tokenToRemoveAmount)
      }
    `;
    await this.mutation(mutation, { owner, tokenToRemoveIdx, tokenToRemoveAmount });
  }

  async createPool(token0: string, token1: string): Promise<void> {
    const mutation = `
      mutation CreatePool($token0: ApplicationId!, $token1: ApplicationId!) {
        createPool(token0: $token0, token1: $token1)
      }
    `;
    await this.mutation(mutation, { token0, token1 });
  }

  async getPool(token0: string, token1: string): Promise<string | null> {
    const query = `
      query GetPool($token0: ApplicationId!, $token1: ApplicationId!) {
        getPool(token0: $token0, token1: $token1)
      }
    `;
    const result = await this.query<{ getPool: string | null }>(query, { token0, token1 });
    return result.getPool;
  }
}
