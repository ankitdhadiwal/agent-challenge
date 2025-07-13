import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// CORRECT DEXSCREENER API ENDPOINTS (Based on official docs):
// 1. Get pairs by chain and address: https://api.dexscreener.com/latest/dex/pairs/{chainId}/{pairAddress}
// 2. Get token pairs: https://api.dexscreener.com/latest/dex/tokens/{tokenAddress}
// 3. Search pairs: https://api.dexscreener.com/latest/dex/search/?q={query}

// SUPPORTED CHAINS (commonly used):
const SUPPORTED_CHAINS: Record<string, string> = {
  'ethereum': 'ethereum',
  'eth': 'ethereum',
  'solana': 'solana',
  'sol': 'solana',
  'bsc': 'bsc',
  'bnb': 'bsc',
  'polygon': 'polygon',
  'matic': 'polygon',
  'arbitrum': 'arbitrum',
  'arb': 'arbitrum',
  'optimism': 'optimism',
  'op': 'optimism',
  'avalanche': 'avalanche',
  'avax': 'avalanche',
  'fantom': 'fantom',
  'ftm': 'fantom',
  'cronos': 'cronos',
  'cro': 'cronos',
  'harmony': 'harmony',
  'one': 'harmony',
  'moonbeam': 'moonbeam',
  'glmr': 'moonbeam',
  'moonriver': 'moonriver',
  'movr': 'moonriver',
  'base': 'base'
};

// Function to detect chain from address format
const detectChain = (address: string): string => {
  // Ethereum-like chains (42 chars with 0x)
  if (address.startsWith('0x') && address.length === 42) {
    return 'ethereum'; // Default to ethereum for 0x addresses
  }
  
  // Solana addresses (32-44 chars, base58)
  if (address.length >= 32 && address.length <= 44 && !address.startsWith('0x')) {
    return 'solana';
  }
  
  return 'ethereum'; // Default fallback
};

// Function to normalize chain name
const normalizeChain = (chain: string): string => {
  return SUPPORTED_CHAINS[chain.toLowerCase()] || chain.toLowerCase();
};

const getTokenInfo = async (input: string, chainHint?: string) => {
  const cleanedInput = input.trim();
  
  // Try to detect the chain from the address if not provided
  let detectedChain = chainHint ? normalizeChain(chainHint) : detectChain(cleanedInput);
  
  // First, try to get pair info directly (assuming it's a pair address)
  if (chainHint || cleanedInput.startsWith('0x')) {
    try {
      const pairUrl = `https://api.dexscreener.com/latest/dex/pairs/${detectedChain}/${cleanedInput}`;
      console.log(`Trying pair URL: ${pairUrl}`);
      
      const pairRes = await fetch(pairUrl);
      if (pairRes.ok) {
        const pairData = await pairRes.json();
        console.log('Pair API Response:', JSON.stringify(pairData, null, 2));
        
        if (pairData.pair) {
          return formatPairData(pairData.pair);
        }
      }
    } catch (error) {
      console.log('Pair lookup failed, trying token lookup...');
    }
  }
  
  // If pair lookup failed, try token lookup
  try {
    const tokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${cleanedInput}`;
    console.log(`Trying token URL: ${tokenUrl}`);
    
    const tokenRes = await fetch(tokenUrl);
    
    if (!tokenRes.ok) {
      throw new Error(`DexScreener API responded with status ${tokenRes.status} ${tokenRes.statusText}`);
    }
    
    const tokenData = await tokenRes.json();
    console.log('Token API Response:', JSON.stringify(tokenData, null, 2));
    
    if (!tokenData.pairs || tokenData.pairs.length === 0) {
      throw new Error(`No trading pairs found for address: ${cleanedInput}`);
    }
    
    // Filter by chain if specified
    let pairs = tokenData.pairs;
    if (chainHint) {
      const normalizedChain = normalizeChain(chainHint);
      pairs = pairs.filter((pair: any) => 
        pair.chainId === normalizedChain || 
        pair.chainId === chainHint.toLowerCase()
      );
    }
    
    if (pairs.length === 0) {
      throw new Error(`No pairs found for token on chain: ${chainHint || 'any'}`);
    }
    
    // Use the pair with highest liquidity
    const bestPair = pairs.sort((a: any, b: any) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];
    
    return formatPairData(bestPair);
    
  } catch (error) {
    console.error('Token lookup failed:', error);
    
    // Final fallback: try search
    try {
      const searchUrl = `https://api.dexscreener.com/latest/dex/search/?q=${cleanedInput}`;
      console.log(`Trying search URL: ${searchUrl}`);
      
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        
        if (searchData.pairs && searchData.pairs.length > 0) {
          const bestPair = searchData.pairs[0];
          return formatPairData(bestPair);
        }
      }
    } catch (searchError) {
      console.error('Search failed:', searchError);
    }
    
    throw new Error(`Unable to find token/pair data for: ${cleanedInput}`);
  }
};

