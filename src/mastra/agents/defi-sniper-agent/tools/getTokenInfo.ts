import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// TEST ADDRESSES (these should have active pairs):
// WETH (Wrapped Ether): 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
// USDC: 0xa0b86a33e6fb06c29292f4a4f13af86d7b6a1b9d (if this doesn't work, try 0xA0b86a33E6FB06c29292F4a4f13af86d7B6a1b9d)
// WETH/USDC Pair: 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640

const getTokenInfo = async (input: string) => {
  // Clean up input
  const cleanedInput = input.trim().toLowerCase();
  
  let url: string;
  
  // Check if input looks like a token address (starts with 0x for Ethereum)
  if (cleanedInput.startsWith('0x')) {
    // Use tokens endpoint for token addresses
    url = `https://api.dexscreener.com/latest/dex/tokens/${cleanedInput}`;
  } else {
    // Assume it's a pair address and use pairs endpoint
    url = `https://api.dexscreener.com/latest/dex/pairs/${cleanedInput}`;
  }

  console.log(`Fetching from URL: ${url}`);
  
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`DexScreener API responded with status ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    // Handle different response structures
    let pairs;
    if (data.pairs && Array.isArray(data.pairs)) {
      pairs = data.pairs;
    } else if (data.pair) {
      pairs = [data.pair];
    } else if (data.pairs === null) {
      throw new Error(`No trading pairs found for this token address. The token might not have active liquidity pools or might not exist on tracked DEXes.`);
    } else {
      throw new Error("No pair data found in response");
    }

    if (!pairs || pairs.length === 0) {
      throw new Error("No active trading pairs found for the given input");
    }

    // Use the first pair (or the one with highest liquidity)
    const pair = pairs.sort((a: any, b: any) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];

    if (!pair) {
      throw new Error("No valid pair found");
    }

    const {
      baseToken,
      quoteToken,
      priceUsd,
      liquidity,
      volume,
      txns,
      chainId,
      dexId,
      pairAddress
    } = pair;

    // Handle different volume structures
    const volume24h = volume?.h24 || volume?.['24h'] || 0;
    
    // Handle different transaction structures
    const txns24h = txns?.h24 || txns?.['24h'] || { buys: 0, sells: 0 };

    return {
      summary: `
🔍 Token Pair: ${baseToken?.symbol || 'Unknown'}/${quoteToken?.symbol || 'Unknown'}
🏪 Exchange: ${dexId || 'Unknown'} on ${chainId || 'Unknown'}
📍 Pair Address: ${pairAddress || 'Unknown'}
💰 Price: $${priceUsd || '0'}
💧 Liquidity: $${liquidity?.usd?.toLocaleString() || '0'}
📈 24h Volume: $${typeof volume24h === 'number' ? volume24h.toLocaleString() : '0'}
📊 24h Txns: Buys: ${txns24h.buys || 0}, Sells: ${txns24h.sells || 0}
      `,
      liquidityUsd: liquidity?.usd || 0,
      buys: txns24h.buys || 0,
      sells: txns24h.sells || 0,
      volume24h: typeof volume24h === 'number' ? volume24h : 0,
      chainId: chainId || 'unknown',
      dexId: dexId || 'unknown',
      pairAddress: pairAddress || 'unknown',
      baseToken: {
        address: baseToken?.address || '',
        name: baseToken?.name || '',
        symbol: baseToken?.symbol || ''
      },
      quoteToken: {
        address: quoteToken?.address || '',
        name: quoteToken?.name || '',
        symbol: quoteToken?.symbol || ''
      }
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
};

export const getTokenInfoTool = createTool({
  id: "getTokenInfoTool",
  description: "Fetch token pair stats using DexScreener API. Accepts either a token address (0x...) or a pair address.",
  inputSchema: z.object({
    pairId: z.string().describe("DexScreener token pair address, token address, or pair ID"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    liquidityUsd: z.number(),
    buys: z.number(),
    sells: z.number(),
    volume24h: z.number(),
    chainId: z.string(),
    dexId: z.string(),
    pairAddress: z.string(),
    baseToken: z.object({
      address: z.string(),
      name: z.string(),
      symbol: z.string()
    }),
    quoteToken: z.object({
      address: z.string(),
      name: z.string(),
      symbol: z.string()
    })
  }),
  execute: async ({ context }) => {
    return await getTokenInfo(context.pairId);
  },
});

// Alternative function if you need to search by multiple parameters
export const getTokenInfoByAddress = async (tokenAddress: string, chainId?: string) => {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
  
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`DexScreener API responded with status ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      throw new Error("No pairs found for the given token address");
    }

    // Filter by chain if specified
    let pairs = data.pairs;
    if (chainId) {
      pairs = pairs.filter((pair: any) => pair.chainId === chainId);
    }

    if (pairs.length === 0) {
      throw new Error(`No pairs found for token on chain ${chainId}`);
    }

    // Return the pair with highest liquidity
    return pairs.sort((a: any, b: any) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];
  } catch (error) {
    console.error('Error fetching token info by address:', error);
    throw error;
  }
};

// Helper function to get popular tokens for testing
export const getPopularTokens = () => {
  return {
    ethereum: {
      weth: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      usdc: "0xa0b86a33e6fb06c29292f4a4f13af86d7b6a1b9d",
      usdt: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      dai: "0x6b175474e89094c44da98b954eedeac495271d0f",
      // Popular pairs
      weth_usdc_pair: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
      weth_usdt_pair: "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36"
    }
  };
};