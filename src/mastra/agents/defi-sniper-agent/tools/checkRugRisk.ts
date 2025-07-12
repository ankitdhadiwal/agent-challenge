// import { createTool } from "@mastra/core/tools";
// import { z } from "zod";

// // Basic rug-risk logic
// const checkRisk = ({
//   liquidityUsd,
//   buys,
//   sells,
//   volume24h,
// }: {
//   liquidityUsd: number;
//   buys: number;
//   sells: number;
//   volume24h: number;
// }) => {
//   let risk = 0;
//   if (liquidityUsd < 5000) risk++;
//   if (sells > buys * 2) risk++;
//   if (volume24h < 1000) risk++;

//   if (risk === 0) return "🟢 Low rug risk – metrics look solid.";
//   if (risk === 1) return "🟡 Medium rug risk – keep an eye.";
//   return "🔴 High rug risk – proceed with caution!";
// };

// export const checkRugRiskTool = createTool({
//   id: "checkRugRiskTool",
//   description: "Assesses rugpull risk using liquidity, txns, and volume.",
//   inputSchema: z.object({
//     liquidityUsd: z.number().describe("Total USD liquidity"),
//     buys: z.number().describe("Number of buys in 24h"),
//     sells: z.number().describe("Number of sells in 24h"),
//     volume24h: z.number().describe("24h trading volume in USD"),
//   }),
//   outputSchema: z.object({
//     verdict: z.string(),
//   }),
//   execute: async ({ context }) => {
//     const verdict = checkRisk(context);
//     return { verdict };
//   },
// });


import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Enhanced rug-risk logic with more sophisticated scoring
const checkRisk = ({
  liquidityUsd,
  buys,
  sells,
  volume24h,
  baseToken,
  quoteToken,
  chainId,
  dexId,
}: {
  liquidityUsd: number;
  buys: number;
  sells: number;
  volume24h: number;
  baseToken?: { address: string; name: string; symbol: string };
  quoteToken?: { address: string; name: string; symbol: string };
  chainId?: string;
  dexId?: string;
}) => {
  let riskScore = 0;
  const riskFactors: string[] = [];
  
  // Liquidity Analysis
  if (liquidityUsd < 1000) {
    riskScore += 3;
    riskFactors.push("🔴 Extremely low liquidity (<$1K)");
  } else if (liquidityUsd < 10000) {
    riskScore += 2;
    riskFactors.push("🟡 Low liquidity (<$10K)");
  } else if (liquidityUsd < 50000) {
    riskScore += 1;
    riskFactors.push("🟡 Moderate liquidity (<$50K)");
  } else {
    riskFactors.push("🟢 Good liquidity (>$50K)");
  }
  
  // Trading Activity Analysis
  const totalTxns = buys + sells;
  if (totalTxns < 10) {
    riskScore += 2;
    riskFactors.push("🔴 Very low trading activity");
  } else if (totalTxns < 50) {
    riskScore += 1;
    riskFactors.push("🟡 Low trading activity");
  } else {
    riskFactors.push("🟢 Active trading");
  }
  
  // Sell Pressure Analysis
  if (buys > 0) {
    const sellRatio = sells / buys;
    if (sellRatio > 3) {
      riskScore += 3;
      riskFactors.push("🔴 Heavy sell pressure (3x+ more sells)");
    } else if (sellRatio > 2) {
      riskScore += 2;
      riskFactors.push("🟡 High sell pressure (2x+ more sells)");
    } else if (sellRatio > 1.5) {
      riskScore += 1;
      riskFactors.push("🟡 Moderate sell pressure");
    } else {
      riskFactors.push("🟢 Balanced buy/sell ratio");
    }
  }
  
  // Volume Analysis
  if (volume24h < 500) {
    riskScore += 2;
    riskFactors.push("🔴 Very low volume (<$500)");
  } else if (volume24h < 5000) {
    riskScore += 1;
    riskFactors.push("🟡 Low volume (<$5K)");
  } else {
    riskFactors.push("🟢 Decent volume (>$5K)");
  }
  
  // Volume to Liquidity Ratio
  if (liquidityUsd > 0) {
    const volumeToLiquidityRatio = volume24h / liquidityUsd;
    if (volumeToLiquidityRatio > 2) {
      riskScore += 1;
      riskFactors.push("🟡 High volume/liquidity ratio (potential volatility)");
    } else if (volumeToLiquidityRatio < 0.01) {
      riskScore += 1;
      riskFactors.push("🟡 Very low volume/liquidity ratio (low activity)");
    }
  }
  
  // Token Analysis
  if (baseToken && quoteToken) {
    // Check if paired with major tokens (WETH, USDC, USDT, etc.)
    const majorTokens = ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC'];
    const isPairedWithMajor = majorTokens.includes(baseToken.symbol) || majorTokens.includes(quoteToken.symbol);
    
    if (isPairedWithMajor) {
      riskFactors.push("🟢 Paired with major token");
    } else {
      riskScore += 1;
      riskFactors.push("🟡 Not paired with major stable token");
    }
  }
  
  // DEX Analysis
  if (dexId) {
    const majorDexes = ['uniswap', 'pancakeswap', 'sushiswap'];
    if (majorDexes.some(dex => dexId.toLowerCase().includes(dex))) {
      riskFactors.push("🟢 Listed on major DEX");
    } else {
      riskScore += 1;
      riskFactors.push("🟡 Listed on smaller DEX");
    }
  }
  
  // Calculate risk level
  let verdict: string;
  let riskLevel: string;
  
  if (riskScore <= 2) {
    verdict = "🟢 LOW RUG RISK";
    riskLevel = "Low";
  } else if (riskScore <= 5) {
    verdict = "🟡 MEDIUM RUG RISK";
    riskLevel = "Medium";
  } else if (riskScore <= 8) {
    verdict = "🟠 HIGH RUG RISK";
    riskLevel = "High";
  } else {
    verdict = "🔴 EXTREME RUG RISK";
    riskLevel = "Extreme";
  }
  
  return {
    verdict,
    riskLevel,
    riskScore,
    maxScore: 15,
    riskFactors,
    recommendation: getRiskRecommendation(riskLevel, riskScore),
  };
};