const formatPairData = (pair: any) => {
  const {
    baseToken,
    quoteToken,
    priceUsd,
    liquidity,
    volume,
    txns,
    chainId,
    dexId,
    pairAddress,
    priceChange,
    fdv,
    marketCap,
    pairCreatedAt,
    url
  } = pair;

  // Handle different time period structures
  const volume24h = volume?.h24 || volume?.['24h'] || 0;
  const txns24h = txns?.h24 || txns?.['24h'] || { buys: 0, sells: 0 };
  const priceChange24h = priceChange?.h24 || priceChange?.['24h'] || 0;

  // Format creation date safely
  const createdAt = pairCreatedAt ? new Date(pairCreatedAt * 1000).toLocaleDateString() : 'Unknown';

  // Ensure all numeric values are valid numbers
  const safeVolume24h = typeof volume24h === 'number' && !isNaN(volume24h) ? volume24h : 0;
  const safeLiquidityUsd = typeof liquidity?.usd === 'number' && !isNaN(liquidity.usd) ? liquidity.usd : 0;
  const safePriceChange24h = typeof priceChange24h === 'number' && !isNaN(priceChange24h) ? priceChange24h : 0;
  const safeFdv = typeof fdv === 'number' && !isNaN(fdv) ? fdv : 0;
  const safeMarketCap = typeof marketCap === 'number' && !isNaN(marketCap) ? marketCap : 0;
  const safePairCreatedAt = typeof pairCreatedAt === 'number' && !isNaN(pairCreatedAt) ? pairCreatedAt : 0;

  return {
    summary: `
🔍 **Token Pair**: ${baseToken?.symbol || 'Unknown'}/${quoteToken?.symbol || 'Unknown'}
🌐 **Chain**: ${chainId || 'Unknown'}
🏪 **Exchange**: ${dexId || 'Unknown'}
📍 **Pair Address**: ${pairAddress || 'Unknown'}
🔗 **DexScreener URL**: ${url || 'N/A'}

💰 **Price**: ${priceUsd || '0'}
📈 **24h Change**: ${safePriceChange24h > 0 ? '+' : ''}${safePriceChange24h.toFixed(2)}%
💧 **Liquidity**: ${safeLiquidityUsd.toLocaleString()}
📊 **24h Volume**: ${safeVolume24h.toLocaleString()}
🔄 **24h Transactions**: Buys: ${txns24h.buys || 0}, Sells: ${txns24h.sells || 0}

📋 **Market Data**:
💎 **FDV**: ${safeFdv.toLocaleString()}
🏛️ **Market Cap**: ${safeMarketCap.toLocaleString()}
📅 **Pair Created**: ${createdAt}

🪙 **Base Token**: ${baseToken?.name || 'Unknown'} (${baseToken?.symbol || 'Unknown'})
📍 **Base Address**: ${baseToken?.address || 'Unknown'}
🪙 **Quote Token**: ${quoteToken?.name || 'Unknown'} (${quoteToken?.symbol || 'Unknown'})
📍 **Quote Address**: ${quoteToken?.address || 'Unknown'}
    `,
    liquidityUsd: safeLiquidityUsd,
    buys: txns24h.buys || 0,
    sells: txns24h.sells || 0,
    volume24h: safeVolume24h,
    priceChange24h: safePriceChange24h,
    chainId: chainId || 'unknown',
    dexId: dexId || 'unknown',
    pairAddress: pairAddress || 'unknown',
    priceUsd: priceUsd || '0',
    fdv: safeFdv,
    marketCap: safeMarketCap,
    dexscreenerUrl: url || '',
    pairCreatedAt: safePairCreatedAt,
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
};

export const getTokenInfoTool = createTool({
  id: "getTokenInfoTool",
  description: "Fetch comprehensive token pair stats using DexScreener API. Works with any token address, pair address, or token symbol from any supported chain (Ethereum, Solana, BSC, Polygon, Arbitrum, etc.). Just copy the address from DexScreener and paste it here!",
  inputSchema: z.object({
    pairId: z.string().describe("Token address, pair address, or token symbol (e.g., 0x123..., EPjFW..., or WETH)"),
    chain: z.string().optional().describe("Optional chain hint: ethereum, solana, bsc, polygon, arbitrum, optimism, avalanche, etc.")
  }),
  outputSchema: z.object({
    summary: z.string(),
    liquidityUsd: z.number(),
    buys: z.number(),
    sells: z.number(),
    volume24h: z.number(),
    priceChange24h: z.number(),
    chainId: z.string(),
    dexId: z.string(),
    pairAddress: z.string(),
    priceUsd: z.string(),
    fdv: z.number(),
    marketCap: z.number(),
    dexscreenerUrl: z.string(),
    pairCreatedAt: z.number(),
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
    return await getTokenInfo(context.pairId, context.chain);
  },
});

// Search function for finding tokens by symbol
export const searchTokensBySymbol = async (symbol: string, chainId?: string) => {
  const url = `https://api.dexscreener.com/latest/dex/search/?q=${symbol}`;
  
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`DexScreener API responded with status ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      throw new Error(`No pairs found for symbol: ${symbol}`);
    }

    // Filter by chain if specified
    let pairs = data.pairs;
    if (chainId) {
      const normalizedChain = normalizeChain(chainId);
      pairs = pairs.filter((pair: any) => 
        pair.chainId === normalizedChain || 
        pair.chainId === chainId.toLowerCase()
      );
    }

    if (pairs.length === 0) {
      throw new Error(`No pairs found for symbol ${symbol} on chain ${chainId}`);
    }

    // Return pairs sorted by liquidity
    return pairs.sort((a: any, b: any) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    );
  } catch (error) {
    console.error('Error searching tokens by symbol:', error);
    throw error;
  }
};

// Helper function with test addresses for different chains
export const getTestAddresses = () => {
  return {
    ethereum: {
      // Token addresses
      weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      usdc: "0xA0b86a33E6FB06c29292F4a4f13af86d7B6a1b9d",
      usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      // Pair addresses
      weth_usdc: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
      weth_usdt: "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36"
    },
    solana: {
      // Token addresses
      sol: "So11111111111111111111111111111111111111112",
      usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      usdt: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      // Example pair (SOL/USDC on Raydium)
      sol_usdc: "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"
    },
    bsc: {
      // Token addresses
      wbnb: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      usdt: "0x55d398326f99059fF775485246999027B3197955",
      busd: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    }
  };
};

