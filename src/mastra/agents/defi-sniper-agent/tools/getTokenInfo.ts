import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Improved DexScreener fetch + formatter
const getTokenInfo = async (pairId: string) => {
  // const url = `https://api.dexscreener.com/latest/dex/pairs/${pairId}`;
  const url = `https://api.dexscreener.com/latest/dex/pairs/?pairAddress=${pairId}`;


  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(
      `DexScreener API responded with status ${res.status} ${res.statusText}`,
    );
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text(); // log the actual HTML page or error
    console.error("Expected JSON, got:", text.slice(0, 500));
    throw new Error("Unexpected response format from DexScreener");
  }

  const data = await res.json();

  if (!data.pair) {
    throw new Error("Token pair not found. Please check the pair ID.");
  }

  const {
    baseToken,
    quoteToken,
    priceUsd,
    liquidity,
    volume24h,
    txns,
  } = data.pair;

  return {
    summary: `
🔍 Token Pair: ${baseToken.symbol}/${quoteToken.symbol}
💰 Price: $${priceUsd}
💧 Liquidity: $${liquidity.usd}
📈 24h Volume: $${volume24h}
📊 24h Txns: Buys: ${txns.h24.buys}, Sells: ${txns.h24.sells}
    `,
    liquidityUsd: liquidity.usd,
    buys: txns.h24.buys,
    sells: txns.h24.sells,
    volume24h,
  };
};

export const getTokenInfoTool = createTool({
  id: "getTokenInfoTool",
  description: "Fetch token pair stats using DexScreener API",
  inputSchema: z.object({
    pairId: z.string().describe("DexScreener token pair ID"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    liquidityUsd: z.number(),
    buys: z.number(),
    sells: z.number(),
    volume24h: z.number(),
  }),
  execute: async ({ context }) => {
    return await getTokenInfo(context.pairId);
  },
});