const getRiskRecommendation = (riskLevel: string, riskScore: number): string => {
  switch (riskLevel) {
    case "Low":
      return "✅ Metrics look solid. Consider for investment but always DYOR.";
    case "Medium":
      return "⚠️ Some concerns present. Proceed with caution and smaller position size.";
    case "High":
      return "🚨 Multiple red flags detected. High risk of rugpull - avoid or use extreme caution.";
    case "Extreme":
      return "🛑 DANGER! Multiple critical issues. Strongly advise against investment.";
    default:
      return "❓ Unable to determine risk level.";
  }
};

export const checkRugRiskTool = createTool({
  id: "checkRugRiskTool",
  description: "Comprehensive rugpull risk assessment using multiple DeFi metrics including liquidity, trading patterns, volume analysis, and token pairing.",
  inputSchema: z.object({
    liquidityUsd: z.number().describe("Total USD liquidity"),
    buys: z.number().describe("Number of buys in 24h"),
    sells: z.number().describe("Number of sells in 24h"),
    volume24h: z.number().describe("24h trading volume in USD"),
    baseToken: z.object({
      address: z.string(),
      name: z.string(),
      symbol: z.string()
    }).optional().describe("Base token information"),
    quoteToken: z.object({
      address: z.string(),
      name: z.string(),
      symbol: z.string()
    }).optional().describe("Quote token information"),
    chainId: z.string().optional().describe("Blockchain chain ID"),
    dexId: z.string().optional().describe("DEX identifier"),
  }),
  outputSchema: z.object({
    verdict: z.string(),
    riskLevel: z.string(),
    riskScore: z.number(),
    maxScore: z.number(),
    riskFactors: z.array(z.string()),
    recommendation: z.string(),
  }),
  execute: async ({ context }) => {
    return checkRisk(context);
  },
});